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
  costRating: string;
  fitScore: number;
  analysis: string;
}

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
    "school.operating": "1",
    "latest.cost.tuition.in_state__range": `0..${filters.budget}`,
    per_page: "100",
    page: "0",
    _sort: "latest.cost.tuition.in_state:asc",
  });

  // Add state filter if provided
  if (filters.states.length > 0) {
    params.set("school.state", filters.states.join(","));
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

    // Extract text from content blocks
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in Claude response");
    }
    const fullAnalysis = textBlock.text;

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
