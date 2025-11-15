"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
  const [savingCollegeId, setSavingCollegeId] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});

  const searchResult = useQuery(api.queries.searchResults.getSearchResultById, {
    searchResultId,
  });

  const saveCollegeMutation = useMutation(api.mutations.savedColleges.saveCollege);

  const handleSaveCollege = async (college: College) => {
    setSavingCollegeId(college.id);
    try {
      // Build the mutation args, only including optional fields if they have values
      const args: any = {
        collegeId: String(college.id), // Convert to string to match validator
        name: college.name,
        city: college.city,
        state: college.state,
        tuitionInState: college.tuitionInState,
      };

      // Only add optional fields if they're not null/undefined
      if (college.tuitionInState != null) {
        args.tuitionOutOfState = college.tuitionInState;
      }
      if (college.admissionRate != null) {
        args.admissionRate = college.admissionRate;
      }
      if (college.avgSAT != null) {
        args.avgSAT = college.avgSAT;
      }
      if (college.avgACT != null) {
        args.avgACT = college.avgACT;
      }
      if (college.studentSize != null) {
        args.studentSize = college.studentSize;
      }
      if (college.url != null) {
        args.url = college.url;
      }

      await saveCollegeMutation(args);
      setSavedStates((prev) => ({ ...prev, [college.id]: true }));
    } catch (error) {
      console.error("Failed to save college:", error);
    } finally {
      setSavingCollegeId(null);
    }
  };

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
          Budget: ${searchFilters?.budget?.toLocaleString() || 'N/A'}/year |
          Major: {searchFilters?.major || 'N/A'} |
          Locations: {searchFilters?.states?.join(", ") || "All states"}
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

            <div className="mt-4 flex items-center justify-between gap-3">
              {college.url && (
                <a
                  href={college.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Visit Website →
                </a>
              )}
              <Button
                onClick={() => handleSaveCollege(college)}
                disabled={savingCollegeId === college.id || savedStates[college.id]}
                variant={savedStates[college.id] ? "default" : "outline"}
                size="sm"
              >
                {savingCollegeId === college.id ? (
                  "Saving..."
                ) : savedStates[college.id] ? (
                  "Saved"
                ) : (
                  "Save College"
                )}
              </Button>
            </div>
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
