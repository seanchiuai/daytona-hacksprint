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

  const profile = useQuery(api.studentProfile.getProfile);
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
    } catch (err: unknown) {
      console.error("Search failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to find colleges. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  if (profile === undefined) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

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
          {profile.testScores.sat && <li>SAT: {profile.testScores.sat}</li>}
          {profile.testScores.act && <li>ACT: {profile.testScores.act}</li>}
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
            Finding colleges... This may take a few seconds
          </>
        ) : (
          "Find Colleges"
        )}
      </Button>

      {isSearching && (
        <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
          <p>🔍 Searching College Scorecard database...</p>
          <p>📊 Sorting by selectivity...</p>
        </div>
      )}
    </div>
  );
}
