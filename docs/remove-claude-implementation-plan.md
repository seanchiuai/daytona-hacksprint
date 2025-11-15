# Implementation Plan: Remove Claude, Sort by Admission Rate

## Goal
Remove Anthropic Claude API from college search workflow. Sort colleges by admission rate (most selective first). Results return in 1-3 seconds instead of 10-20 seconds.

---

## Changes Required

### 1. College Scorecard API Call
**File:** `convex/actions/findColleges.ts`

**Changes:**
- Change sort parameter from `tuition:asc` to `admission_rate:asc`
- Remove entire `analyzeWithClaude()` function
- Remove Anthropic SDK import
- Remove all Claude-related code

**Before:**
```javascript
_sort: "latest.cost.tuition.in_state:asc"
```

**After:**
```javascript
_sort: "latest.admissions.admission_rate.overall:asc"
```

---

### 2. Data Types
**File:** `convex/actions/findColleges.ts`

**Remove:**
```typescript
interface RankedCollege extends College {
  rank: number;
  costRating: string;
  fitScore: number;
  analysis: string;
}
```

**Keep only:**
```typescript
interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  tuitionInState: number;
  tuitionOutOfState: number;
  admissionRate: number;
  avgSAT: number;
  avgACT: number;
  studentSize: number;
  url: string;
}
```

---

### 3. Action Handler
**File:** `convex/actions/findColleges.ts`

**Remove steps 3-4 (Claude analysis):**
```javascript
// DELETE THIS:
console.log("Analyzing colleges with Claude AI...");
const aiAnalysis = await analyzeWithClaude(profile, colleges);
```

**Simplified handler:**
```javascript
export const findColleges = action({
  args: {
    profileId: v.id("studentProfiles"),
  },
  handler: async (ctx, args): Promise<{ searchResultId: string }> => {
    // 1. Get student profile
    const profile = await ctx.runQuery(api.studentProfile.getProfileById, {
      profileId: args.profileId,
    });

    if (!profile) {
      throw new Error("Profile not found");
    }

    // 2. Fetch colleges from College Scorecard API (sorted by admission rate)
    console.log("Fetching colleges from College Scorecard...");
    const colleges = await fetchCollegesFromScorecard({
      budget: profile.budget,
      states: profile.locationPreferences,
      major: profile.major,
    });

    if (colleges.length === 0) {
      throw new Error(
        "No colleges found matching your criteria. Try adjusting your budget or location preferences."
      );
    }

    console.log(`Found ${colleges.length} matching colleges`);

    // 3. Save results to database (no AI analysis)
    const searchResultId = await ctx.runMutation(
      api.mutations.searchResults.saveSearchResult,
      {
        userId: profile.userId,
        profileId: args.profileId,
        colleges: colleges,
        searchFilters: {
          budget: profile.budget,
          states: profile.locationPreferences,
          major: profile.major,
        },
      }
    );

    return { searchResultId };
  },
});
```

---

### 4. Database Schema
**File:** `convex/schema.ts`

**Current searchResults table:**
```javascript
searchResults: defineTable({
  userId: v.id("users"),
  profileId: v.id("studentProfiles"),
  colleges: v.array(v.any()),
  claudeAnalysis: v.string(),        // REMOVE
  rankedColleges: v.array(v.any()),  // REMOVE
  searchFilters: v.object({
    budget: v.number(),
    states: v.array(v.string()),
    major: v.string(),
  }),
  createdAt: v.number(),
})
```

**Updated schema:**
```javascript
searchResults: defineTable({
  userId: v.id("users"),
  profileId: v.id("studentProfiles"),
  colleges: v.array(v.any()),  // Only field needed
  searchFilters: v.object({
    budget: v.number(),
    states: v.array(v.string()),
    major: v.string(),
  }),
  createdAt: v.number(),
})
```

---

### 5. Save Mutation
**File:** `convex/mutations/searchResults.ts`

**Remove AI fields from args:**

**Before:**
```javascript
export const saveSearchResult = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("studentProfiles"),
    colleges: v.array(v.any()),
    claudeAnalysis: v.string(),      // REMOVE
    rankedColleges: v.array(v.any()), // REMOVE
    searchFilters: v.object({
      budget: v.number(),
      states: v.array(v.string()),
      major: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const searchResultId = await ctx.db.insert("searchResults", {
      userId: args.userId,
      profileId: args.profileId,
      colleges: args.colleges,
      claudeAnalysis: args.claudeAnalysis,      // REMOVE
      rankedColleges: args.rankedColleges,      // REMOVE
      searchFilters: args.searchFilters,
      createdAt: Date.now(),
    });

    return searchResultId;
  },
});
```

**After:**
```javascript
export const saveSearchResult = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("studentProfiles"),
    colleges: v.array(v.any()),
    searchFilters: v.object({
      budget: v.number(),
      states: v.array(v.string()),
      major: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const searchResultId = await ctx.db.insert("searchResults", {
      userId: args.userId,
      profileId: args.profileId,
      colleges: args.colleges,
      searchFilters: args.searchFilters,
      createdAt: Date.now(),
    });

    return searchResultId;
  },
});
```

---

### 6. Results Query
**File:** `convex/queries/searchResults.ts`

**No changes needed** - query just returns whatever is in database

---

### 7. Results UI
**File:** `app/results/[id]/ResultsContent.tsx`

**Remove AI-specific fields from interface:**

**Before:**
```typescript
interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  tuitionInState: number;
  admissionRate: number;
  avgSAT?: number;
  avgACT?: number;
  studentSize: number;
  url: string;
  rank: number;              // REMOVE
  costRating: "Excellent" | "Good" | "Fair";  // REMOVE
  fitScore: number;          // REMOVE
  analysis: string;          // REMOVE
}
```

**After:**
```typescript
interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  tuitionInState: number;
  admissionRate: number;
  avgSAT?: number;
  avgACT?: number;
  studentSize: number;
  url: string;
}
```

**Update data access:**

**Before:**
```javascript
const { rankedColleges, searchFilters } = searchResult;
```

**After:**
```javascript
const { colleges, searchFilters } = searchResult;
```

**Update render:**

**Before:**
```javascript
{rankedColleges.map((college: College) => (
```

**After:**
```javascript
{colleges.map((college: College, index: number) => (
```

**Update college card - remove AI elements:**

**Remove:**
```jsx
<div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
  #{college.rank}
</div>
```

**Add simple index:**
```jsx
<div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
  #{index + 1}
</div>
```

**Remove cost rating and fit score badges:**
```jsx
{/* DELETE THIS ENTIRE SECTION */}
<div className="flex gap-4 mb-3">
  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${...}`}>
    {college.costRating} Value
  </span>
  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
    Fit Score: {college.fitScore}/100
  </span>
</div>
```

**Remove analysis text:**
```jsx
{/* DELETE THIS */}
<p className="text-gray-700 mb-4">{college.analysis}</p>
```

**Update results count text:**

**Before:**
```jsx
Found {rankedColleges.length} colleges ranked by affordability and fit
```

**After:**
```jsx
Found {colleges.length} colleges sorted by selectivity (most competitive first)
```

---

### 8. Search Page
**File:** `app/search/page.tsx`

**Update loading messages:**

**Before:**
```jsx
{isSearching && (
  <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
    <p>🔍 Searching College Scorecard database...</p>
    <p>🤖 AI is analyzing matches...</p>
    <p>📊 Ranking by affordability...</p>
  </div>
)}
```

**After:**
```jsx
{isSearching && (
  <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
    <p>🔍 Searching College Scorecard database...</p>
    <p>📊 Sorting by selectivity...</p>
  </div>
)}
```

**Update button text:**

**Before:**
```jsx
Finding colleges... This may take 10-20 seconds
```

**After:**
```jsx
Finding colleges... This may take a few seconds
```

---

### 9. Environment Variables
**File:** `.env.local` and Convex dashboard

**Can remove (no longer needed):**
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Keep:**
```
COLLEGE_SCORECARD_API_KEY=adj2lngXgMXJwuG1Y6i91cvYYI1jg9O7dG13sC10
```

---

### 10. Package Dependencies
**File:** `package.json`

**Can remove (optional):**
```json
"@anthropic-ai/sdk": "^0.x.x"
```

Run:
```bash
npm uninstall @anthropic-ai/sdk
```

---

## Implementation Steps (in order)

1. **Update findColleges action** - remove Claude code, change sort
2. **Update database schema** - remove claudeAnalysis, rankedColleges
3. **Update saveSearchResult mutation** - remove AI args
4. **Update ResultsContent UI** - remove AI fields from interface and render
5. **Update Search page** - update loading messages
6. **Remove env var** - delete ANTHROPIC_API_KEY from Convex
7. **Remove package** - uninstall @anthropic-ai/sdk
8. **Deploy** - push to Convex

---

## Expected Results

### Before:
- Search time: 10-20 seconds
- Ranked by: AI analysis (cost 50%, academic 25%, location 15%, major 10%)
- Shows: Rank badge, cost rating, fit score, AI analysis text
- Cost: $0.01-$0.05 per search

### After:
- Search time: 1-3 seconds
- Sorted by: Admission rate (most selective first)
- Shows: Index number, college stats only
- Cost: $0 (College Scorecard is free)

---

## Testing Checklist

- [ ] Create profile
- [ ] Click "Find Colleges"
- [ ] Verify search completes in 1-3 seconds
- [ ] Verify colleges sorted by admission rate (lowest first)
- [ ] Verify no AI fields shown (rank, costRating, fitScore, analysis)
- [ ] Verify basic college data displays (name, tuition, admission rate, etc.)
- [ ] Verify results save to database correctly
- [ ] Verify can view past search results
- [ ] Check Convex logs for no Claude API calls
- [ ] Verify no errors in console

---

## Migration Notes

**Existing data:**
- Old search results in database will still have `claudeAnalysis` and `rankedColleges` fields
- Query will need to handle both old and new format
- Option 1: Ignore old data (start fresh)
- Option 2: Add fallback in UI: `const displayColleges = searchResult.colleges || searchResult.rankedColleges`

**Recommendation:** Use Option 2 for backwards compatibility.

---

## Files to Modify

1. `convex/actions/findColleges.ts` - Main changes
2. `convex/schema.ts` - Remove AI fields
3. `convex/mutations/searchResults.ts` - Remove AI args
4. `app/results/[id]/ResultsContent.tsx` - Update UI
5. `app/search/page.tsx` - Update loading text
6. `package.json` - Remove Anthropic SDK (optional)

**Total files:** 6

**Estimated time:** 30-45 minutes
