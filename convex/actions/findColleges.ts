"use node";

import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

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

    // 3. Save results to database
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
    _sort: "latest.admissions.admission_rate.overall:asc",
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
