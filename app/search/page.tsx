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
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{
    success: boolean;
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    python?: string;
    depsReady?: boolean;
    bootstrapLog?: string;
  } | null>(null);

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

  const handleApplyTest = async () => {
    setIsApplying(true);
    setApplyResult(null);
    setError(null);

    try {
      // Minimal test applicant data
      const applicantInfo = {
        first_name: "Test",
        last_name: "Student",
        email: "seanlockedin430@gmail.com",
        phone: "555-555-5555",
        address: "123 Main St",
        city: "Springfield",
        state: "Illinois",
        country: "United States",
        postal_code: "12345",
        age: "18",
        gpa: "3.8",
        sat: "1450",
        act: "32",
        extracurriculars: ["Robotics", "Soccer"],
        honors: ["National Merit Commended"],
        intended_major: "Computer Science",
        colleges: ["Stanford University"],
        US_citizen: false,
        permanent_resident: true,
        first_generation: true,
        honors_college: false,
        application_term: "Fall 2026",
        academic_disciplinary_history: false,
        legal_disciplinary_history: false,
        prison_history: false,
        military_service: false,
        military_relatives: false,
        arts_portfolio: false,
        birth_country: "United States",
        birth_state: "Illinois",
        lived_outside_us: false,
        siblings: 1,
        siblings_applying_to_college: false,
        parents_separate_address: false,
      };

      // Create a small dummy PDF-like blob for testing
      const pdfHeader = "%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n1 0 obj <<>> endobj\n";
      const blob = new Blob([pdfHeader, "Test resume content"], { type: "application/pdf" });
      const file = new File([blob], "resume.pdf", { type: "application/pdf" });

      const form = new FormData();
      form.append("applicantInfo", JSON.stringify(applicantInfo));
      form.append("resume", file);

      const res = await fetch("/api/scholarship/apply", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to trigger application");
      }
      setApplyResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start application";
      setError(msg);
    } finally {
      setIsApplying(false);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        <Button
          onClick={handleApplyTest}
          disabled={isApplying}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {isApplying ? (
            <>
              <span className="animate-spin mr-2">🚀</span>
              Applying (test)...
            </>
          ) : (
            "Apply (Test)"
          )}
        </Button>
      </div>

      {isSearching && (
        <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
          <p>🔍 Searching College Scorecard database...</p>
          <p>🤖 AI is analyzing matches...</p>
          <p>📊 Ranking by affordability...</p>
        </div>
      )}

      {applyResult && (
        <div className="mt-6 p-4 rounded-lg border bg-gray-50 text-sm">
          <p className={applyResult.success ? "text-green-700" : "text-red-700"}>
            {applyResult.success ? "Application process started successfully." : "Application process failed to start."}
          </p>
          {(applyResult.python || applyResult.depsReady !== undefined) && (
            <div className="mt-2 text-gray-700">
              {applyResult.python && <p>Python: {applyResult.python}</p>}
              {applyResult.depsReady !== undefined && (
                <p>Dependencies ready: {applyResult.depsReady ? "yes" : "no"}</p>
              )}
            </div>
          )}
          {applyResult.bootstrapLog && (
            <details className="mt-2">
              <summary className="cursor-pointer">Setup log</summary>
              <pre className="whitespace-pre-wrap text-xs mt-2 max-h-64 overflow-auto">
                {applyResult.bootstrapLog}
              </pre>
            </details>
          )}
          {applyResult.stdout && (
            <details className="mt-2">
              <summary className="cursor-pointer">Show output</summary>
              <pre className="whitespace-pre-wrap text-xs mt-2 max-h-64 overflow-auto">
                {applyResult.stdout.slice(0, 2000)}
              </pre>
            </details>
          )}
          {applyResult.stderr && (
            <details className="mt-2">
              <summary className="cursor-pointer">Show errors</summary>
              <pre className="whitespace-pre-wrap text-xs mt-2 max-h-64 overflow-auto text-red-700">
                {applyResult.stderr.slice(0, 2000)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
