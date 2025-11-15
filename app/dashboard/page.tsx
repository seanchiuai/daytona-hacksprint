"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Search,
  FileText,
  TrendingUp,
  DollarSign,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  // Fetch user data
  const profile = useQuery(api.studentProfile.getProfile);
  const searchHistory = useQuery(api.queries.searchResults.getUserSearchHistory, {
    limit: 5,
  });

  const hasProfile = profile !== null && profile !== undefined;
  const hasSearches = searchHistory && searchHistory.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {user?.firstName || "there"}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Find your perfect college match with AI-powered insights
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {hasProfile ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">Complete</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-2xl font-bold">Incomplete</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasProfile ? "Profile is ready" : "Complete your profile to get started"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchHistory?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasSearches ? "College matches found" : "No searches yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Powered by Claude</div>
            <p className="text-xs text-muted-foreground mt-1">
              Personalized recommendations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started / Quick Actions */}
      {!hasProfile ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Get Started with Your College Search
            </CardTitle>
            <CardDescription>
              Complete these steps to find your perfect college match
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Create Your Student Profile</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Tell us about your academic background, budget, and preferences
                </p>
                <Button onClick={() => router.push("/profile")}>
                  Create Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-4 opacity-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Search for Colleges</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze thousands of colleges to find the best matches
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 opacity-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Review Your Results</h4>
                <p className="text-sm text-muted-foreground">
                  Get personalized insights and recommendations for each college
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/profile")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">${profile.budget?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Major:</span>
                    <span className="font-medium">{profile.major || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">States:</span>
                    <span className="font-medium">
                      {profile.locationPreferences?.join(", ") || "Any"}
                    </span>
                  </div>
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/profile")}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Search Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/50" onClick={() => router.push("/search")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-primary" />
                Find Colleges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use AI to discover colleges that match your profile, ranked by affordability and fit.
              </p>
              <Button className="w-full" onClick={() => router.push("/search")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Search Now
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => hasSearches && router.push(`/results/${searchHistory[0]._id}`)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasSearches ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    View your {searchHistory.length} saved {searchHistory.length === 1 ? "search" : "searches"} and compare colleges.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => router.push(`/results/${searchHistory[0]._id}`)}>
                    View Latest Results
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    No searches yet. Run a search to see your college matches.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    No Results Yet
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Searches */}
      {hasSearches && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Searches
            </CardTitle>
            <CardDescription>
              Your latest college search results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchHistory.map((search) => {
                const date = new Date(search._creationTime);
                const formattedDate = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const resultsCount = search.rankedColleges?.length || 0;

                // Create a readable search query from filters
                const searchQuery = search.searchFilters
                  ? `${search.searchFilters.major} • $${search.searchFilters.budget.toLocaleString()} budget • ${search.searchFilters.states.join(", ")}`
                  : "College Search";

                return (
                  <div
                    key={search._id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/results/${search._id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{searchQuery}</h4>
                        <Badge variant="secondary">{resultsCount} results</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{formattedDate}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Results
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Our AI-powered college search helps you find affordable colleges that match your academic profile and preferences.
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Complete your profile with financial and academic information</li>
            <li>Search for colleges using our College Scorecard database</li>
            <li>Get personalized AI analysis powered by Claude</li>
            <li>Compare costs, fit scores, and graduation rates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
