# College Search API Flow

## Overview
After user creates complete profile (budget, GPA, major, locations, test scores), clicking "Find Colleges" triggers sequential API calls to College Scorecard → Claude AI → Database.

---

## Complete Request Flow

### 1. Frontend Trigger
**File:** `app/search/page.tsx`

```
User clicks "Find Colleges" button
  ↓
Frontend calls: useAction(api.actions.findColleges.findColleges)
  ↓
Sends: { profileId: profile._id }
  ↓
Loading state: 10-20 seconds
```

---

### 2. Backend Action Starts
**File:** `convex/actions/findColleges.ts`

**Step 1: Get Profile Data**
```
ctx.runQuery(api.studentProfile.getProfileById, { profileId })
  ↓
Returns:
- budget: number
- income: number
- major: string
- gpa: number
- testScores: { sat?, act? }
- locationPreferences: string[] (state codes)
- extracurriculars: string[]
- userId: Id<"users">
```

---

### 3. College Scorecard API Call
**Function:** `fetchCollegesFromScorecard()`

**API Details:**
- **Endpoint:** `https://api.data.gov/ed/collegescorecard/v1/schools`
- **Method:** GET
- **Auth:** API key in query param

**Request Params:**
```javascript
{
  api_key: process.env.COLLEGE_SCORECARD_API_KEY,
  fields: "id,school.name,school.city,school.state,school.school_url,
           latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,
           latest.admissions.admission_rate.overall,
           latest.admissions.sat_scores.average.overall,
           latest.admissions.act_scores.midpoint.cumulative,
           latest.student.size",
  "school.operating": "1",                                    // Only operating schools
  "latest.cost.tuition.in_state__range": "0..{budget}",     // Filter by budget
  "school.degrees_awarded.predominant__range": "2..3",       // Associate's + Bachelor's
  "latest.student.size__range": "1..",                       // Must have students
  "school.state": "CA,NY,TX",                                // User's preferred states
  per_page: "100",                                           // Max 100 results
  page: "0",
  _sort: "latest.cost.tuition.in_state:asc"                 // Cheapest first
}
```

**Response Processing:**
```
API returns JSON → data.results[]
  ↓
Filter: Only colleges with valid name + tuition
  ↓
Map to College[] interface:
{
  id: string
  name: string
  city: string
  state: string
  tuitionInState: number
  tuitionOutOfState: number
  admissionRate: number
  avgSAT: number
  avgACT: number
  studentSize: number
  url: string
}
  ↓
Returns: College[] (0-100 colleges)
```

**Error Handling:**
- Retry logic: 3 attempts with 1s, 2s, 3s delays
- Retries on 500/502/503 errors
- Budget capped at $80,000 max (API limitation)

**Time:** ~1-3 seconds

---

### 4. Claude AI Analysis
**Function:** `analyzeWithClaude(profile, colleges)`

**API Details:**
- **SDK:** `@anthropic-ai/sdk`
- **Model:** `claude-haiku-4-5` (fast, cost-effective)
- **Max Tokens:** 8,192
- **Auth:** `ANTHROPIC_API_KEY` env var

**Request Structure:**
```javascript
anthropic.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 8192,
  messages: [{
    role: "user",
    content: `You are expert college advisor...

    STUDENT PROFILE:
    - Budget: $20,000/year
    - GPA: 3.5
    - SAT: 1200
    - Major: Computer Science
    - Locations: CA, NY
    - Income: $50,000
    - Extracurriculars: Soccer, Debate

    COLLEGES TO ANALYZE (45 total):
    [{ id, name, city, state, tuitionInState, admissionRate, ... }, ...]

    TASK:
    Rank ALL colleges with COST as #1 priority:

    Weights:
    - Cost: 50%
    - Academic match: 25% (admission likelihood based on GPA/scores)
    - Location preference: 15%
    - Program/major fit: 10%

    For each college provide:
    1. rank (1 = best)
    2. costRating: "Excellent" (<50% budget), "Good" (50-75%), "Fair" (75-100%)
    3. fitScore (0-100)
    4. analysis (2-3 sentences)

    Return ONLY JSON array:
    [
      {
        "id": "college_id",
        "rank": 1,
        "costRating": "Excellent",
        "fitScore": 92,
        "analysis": "This college..."
      },
      ...
    ]`
  }]
})
```

**Response Processing:**
```
Claude returns message.content[]
  ↓
Extract text block
  ↓
Parse JSON from response (handles markdown wrapping)
  ↓
Merge ranked data with original College[] data:
{
  ...originalCollegeData,
  rank: number,
  costRating: string,
  fitScore: number,
  analysis: string
}
  ↓
Sort by rank (ascending)
  ↓
Returns: {
  fullAnalysis: string,      // Raw Claude response
  rankedColleges: RankedCollege[]
}
```

**Error Handling:**
- 429 Rate Limit → "AI service temporarily busy"
- 401/403 Auth → "Authentication failed"
- Invalid JSON → "Failed to parse AI analysis"
- Generic error → Original error message

**Time:** ~5-15 seconds (depends on college count)

---

### 5. Save to Database
**Function:** `ctx.runMutation(api.mutations.searchResults.saveSearchResult)`

**File:** `convex/mutations/searchResults.ts`

**Data Saved:**
```javascript
{
  userId: Id<"users">,
  profileId: Id<"studentProfiles">,
  colleges: College[],                // Raw College Scorecard data
  claudeAnalysis: string,             // Full Claude response text
  rankedColleges: RankedCollege[],   // Merged + ranked data
  searchFilters: {
    budget: number,
    states: string[],
    major: string
  },
  createdAt: timestamp
}
```

**Returns:** `searchResultId: Id<"searchResults">`

**Time:** <1 second

---

### 6. Frontend Response
**File:** `app/search/page.tsx`

```
Action returns: { searchResultId }
  ↓
router.push(`/results/${searchResultId}`)
  ↓
Loads results page
```

---

### 7. Display Results
**File:** `app/results/[id]/ResultsContent.tsx`

**Data Fetch:**
```
useQuery(api.queries.searchResults.getSearchResultById, { searchResultId })
  ↓
Returns: {
  rankedColleges: RankedCollege[],
  searchFilters: { budget, states, major },
  claudeAnalysis: string,
  colleges: College[]
}
  ↓
Renders ranked college cards sorted by rank
```

**Each College Card Shows:**
- Rank badge (#1, #2, #3...)
- Name, city, state
- Annual tuition (green)
- Cost rating badge (color-coded: green/blue/yellow)
- Fit score badge (purple, 0-100)
- AI analysis (2-3 sentences)
- Stats grid: admission rate, avg SAT/ACT, student size
- Website link

---

## Complete Timeline

```
User clicks "Find Colleges"
    ↓
[0s] Frontend → Convex Action
    ↓
[0-1s] Get Profile from DB
    ↓
[1-4s] College Scorecard API
    ├─ Request with filters
    ├─ Retry logic (3 attempts)
    └─ Returns 0-100 colleges
    ↓
[4-19s] Claude AI Analysis
    ├─ Send profile + colleges
    ├─ Model: claude-haiku-4-5
    ├─ Process ranking algorithm
    ├─ Generate analysis text
    └─ Return JSON rankings
    ↓
[19-20s] Save to Database
    ├─ Insert searchResults record
    └─ Return searchResultId
    ↓
[20s] Redirect to Results Page
    ↓
Results Display (instant - from DB)
```

**Total Time:** 10-20 seconds

---

## API Call Sequence Diagram

```
┌─────────────┐
│   FRONTEND  │
│  (Search)   │
└──────┬──────┘
       │ Click "Find Colleges"
       │
       ▼
┌─────────────────────────────────────────────┐
│   CONVEX ACTION: findColleges              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 1. Get Profile (Convex DB Query)     │ │
│  │    → Returns student profile data    │ │
│  └───────────────────────────────────────┘ │
│                   ↓                         │
│  ┌───────────────────────────────────────┐ │
│  │ 2. College Scorecard API             │ │
│  │    GET api.data.gov/ed/...           │ │
│  │    ┌─────────────────────────────┐   │ │
│  │    │ Filters:                    │   │ │
│  │    │ - tuition ≤ budget          │   │ │
│  │    │ - states in preferences     │   │ │
│  │    │ - operating schools         │   │ │
│  │    │ - sort by tuition asc       │   │ │
│  │    └─────────────────────────────┘   │ │
│  │    ← Returns College[] (max 100)     │ │
│  └───────────────────────────────────────┘ │
│                   ↓                         │
│  ┌───────────────────────────────────────┐ │
│  │ 3. Anthropic Claude API              │ │
│  │    POST api.anthropic.com/v1/msgs    │ │
│  │    ┌─────────────────────────────┐   │ │
│  │    │ Model: claude-haiku-4-5     │   │ │
│  │    │ Input: Profile + Colleges   │   │ │
│  │    │ Task: Rank by cost (50%)    │   │ │
│  │    │       + academic (25%)      │   │ │
│  │    │       + location (15%)      │   │ │
│  │    │       + major (10%)         │   │ │
│  │    └─────────────────────────────┘   │ │
│  │    ← Returns JSON rankings           │ │
│  └───────────────────────────────────────┘ │
│                   ↓                         │
│  ┌───────────────────────────────────────┐ │
│  │ 4. Save Results (Convex DB Mutation) │ │
│  │    → Insert searchResults record     │ │
│  │    ← Returns searchResultId          │ │
│  └───────────────────────────────────────┘ │
│                                             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
       ┌─────────────────────┐
       │  FRONTEND           │
       │  (Results Page)     │
       │  Query: Get Result  │
       │  Display: Ranked    │
       │           Colleges  │
       └─────────────────────┘
```

---

## Key Implementation Details

### College Scorecard Filtering
- Budget enforcement: `latest.cost.tuition.in_state__range: "0..{budget}"`
- Only colleges user can afford included
- State filtering: comma-separated state codes
- Degree level: Associates + Bachelors only
- Operating schools only (excludes closed schools)
- Sorted by affordability (cheapest first)

### Claude Ranking Algorithm
**Weighted Scoring:**
1. **Cost (50% weight)** - Primary factor
   - Compare tuition to budget
   - Lower cost = higher score

2. **Academic Match (25% weight)**
   - Compare student GPA to college avg
   - Compare SAT/ACT to college avg
   - Higher match = better admission chance

3. **Location (15% weight)**
   - Check if in preferred states
   - In preferred state = bonus points

4. **Major/Program (10% weight)**
   - Basic major availability check
   - Mentioned in prompt for context

**Cost Rating Logic:**
- Excellent: Tuition < 50% of budget
- Good: Tuition 50-75% of budget
- Fair: Tuition 75-100% of budget

**Fit Score Calculation:**
- Scale: 0-100
- Combines all weighted factors
- Higher score = better overall fit

### Error Recovery
**College Scorecard:**
- 3 retry attempts with exponential backoff
- Handles 500/502/503 server errors
- Budget capping prevents API failures

**Claude API:**
- Handles rate limits (429)
- Authentication errors (401/403)
- JSON parsing with regex extraction
- Fallback error messages

---

## Environment Variables Required

```bash
# College Scorecard
COLLEGE_SCORECARD_API_KEY=adj2lngXgMXJwuG1Y6i91cvYYI1jg9O7dG13sC10

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Set in Convex dashboard (not `.env.local` - actions run on server)

---

## Cost Analysis

### Per Search:
- **College Scorecard API:** Free (1000 requests/hour limit)
- **Claude API (Haiku 4.5):**
  - Input: ~2,000-5,000 tokens (profile + colleges)
  - Output: ~1,000-2,000 tokens (rankings)
  - Cost: ~$0.01-$0.05 per search

### Monthly (100 users, 3 searches each):
- College Scorecard: Free
- Claude: ~$3-$15 total

---

## Debug Logging

All API calls include detailed console logging:

```
=================================================================================
🏫 COLLEGE SCORECARD API REQUEST
=================================================================================
🔍 SEARCH FILTERS: {...}
🌐 API URL: https://...
📋 REQUEST PARAMS: {...}
=================================================================================

⏳ Calling College Scorecard API...

=================================================================================
✅ COLLEGE SCORECARD API RESPONSE
=================================================================================
📊 RESPONSE METADATA: { total_results, returned_results }
=================================================================================

=================================================================================
🤖 CLAUDE API REQUEST
=================================================================================
📝 SYSTEM PROMPT: [full prompt]
🔧 API CONFIG: { model, max_tokens, timestamp }
=================================================================================

⏳ Calling Claude API...

=================================================================================
✅ CLAUDE API RESPONSE
=================================================================================
📊 RESPONSE METADATA: { id, model, usage }
💬 RESPONSE CONTENT: [full response]
=================================================================================
```

View logs in Convex dashboard → Functions → findColleges → Logs

---

## Common Issues & Solutions

### "No colleges found"
- Budget too low for selected states
- Invalid state codes
- All colleges in state exceed budget
→ Increase budget or expand states

### "AI service temporarily busy" (429)
- Claude rate limit hit
- Wait 30-60 seconds
→ Implement request queuing (future enhancement)

### Timeout errors
- Too many colleges (>100)
- Claude processing slow
→ Already limited to 100, use Haiku model (faster)

### Invalid JSON from Claude
- Rare parsing issue
- Regex extraction handles most cases
→ Logged for debugging

---

## Future Optimizations

1. **Caching:** Save College Scorecard results for common filters (reduce API calls)
2. **Pagination:** Handle >100 colleges with multiple API calls
3. **Streaming:** Use Claude streaming for real-time progress updates
4. **Batch Processing:** Queue multiple search requests
5. **Result Comparison:** Save multiple searches, compare side-by-side
