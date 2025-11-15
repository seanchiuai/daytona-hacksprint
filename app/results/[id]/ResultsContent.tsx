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

  const { colleges, searchFilters } = searchResult;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your College Matches</h1>
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
          Found {colleges.length} colleges sorted by selectivity (most competitive first)
        </p>
      </div>

      <div className="space-y-4">
        {colleges.map((college: College, index: number) => (
          <div
            key={college.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  #{index + 1}
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

      {colleges.length === 0 && (
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
