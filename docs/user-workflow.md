# College Finance Planner - User Workflow Guide

## Overview

**College Finance Planner** (VIBED) is an AI-powered platform that helps students find affordable colleges matching their budget, academic profile, and preferences. The application combines real college data from the U.S. Department of Education with advanced AI analysis to provide personalized, cost-optimized college recommendations.

### What Makes This Different
- **Cost-First Approach:** Affordability is the #1 priority (50% of matching algorithm)
- **AI-Powered Analysis:** Claude Sonnet 4.5 provides intelligent college ranking with personalized explanations
- **Comprehensive Data:** Access to thousands of U.S. colleges with verified tuition, admission, and academic data
- **Simple Workflow:** Create profile once, search multiple times, save results forever

---

## User Journey

### 1. Sign Up / Sign In

**Page:** Landing Page (`/`)

**What Happens:**
- New visitors see the welcome screen
- Click "Sign In" or "Sign Up" to access the platform
- Authentication powered by Clerk (supports email/password, Google, GitHub)

**Behind the Scenes:**
- Clerk handles secure authentication
- User record automatically created in the database
- Session token stored for future authenticated requests

---

### 2. Dashboard Overview

**Page:** Dashboard (`/dashboard`)

**What You See:**
- Welcome message with your first name
- Profile completion status (Complete/Incomplete)
- Total search count
- AI insights banner
- Quick action cards:
  - **Create Profile** (if not completed)
  - **Find Colleges** (if profile complete)
  - **View Results** (if searches exist)
- Recent search history (up to 5 most recent)
- Getting started guide

**Behind the Scenes:**
- Database query fetches your student profile
- Search history query retrieves your past searches
- All data filtered by your user ID (secure isolation)

---

### 3. Create Your Profile

**Page:** Profile (`/profile`)

**Purpose:** Tell us about your academic background, financial situation, and preferences so we can find the best college matches.

#### Step 1: Financial Information

**What You Enter:**
- **Maximum Annual Budget** (required)
  - How much you can afford per year for tuition + fees
  - Example: $20,000
  - Used to filter out unaffordable schools

- **Annual Family Income** (required)
  - Your family's yearly income
  - Example: $50,000
  - Helps AI assess financial fit

**Behind the Scenes:**
- Input validation ensures budget > $0 and income >= $0
- Data stored temporarily in component state
- No database save until final step

#### Step 2: Academic Information

**What You Enter:**
- **Intended Major** (required)
  - Your planned field of study
  - Example: "Computer Science", "Biology", "Business"
  - Free text input (no validation against specific majors)

- **GPA** (required)
  - Your grade point average on 4.0 scale
  - Example: 3.5
  - Validation: 0.0-4.0 range

- **SAT Score** (optional)
  - Your SAT total score
  - Range: 400-1600
  - Used for academic match assessment

- **ACT Score** (optional)
  - Your ACT composite score
  - Range: 1-36
  - Alternative to SAT

**Behind the Scenes:**
- All inputs validated with real-time error messages
- Test scores help match you with academically appropriate schools
- Temporary storage in component state

#### Step 3: Location & Preferences

**What You Enter:**
- **Location Preferences** (required)
  - U.S. states where you'd like to attend college
  - Enter 2-letter state codes (e.g., CA, NY, TX)
  - Minimum 1 state required
  - Tag-based interface: type and press Enter to add
  - Click X on tag to remove

- **Extracurriculars** (optional)
  - Your activities, interests, hobbies
  - Examples: "Soccer", "Debate Team", "Community Service"
  - Maximum 10 activities
  - Tag-based interface like location preferences

**Behind the Scenes:**
- State validation checks against 50 U.S. states + DC
- Invalid state codes rejected
- All data compiled into final profile object

#### Profile Submission

**What Happens When You Click "Submit":**
1. Submit button shows loading state
2. Data sent to Convex backend
3. Profile saved/updated in `studentProfiles` table
4. User record created if needed in `users` table
5. Success toast notification appears
6. Automatic redirect to home page

**Database Storage:**
- All profile data stored with timestamp
- Associated with your user ID
- Can be edited anytime by revisiting `/profile`
- Profile loads existing data if editing

---

### 4. Search for Colleges

**Page:** Search (`/search`)

**What You See:**
- Summary of your search criteria:
  - Budget
  - Intended major
  - Location preferences
  - GPA
  - Test scores (if provided)
- Main action: **"Find Colleges"** button

**What Happens When You Click "Find Colleges":**

**User Experience:**
1. Button enters loading state
2. Progress messages appear:
   - "Searching College Scorecard database..."
   - "AI is analyzing matches..."
   - "Ranking by affordability..."
3. Estimated time: 10-20 seconds
4. Automatic redirect to results page upon completion

**Behind the Scenes - The Complete Workflow:**

#### Phase 1: Profile Retrieval
- Your profile ID sent to Convex action
- Action queries database for your student profile
- Profile data retrieved (budget, GPA, preferences, etc.)

#### Phase 2: College Data Collection
- **API Call:** College Scorecard API (U.S. Department of Education)
- **Filters Applied:**
  - Operating schools only
  - In-state tuition ≤ your budget
  - States in your location preferences
- **Data Retrieved (per college):**
  - Name, city, state, website
  - In-state and out-of-state tuition
  - Admission rate
  - Average SAT/ACT scores
  - Student enrollment size
- **Sorting:** By tuition (lowest first)
- **Limit:** Up to 100 colleges returned
- **Time:** 1-3 seconds

#### Phase 3: AI Analysis with Claude
- **Model:** Claude Sonnet 4.5 (Anthropic)
- **Input Data Sent to AI:**
  - Your complete student profile
  - All college data from College Scorecard
- **AI Task Instructions:**
  - Rank ALL colleges by best fit
  - Cost = #1 priority (50% weight)
  - Additional factors:
    - Academic match (25% weight): GPA/test scores vs. college averages
    - Location preference (15% weight): preferred states
    - Program/major fit (10% weight): major availability
  - Assign cost rating for each college:
    - **Excellent:** < 50% of your budget
    - **Good:** 50-75% of your budget
    - **Fair:** 75-100% of your budget
  - Calculate fit score (0-100) for each college
  - Write 2-3 sentence personalized analysis per college
- **AI Response:** JSON array with rankings
- **Time:** 5-15 seconds (depends on college count)

**Example AI Reasoning:**
```
For student with $20k budget, 3.5 GPA, 1200 SAT:

College A: $8,000/year tuition, 3.4 avg GPA, 1150 avg SAT
→ Cost Rating: Excellent (40% of budget)
→ Fit Score: 92
→ Analysis: "At just $8,000 annually, this college is
   exceptionally affordable and matches your academic
   profile well with similar GPA and SAT ranges."

College B: $18,000/year tuition, 3.8 avg GPA, 1350 avg SAT
→ Cost Rating: Good (90% of budget)
→ Fit Score: 68
→ Analysis: "While affordable, this school has more
   competitive academics than your current profile
   suggests, which may make admissions challenging."
```

#### Phase 4: Save Results
- **Database Save:**
  - Raw college data
  - Full AI analysis text
  - Ranked colleges with metadata
  - Search filters used
  - Timestamp
- **Table:** `searchResults`
- **Return:** Unique search result ID
- **Time:** < 1 second

#### Phase 5: Display Results
- Frontend receives search result ID
- Automatic navigation to `/results/[id]`
- Results page loads and displays findings

**Error Handling:**
- No colleges found → Suggestion to adjust budget/locations
- API failures → User-friendly error messages
- Rate limits → "Please try again in a moment"
- Network issues → "Please try again later"

---

### 5. View Your Results

**Page:** Results (`/results/[id]`)

**What You See:**

#### Page Header
- Title: "Your Personalized College Matches"
- **New Search** button (top right) - runs another search
- Search criteria summary box:
  - Budget
  - Intended major
  - Location preferences

#### Results Display
- Total count of matching colleges
- Colleges displayed as ranked cards (sorted by AI rank)

#### Each College Card Shows:

**Top Section:**
- **Rank Badge:** Blue circle with number (1, 2, 3...)
- **College Name** in large text
- **Location:** City, State

**Cost Information:**
- **Annual Tuition:** Large green text (e.g., "$8,500/year")
- **Cost Rating Badge:** Color-coded
  - Green = Excellent (< 50% of budget)
  - Blue = Good (50-75% of budget)
  - Yellow = Fair (75-100% of budget)

**Fit Assessment:**
- **Fit Score:** Purple badge with 0-100 score
- **AI Analysis:** 2-3 personalized sentences explaining why this college is a good match

**College Statistics Grid:**
- Admission Rate (%)
- Average SAT score
- Average ACT score
- Student Size (total enrollment)

**Action:**
- **"Visit Website →"** link to official college site (opens in new tab)

**Behind the Scenes:**
- Results fetched from database using search result ID
- All data pre-computed (instant load, no AI call)
- Results permanently saved (can revisit anytime)
- User can only see their own search results (secure)

---

### 6. Search History

**Where:** Dashboard page, "Recent Searches" section

**What You See:**
- Up to 5 most recent searches
- Each shows:
  - Date/time of search
  - Major searched
  - Number of colleges found
  - Click to view full results

**Behind the Scenes:**
- Database query: `getUserSearchHistory`
- Sorted by creation date (newest first)
- Links to results pages with saved search IDs

---

## Understanding the AI Intelligence

### How Claude Ranks Your Colleges

The AI uses a weighted scoring system prioritizing affordability:

1. **Cost Analysis (50% weight)**
   - Compares tuition to your budget
   - Lower cost = higher score
   - Categorizes as Excellent/Good/Fair

2. **Academic Match (25% weight)**
   - Compares your GPA to college average
   - Compares your test scores to college averages
   - Assesses admission probability

3. **Location Preference (15% weight)**
   - Checks if college is in your preferred states
   - Higher score for preferred locations

4. **Major/Program Fit (10% weight)**
   - Considers your intended major
   - Basic assessment of program availability

### Sample AI Analysis Examples

**High Fit Score (90+):**
> "This college offers exceptional value at $7,200 annually, well within your budget. Your 3.6 GPA exceeds the average of 3.4, giving you a strong chance of admission. Located in your preferred state of California, this is an excellent financial and academic match."

**Medium Fit Score (70-89):**
> "At $14,500 per year, this school fits your budget comfortably. While your GPA of 3.3 is slightly below the 3.5 average, your strong extracurricular background in leadership may offset this. Consider this a target school with good financial aid potential."

**Lower Fit Score (50-69):**
> "This college is affordable at $9,800 annually and has excellent programs in your intended major. However, the average SAT of 1380 is significantly higher than your 1150, making admission more competitive. Consider as a reach school."

---

## Technical Architecture Summary

### What Powers This Platform

**Frontend (What You Interact With):**
- Next.js 15 - Modern React framework
- TypeScript - Type-safe code
- Tailwind CSS - Beautiful, responsive design
- shadcn/ui - Polished UI components

**Backend (Behind the Scenes):**
- Convex - Serverless database and API
- Real-time queries - Instant data updates
- Secure mutations - Safe data modifications
- Actions - External API orchestration

**Authentication & Security:**
- Clerk - Enterprise-grade auth
- JWT tokens - Secure session management
- Route protection - Middleware enforcement
- User isolation - Your data is yours only

**AI & Data Sources:**
- Claude Sonnet 4.5 - Advanced AI from Anthropic
- College Scorecard API - Official U.S. Department of Education data
- Real-time analysis - Fresh rankings every search

### Data Privacy & Security

**Your Data is Protected:**
- All profile data encrypted in transit
- User-specific database isolation
- API keys never exposed to browser
- Clerk handles password security
- No data shared with third parties

**What We Store:**
- Your profile information
- Search history and results
- User account details (via Clerk)

**What We Don't Store:**
- Credit card information (no payments)
- Social security numbers
- Personal identification documents

---

## Performance & Costs

### Search Performance
- **Profile Creation:** Instant (< 1 second)
- **College API Search:** 1-3 seconds
- **AI Analysis:** 5-15 seconds
- **Results Save:** < 1 second
- **Total Time:** 10-20 seconds per search

### AI Costs (Transparent)
- **Model:** Claude Sonnet 4.5
- **Cost per search:** ~$0.01-$0.05
- **Factors affecting cost:**
  - Number of colleges analyzed
  - Length of AI response
  - Complexity of analysis

**For typical usage (3 searches):** $0.03-$0.15 total

---

## Common Questions & Workflows

### Can I edit my profile?
Yes! Visit `/profile` anytime. The form will load your existing data and you can update any field. Changes apply to all future searches.

### Can I run multiple searches?
Absolutely! Each search is saved with a unique ID. You can compare multiple searches from your dashboard history.

### What if I don't have SAT/ACT scores?
No problem! Test scores are optional. The AI will rank colleges based on GPA, location, and budget.

### Can I search multiple majors?
Currently, one major per profile. To explore different majors, update your profile and run a new search.

### How often is college data updated?
College Scorecard data is updated by the U.S. Department of Education annually. We fetch fresh data with every search.

### Can I save specific colleges as favorites?
Not yet! This feature is planned for future releases. For now, you can bookmark the results page URL.

### How do I export results?
Currently, results are viewable online only. PDF/CSV export is a planned feature.

---

## Tips for Best Results

### Optimizing Your Budget
- Be realistic with your budget (include room & board estimates)
- Remember: tuition often doesn't include fees, books, housing
- Consider in-state vs. out-of-state costs

### Location Strategy
- Add multiple states for more options
- Include neighboring states for better value
- Consider cost of living differences

### Academic Profile
- Be honest with GPA and test scores
- AI uses this to assess admission probability
- Overestimating may suggest unrealistic schools

### Major Selection
- Use specific majors when possible ("Computer Science" not just "STEM")
- Broader majors may yield more results
- You can always change and re-search

---

## Error Messages Decoded

**"No colleges found matching your criteria"**
- Try increasing your budget
- Add more states to location preferences
- Check if state codes are valid (2-letter format)

**"AI service is temporarily busy"**
- Claude API rate limit reached
- Wait 30-60 seconds and try again

**"Not authenticated"**
- Session expired
- Click sign in to re-authenticate

**"Profile required"**
- Must complete profile before searching
- Redirects to `/profile` automatically

**"Could not retrieve college data"**
- College Scorecard API issue
- Usually temporary network issue
- Try again in a few minutes

---

## Future Features (Coming Soon)

### Planned Enhancements
- Scholarship integration and discovery
- Side-by-side college comparison tool
- Application deadline tracking
- Financial aid calculator
- Export results to PDF/CSV
- Share results with parents/counselors
- Save favorite colleges
- Mobile app (iOS/Android)

### Feature Requests
Have ideas? The team is actively developing based on user feedback!

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     COLLEGE FINANCE PLANNER                  │
│                         USER WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   │
   ├─ Sign Up / Sign In (Clerk)
   │  └─ User record created in database
   │
   ▼

2. DASHBOARD
   │
   ├─ View profile status
   ├─ See search history
   └─ Quick actions (Create Profile / Search / View Results)
   │
   ▼

3. CREATE PROFILE (One-Time Setup)
   │
   ├─ Step 1: Financial Info
   │  ├─ Budget (required)
   │  └─ Family Income (required)
   │
   ├─ Step 2: Academic Info
   │  ├─ Intended Major (required)
   │  ├─ GPA (required)
   │  ├─ SAT (optional)
   │  └─ ACT (optional)
   │
   ├─ Step 3: Preferences
   │  ├─ Location Preferences (required)
   │  └─ Extracurriculars (optional)
   │
   └─ Submit → Save to Database
   │
   ▼

4. SEARCH FOR COLLEGES
   │
   ├─ Review search criteria summary
   │
   ├─ Click "Find Colleges"
   │
   ├─ BACKEND WORKFLOW:
   │  │
   │  ├─ Phase 1: Retrieve your profile from database
   │  │
   │  ├─ Phase 2: Fetch colleges from College Scorecard API
   │  │  ├─ Filter: Budget ≤ tuition
   │  │  ├─ Filter: States in preferences
   │  │  ├─ Filter: Operating schools only
   │  │  ├─ Sort: By tuition (lowest first)
   │  │  └─ Limit: 100 colleges max
   │  │
   │  ├─ Phase 3: AI Analysis with Claude Sonnet 4.5
   │  │  ├─ Input: Your profile + college data
   │  │  ├─ Processing:
   │  │  │  ├─ Rank by cost (50% weight)
   │  │  │  ├─ Academic match (25% weight)
   │  │  │  ├─ Location preference (15% weight)
   │  │  │  └─ Major/program fit (10% weight)
   │  │  ├─ Calculate fit scores (0-100)
   │  │  ├─ Assign cost ratings (Excellent/Good/Fair)
   │  │  └─ Write personalized analysis per college
   │  │
   │  └─ Phase 4: Save results to database
   │     └─ Return search result ID
   │
   └─ Loading: 10-20 seconds total
   │
   ▼

5. VIEW RESULTS
   │
   ├─ See all ranked colleges (sorted by AI rank)
   │
   ├─ Each college card shows:
   │  ├─ Rank badge
   │  ├─ College name & location
   │  ├─ Annual tuition (color-coded)
   │  ├─ Cost rating (Excellent/Good/Fair)
   │  ├─ Fit score (0-100)
   │  ├─ AI-generated analysis (2-3 sentences)
   │  ├─ Admission statistics
   │  └─ Website link
   │
   └─ Options:
      ├─ View website for more details
      └─ Run new search
   │
   ▼

6. SEARCH HISTORY
   │
   └─ View past searches from dashboard
      └─ Click to revisit any previous results

═══════════════════════════════════════════════════════════════

KEY TECHNOLOGIES BEHIND THE SCENES:

┌─────────────────────────────────────────────────────────────┐
│  FRONTEND          │  BACKEND           │  EXTERNAL APIs     │
├────────────────────┼────────────────────┼────────────────────┤
│  Next.js 15        │  Convex            │  Claude AI         │
│  TypeScript        │  Queries           │  (Anthropic)       │
│  Tailwind CSS      │  Mutations         │                    │
│  shadcn/ui         │  Actions           │  College Scorecard │
│  Clerk Auth        │  Schema            │  (Dept. of Ed)     │
└─────────────────────────────────────────────────────────────┘

DATA FLOW:

User Input → Frontend Form → Convex Action
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            College Scorecard   Database    Claude AI
                 API           (Profile)    (Analysis)
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                            Save to Database
                                    │
                                    ▼
                            Display Results
```

---

## Contact & Support

For questions, issues, or feature requests:
- Check the `/docs` folder for additional documentation
- Review implementation guides in `/docs` directory
- Contact development team via GitHub issues

---

**Last Updated:** November 2025
**Version:** 1.0 (MVP)
**Status:** Production Ready