# Implementation Plan: LLM-Powered College Matching

## Feature Overview
When user clicks "Find Colleges", a Convex action fetches relevant colleges from College Scorecard API based on filters (budget, major, location), then sends data to Claude API. Claude analyzes and ranks ALL matching colleges with cost as top priority, providing personalized insights on fit.

## Priority
**Must-Have** - Core MVP feature, the main value proposition

## User Flow
1. User completes their student profile
2. User clicks "Find Colleges" button
3. Loading state shows progress (fetching colleges, analyzing with AI)
4. Backend orchestrates:
   - Fetch colleges from College Scorecard API matching filters
   - Send college data + student profile to Claude API
   - Claude ranks colleges with cost as priority
   - Save results to database
5. User is redirected to results page
6. Results are displayed with AI analysis

## Technical Implementation

### 1. Database Schema Addition (Convex)

**File**: `convex/schema.ts`

```typescript
// Add to existing schema
export default defineSchema({
  // ... existing tables ...

  searchResults: defineTable({
    userId: v.id("users"),
    profileId: v.id("studentProfiles"),
    // Raw college data from College Scorecard
    colleges: v.array(v.any()), // Array of college objects
    // AI analysis and rankings
    claudeAnalysis: v.string(), // Full AI response
    rankedColleges: v.array(v.any()), // Parsed ranked college list
    // Metadata
    createdAt: v.number(),
    searchFilters: v.object({
      budget: v.number(),
      states: v.array(v.string()),
      major: v.string(),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_profile", ["profileId"])
    .index("by_created", ["createdAt"]),
});
```

### 2. Environment Variables

**File**: `.env.local` (and Convex Dashboard)

```bash
# College Scorecard API
COLLEGE_SCORECARD_API_KEY=your_key_here

# Anthropic Claude API
ANTHROPIC_API_KEY=your_key_here
```

**Getting API Keys**:
- College Scorecard: https://api.data.gov/signup/
- Anthropic: https://console.anthropic.com/

### 3. Convex Action - Main Orchestration

**File**: `convex/actions/findColleges.ts`

```typescript
"use node";

import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

// Types
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

interface RankedCollege extends College {
  rank: number;
  costRating: string; // "Excellent", "Good", "Fair"
  fitScore: number; // 0-100
  analysis: string; // AI-generated explanation
}

export const findColleges = action({
  args: {
    profileId: v.id("studentProfiles"),
  },
  handler: async (ctx, args): Promise<{ searchResultId: string }> => {
    // 1. Get student profile
    const profile = await ctx.runQuery(api.queries.studentProfile.getProfileById, {
      profileId: args.profileId,
    });

    if (!profile) {
      throw new Error("Profile not found");
    }

    const user = await ctx.runQuery(api.queries.users.getUserById, {
      userId: profile.userId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // 2. Fetch colleges from College Scorecard API
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

    // 3. Send to Claude for AI analysis and ranking
    console.log("Analyzing colleges with Claude AI...");
    const aiAnalysis = await analyzeWithClaude(profile, colleges);

    // 4. Save results to database
    const searchResultId = await ctx.runMutation(
      api.mutations.searchResults.saveSearchResult,
      {
        userId: profile.userId,
        profileId: args.profileId,
        colleges: colleges,
        claudeAnalysis: aiAnalysis.fullAnalysis,
        rankedColleges: aiAnalysis.rankedColleges,
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

// Helper: Fetch from College Scorecard API
async function fetchCollegesFromScorecard(filters: {
  budget: number;
  states: string[];
  major: string;
}): Promise<College[]> {
  const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

  const fields = [
    "id",
    "school.name",
    "school.city",
    "school.state",
    "school.school_url",
    "latest.cost.tuition.in_state",
    "latest.cost.tuition.out_of_state",
    "latest.admissions.admission_rate.overall",
    "latest.admissions.sat_scores.average.overall",
    "latest.admissions.act_scores.midpoint.cumulative",
    "latest.student.size",
  ].join(",");

  const params = new URLSearchParams({
    api_key: process.env.COLLEGE_SCORECARD_API_KEY || "",
    fields,
    "school.operating": "1", // Only operating schools
    "latest.cost.tuition.in_state__range": `0..${filters.budget}`,
    per_page: "100",
    page: "0",
    _sort: "latest.cost.tuition.in_state:asc", // Sort by cost
  });

  // Add state filter if provided
  if (filters.states.length > 0) {
    params.set("school.state", filters.states.join(","));
  }

  // Add major filter if possible
  // Note: College Scorecard uses CIP codes, might need mapping
  if (filters.major) {
    params.set("latest.programs.cip_4_digit.title", filters.major);
  }

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(
        `College Scorecard API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Parse and filter colleges with valid data
    const colleges: College[] = data.results
      .filter((c: any) => {
        return (
          c["school.name"] &&
          c["latest.cost.tuition.in_state"] !== null &&
          c["latest.cost.tuition.in_state"] !== undefined
        );
      })
      .map((c: any) => ({
        id: c.id,
        name: c["school.name"],
        city: c["school.city"],
        state: c["school.state"],
        tuitionInState: c["latest.cost.tuition.in_state"],
        tuitionOutOfState: c["latest.cost.tuition.out_of_state"],
        admissionRate: c["latest.admissions.admission_rate.overall"],
        avgSAT: c["latest.admissions.sat_scores.average.overall"],
        avgACT: c["latest.admissions.act_scores.midpoint.cumulative"],
        studentSize: c["latest.student.size"],
        url: c["school.school_url"],
      }));

    return colleges;
  } catch (error) {
    console.error("Failed to fetch colleges:", error);
    throw new Error("Could not retrieve college data. Please try again later.");
  }
}

// Helper: Analyze with Claude API
async function analyzeWithClaude(
  profile: any,
  colleges: College[]
): Promise<{
  fullAnalysis: string;
  rankedColleges: RankedCollege[];
}> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build prompt
  const prompt = `You are an expert college advisor helping students find affordable colleges that match their profile.

STUDENT PROFILE:
- Budget: $${profile.budget.toLocaleString()}/year (maximum)
- Family Income: $${profile.income.toLocaleString()}/year
- GPA: ${profile.gpa}
- Test Scores: ${profile.testScores.sat ? `SAT ${profile.testScores.sat}` : ""} ${profile.testScores.act ? `ACT ${profile.testScores.act}` : ""}
- Intended Major: ${profile.major}
- Location Preferences: ${profile.locationPreferences.join(", ")}
- Extracurriculars: ${profile.extracurriculars.join(", ")}

COLLEGES TO ANALYZE (${colleges.length} total):
${JSON.stringify(colleges, null, 2)}

TASK:
Rank ALL ${colleges.length} colleges with COST as the #1 priority. For each college:

1. Assign a rank (1 = best fit, ${colleges.length} = worst fit)
2. Provide a cost rating: "Excellent" (under 50% of budget), "Good" (50-75%), "Fair" (75-100%)
3. Calculate a fit score (0-100) based on:
   - Cost (50% weight) - most important
   - Academic match (25% weight) - admission likelihood based on GPA/test scores
   - Location preference (15% weight)
   - Program/major fit (10% weight)
4. Write a 2-3 sentence analysis explaining why this college is a good or poor fit

Return your response as a valid JSON array:

[
  {
    "id": "college_id",
    "rank": 1,
    "costRating": "Excellent",
    "fitScore": 92,
    "analysis": "This college is an outstanding choice because..."
  },
  ...
]

IMPORTANT:
- Prioritize affordability above all else
- Be honest about admission chances
- Include ALL ${colleges.length} colleges in your ranking
- Return ONLY the JSON array, no other text`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const fullAnalysis = message.content[0].text;

    // Parse JSON response
    let rankedColleges: RankedCollege[];
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = fullAnalysis.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Merge with original college data
      rankedColleges = parsed.map((ranked: any) => {
        const college = colleges.find((c) => c.id === ranked.id);
        if (!college) {
          throw new Error(`College ${ranked.id} not found in original data`);
        }

        return {
          ...college,
          rank: ranked.rank,
          costRating: ranked.costRating,
          fitScore: ranked.fitScore,
          analysis: ranked.analysis,
        };
      });

      // Sort by rank
      rankedColleges.sort((a, b) => a.rank - b.rank);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError);
      console.error("Raw response:", fullAnalysis);
      throw new Error(
        "Failed to parse AI analysis. The response format was invalid."
      );
    }

    return {
      fullAnalysis,
      rankedColleges,
    };
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error(
        "AI service is temporarily busy. Please try again in a moment."
      );
    }
    if (error.status === 401) {
      throw new Error("AI service authentication failed. Please contact support.");
    }

    console.error("Claude API error:", error);
    throw new Error("Failed to analyze colleges. Please try again later.");
  }
}
```

### 4. Supporting Convex Functions

**File**: `convex/queries/studentProfile.ts`

```typescript
// Add this query
export const getProfileById = query({
  args: {
    profileId: v.id("studentProfiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});
```

**File**: `convex/mutations/searchResults.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveSearchResult = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("studentProfiles"),
    colleges: v.array(v.any()),
    claudeAnalysis: v.string(),
    rankedColleges: v.array(v.any()),
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
      claudeAnalysis: args.claudeAnalysis,
      rankedColleges: args.rankedColleges,
      searchFilters: args.searchFilters,
      createdAt: Date.now(),
    });

    return searchResultId;
  },
});
```

### 5. Frontend Integration

**File**: `app/(protected)/search/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = useQuery(api.queries.studentProfile.getProfile);
  const findColleges = useAction(api.actions.findColleges.findColleges);

  const handleSearch = async () => {
    if (!profile) {
      setError("Please create a profile first");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await findColleges({
        profileId: profile._id,
      });

      // Redirect to results page
      router.push(`/results/${result.searchResultId}`);
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Failed to find colleges. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">No Profile Found</h2>
        <p className="text-gray-600 mb-6">
          Please create a profile before searching for colleges.
        </p>
        <Button onClick={() => router.push("/profile")}>Create Profile</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Find Your Perfect Colleges</h1>

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Your Search Criteria:</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>Budget: ${profile.budget.toLocaleString()}/year</li>
          <li>Major: {profile.major}</li>
          <li>Locations: {profile.locationPreferences.join(", ")}</li>
          <li>GPA: {profile.gpa}</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <Button
        onClick={handleSearch}
        disabled={isSearching}
        className="w-full"
        size="lg"
      >
        {isSearching ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Finding colleges... This may take 10-20 seconds
          </>
        ) : (
          "Find Colleges"
        )}
      </Button>

      {isSearching && (
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔍 Searching College Scorecard database...</p>
          <p className="mt-2">🤖 AI is analyzing matches...</p>
          <p className="mt-2">📊 Ranking by affordability...</p>
        </div>
      )}
    </div>
  );
}
```

### 6. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

## Testing Checklist

- [ ] College Scorecard API returns valid data
- [ ] Filters work correctly (budget, location, major)
- [ ] Claude API receives correct prompt structure
- [ ] Claude returns valid JSON response
- [ ] Response parsing handles edge cases (malformed JSON)
- [ ] Error handling for API failures (rate limits, network errors)
- [ ] Results save to database correctly
- [ ] Loading states display properly
- [ ] Costs stay within budget (estimate $0.01-0.05 per search)
- [ ] Search works for different profile configurations

## Error Scenarios to Handle

1. **No colleges found**: Display helpful message suggesting filter adjustments
2. **College Scorecard API down**: Retry with exponential backoff
3. **Claude API rate limit**: Show "busy" message, ask user to retry
4. **Invalid API keys**: Clear error message for admin
5. **Malformed Claude response**: Fallback to showing raw college data
6. **Network timeout**: Set reasonable timeout (30 seconds)

## Cost Optimization

- **Cache results**: Don't re-analyze same profile/filters combination
- **Limit Claude input**: Send max 100 colleges to Claude (paginate if needed)
- **Monitor usage**: Log token consumption in Claude console
- **Expected cost**: ~$0.01-0.05 per search with Sonnet 4
- **For 10 users, 3 searches each**: ~$0.30-$1.50 total

## Dependencies

- **New packages**: `@anthropic-ai/sdk`
- **API keys**: College Scorecard, Anthropic
- **Existing**: Convex, Next.js, React

## Estimated Time
**2-2.5 hours**

## Implementation Order

1. Set up environment variables and install packages (15 min)
2. Create database schema for searchResults (10 min)
3. Implement College Scorecard fetch function (30 min)
4. Implement Claude analysis function (30 min)
5. Create main findColleges action (20 min)
6. Build frontend search page (30 min)
7. Test end-to-end and debug (25 min)

## Notes

- This is the most complex feature - test thoroughly
- Claude prompt engineering is key - adjust based on results
- Consider adding progress updates via WebSocket/Convex subscriptions
- May need to handle colleges with missing data gracefully
- Monitor API costs closely during testing
