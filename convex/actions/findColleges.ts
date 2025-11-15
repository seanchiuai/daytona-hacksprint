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

  // Validate and cap budget to reasonable range (College Scorecard API can fail with extreme values)
  const maxBudget = Math.min(filters.budget, 80000);
  if (filters.budget > 80000) {
    console.log(`⚠️ Budget capped from $${filters.budget.toLocaleString()} to $${maxBudget.toLocaleString()}`);
  }

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
    "latest.cost.tuition.in_state__range": `0..${maxBudget}`,
    "school.degrees_awarded.predominant__range": "2..3", // Associate's and Bachelor's degrees
    "latest.student.size__range": "1..", // Must have at least 1 student
    per_page: "100",
    page: "0",
    _sort: "latest.cost.tuition.in_state:asc",
  });

  // Add state filter if provided
  if (filters.states.length > 0) {
    params.set("school.state", filters.states.join(","));
  }

  // ========== DEBUGGING LOGS ==========
  console.log("\n" + "=".repeat(80));
  console.log("🏫 COLLEGE SCORECARD API REQUEST");
  console.log("=".repeat(80));
  console.log("\n🔍 SEARCH FILTERS:");
  console.log(JSON.stringify(filters, null, 2));
  console.log("\n🌐 API URL:");
  console.log(`${BASE_URL}?${params.toString()}`);
  console.log("\n📋 REQUEST PARAMS:");
  console.log(JSON.stringify(Object.fromEntries(params), null, 2));
  console.log("=".repeat(80) + "\n");

  // Retry logic for API calls
  let data: any = null;
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`⏳ Retry attempt ${attempt}/${maxRetries}...\n`);
        // Wait before retry: 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      } else {
        console.log("⏳ Calling College Scorecard API...\n");
      }

      const response = await fetch(`${BASE_URL}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error("\n❌ COLLEGE SCORECARD API ERROR:");
        console.error(`Status: ${response.status} ${response.statusText}`);
        console.error(`Response: ${errorText.substring(0, 500)}`);

        // Retry on 500/502/503 errors
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(`College Scorecard API error: ${response.status} ${response.statusText}`);
          continue; // Retry
        }

        throw new Error(
          `College Scorecard API error: ${response.status} ${response.statusText}`
        );
      }

      data = await response.json();

      // Success! Break out of retry loop
      lastError = null;
      break;

    } catch (error) {
      lastError = error as Error;
      if (attempt >= maxRetries) {
        throw error; // Re-throw on last attempt
      }
      // Continue to next attempt
    }
  }

  // If we exhausted retries without success
  if (!data || lastError) {
    throw lastError || new Error("Failed to fetch colleges after retries");
  }

  try {
    // ========== DEBUGGING LOGS ==========
    console.log("\n" + "=".repeat(80));
    console.log("✅ COLLEGE SCORECARD API RESPONSE");
    console.log("=".repeat(80));
    console.log("\n📊 RESPONSE METADATA:");
    console.log(JSON.stringify({
      total_results: data.metadata?.total || 0,
      page: data.metadata?.page || 0,
      per_page: data.metadata?.per_page || 0,
      returned_results: data.results?.length || 0,
    }, null, 2));
    console.log("=".repeat(80) + "\n");

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

    console.log(`✅ Filtered to ${colleges.length} valid colleges\n`);
    return colleges;
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ COLLEGE SCORECARD API FAILED");
    console.error("=".repeat(80));
    console.error("Error:", error);
    console.error("=".repeat(80) + "\n");
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

  // ========== DEBUGGING LOGS ==========
  console.log("\n" + "=".repeat(80));
  console.log("🤖 CLAUDE API REQUEST");
  console.log("=".repeat(80));
  console.log("\n📝 SYSTEM PROMPT:");
  console.log(prompt);
  console.log("\n🔧 API CONFIG:");
  console.log(JSON.stringify({
    model: "claude-haiku-4-5",
    max_tokens: 8192,
    timestamp: new Date().toISOString(),
  }, null, 2));
  console.log("=".repeat(80) + "\n");

  try {
    console.log("⏳ Calling Claude API...\n");
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // ========== DEBUGGING LOGS ==========
    console.log("\n" + "=".repeat(80));
    console.log("✅ CLAUDE API RESPONSE");
    console.log("=".repeat(80));
    console.log("\n📊 RESPONSE METADATA:");
    console.log(JSON.stringify({
      id: message.id,
      model: message.model,
      role: message.role,
      stop_reason: message.stop_reason,
      usage: message.usage,
    }, null, 2));
    console.log("\n💬 RESPONSE CONTENT:");
    console.log(JSON.stringify(message.content, null, 2));
    console.log("=".repeat(80) + "\n");

    // Extract text from content blocks
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in Claude response");
    }
    const fullAnalysis = textBlock.text;

    // Parse JSON response
    let rankedColleges: RankedCollege[];
    try {
      console.log("🔄 Parsing Claude response JSON...\n");

      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = fullAnalysis.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("\n❌ No JSON array found in Claude response");
        console.error("Full response:", fullAnalysis.substring(0, 500));
        throw new Error("No JSON array found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ Parsed ${parsed.length} ranked colleges\n`);

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

      console.log("✅ Successfully merged and ranked all colleges\n");
    } catch (parseError) {
      console.error("\n" + "=".repeat(80));
      console.error("❌ CLAUDE RESPONSE PARSING FAILED");
      console.error("=".repeat(80));
      console.error("Parse Error:", parseError);
      console.error("\nRaw Response (first 1000 chars):");
      console.error(fullAnalysis.substring(0, 1000));
      console.error("=".repeat(80) + "\n");
      throw new Error(
        "Failed to parse AI analysis. The response format was invalid."
      );
    }

    console.log("=".repeat(80));
    console.log("✅ CLAUDE ANALYSIS COMPLETE");
    console.log("=".repeat(80) + "\n");

    return {
      fullAnalysis,
      rankedColleges,
    };
  } catch (error: any) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ CLAUDE API FAILED");
    console.error("=".repeat(80));
    console.error("Error Status:", error.status || "No status");
    console.error("Error Message:", error.message || "No message");
    console.error("Error Name:", error.name || "No name");
    console.error("\nFull Error Object:");
    console.error(JSON.stringify(error, null, 2));
    console.error("\nError Stack:");
    console.error(error.stack || "No stack trace");

    if (error.status === 429) {
      console.error("\n⚠️ Rate Limit Hit!");
      console.error("=".repeat(80) + "\n");
      throw new Error(
        "AI service is temporarily busy. Please try again in a moment."
      );
    }
    if (error.status === 401 || error.status === 403) {
      console.error("\n⚠️ Authentication Issue!");
      console.error("=".repeat(80) + "\n");
      throw new Error("AI service authentication failed. Please contact support.");
    }
    if (error.error?.type === 'invalid_request_error') {
      console.error("\n⚠️ Invalid Request!");
      console.error("API Error Type:", error.error.type);
      console.error("API Error Message:", error.error.message);
      console.error("=".repeat(80) + "\n");
      throw new Error(`Invalid API request: ${error.error.message}`);
    }

    console.error("\n⚠️ Unknown Error Type");
    console.error("=".repeat(80) + "\n");

    // Re-throw the original error message if available, otherwise use generic message
    throw new Error(error.message || "Failed to analyze colleges. Please try again later.");
  }
}
