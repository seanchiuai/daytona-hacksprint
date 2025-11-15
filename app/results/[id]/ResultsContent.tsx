"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  rank: number;
  costRating: "Excellent" | "Good" | "Fair";
  fitScore: number;
  analysis: string;
}

export default function ResultsContent({ searchResultId }: { searchResultId: Id<"searchResults"> }) {
  const router = useRouter();
  const searchResult = useQuery(api.queries.searchResults.getSearchResultById, {
    searchResultId,
  });

  if (searchResult === undefined) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-600">Loading results...</p>
      </div>
    );
  }

  if (!searchResult) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Results Not Found</h2>
        <p className="text-gray-600 mb-6">
          The search results you&apos;re looking for don&apos;t exist or have been deleted.
        </p>
        <Button onClick={() => router.push("/search")}>New Search</Button>
      </div>
    );
  }

  const { rankedColleges, searchFilters } = searchResult;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Personalized College Matches</h1>
        <Button onClick={() => router.push("/search")} variant="outline">
          New Search
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Search Criteria:</h3>
        <p className="text-sm text-gray-700">
          Budget: ${searchFilters.budget.toLocaleString()}/year |
          Major: {searchFilters.major} |
          Locations: {searchFilters.states.join(", ") || "All states"}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-gray-600">
          Found {rankedColleges.length} colleges ranked by affordability and fit
        </p>
      </div>

      <div className="space-y-4">
        {rankedColleges.map((college: College) => (
          <div
            key={college.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  #{college.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{college.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {college.city}, {college.state}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${college.tuitionInState.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">per year</p>
              </div>
            </div>

            <div className="flex gap-4 mb-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  college.costRating === "Excellent"
                    ? "bg-green-100 text-green-800"
                    : college.costRating === "Good"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {college.costRating} Value
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                Fit Score: {college.fitScore}/100
              </span>
            </div>

            <p className="text-gray-700 mb-4">{college.analysis}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {college.admissionRate && (
                <div>
                  <p className="text-gray-600">Admission Rate</p>
                  <p className="font-semibold">
                    {(college.admissionRate * 100).toFixed(0)}%
                  </p>
                </div>
              )}
              {college.avgSAT && (
                <div>
                  <p className="text-gray-600">Avg SAT</p>
                  <p className="font-semibold">{college.avgSAT}</p>
                </div>
              )}
              {college.avgACT && (
                <div>
                  <p className="text-gray-600">Avg ACT</p>
                  <p className="font-semibold">{college.avgACT}</p>
                </div>
              )}
              {college.studentSize && (
                <div>
                  <p className="text-gray-600">Students</p>
                  <p className="font-semibold">
                    {college.studentSize.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {college.url && (
              <div className="mt-4">
                <a
                  href={college.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Visit Website →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {rankedColleges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No colleges found matching your criteria.
          </p>
          <Button onClick={() => router.push("/search")}>
            Try Another Search
          </Button>
        </div>
      )}
    </div>
  );
}
