# Implementation Plan: Results Display

## Feature Overview
Display ranked list of colleges with key information for each: college name, location, tuition cost, vibe/characteristics, and AI-generated analysis explaining why it's a good fit. List shows all matching colleges in ranked order.

## Priority
**Must-Have** - Core MVP feature

## User Flow
1. User completes college search
2. Results page loads with ranked college list
3. Colleges are shown in cards, sorted by rank (best fit first)
4. Each card shows:
   - College name and location
   - Tuition cost with cost rating badge
   - Fit score
   - AI analysis (expandable)
5. User can scroll through all results
6. User can click cards to see full details

## Technical Implementation

### 1. Convex Query to Fetch Results

**File**: `convex/queries/searchResults.ts`

```typescript
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getSearchResult = query({
  args: {
    searchResultId: v.id("searchResults"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const result = await ctx.db.get(args.searchResultId);

    if (!result) {
      throw new Error("Search results not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || result.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return result;
  },
});

export const getUserSearchHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const searches = await ctx.db
      .query("searchResults")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10); // Last 10 searches

    return searches;
  },
});
```

### 2. Main Results Page

**File**: `app/(protected)/results/[searchResultId]/page.tsx`

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import CollegeCard from "@/components/results/CollegeCard";
import ResultsHeader from "@/components/results/ResultsHeader";
import ResultsSkeleton from "@/components/results/ResultsSkeleton";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchResultId = params.searchResultId as Id<"searchResults">;

  const searchResult = useQuery(api.queries.searchResults.getSearchResult, {
    searchResultId,
  });

  if (searchResult === undefined) {
    return <ResultsSkeleton />;
  }

  if (!searchResult) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Results Not Found</h2>
        <p className="text-gray-600 mb-6">
          These search results may have been deleted or you don't have access.
        </p>
        <Button onClick={() => router.push("/search")}>New Search</Button>
      </div>
    );
  }

  const { rankedColleges, searchFilters } = searchResult;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ResultsHeader
        collegeCount={rankedColleges.length}
        filters={searchFilters}
        onNewSearch={() => router.push("/search")}
      />

      <div className="space-y-4 mt-6">
        {rankedColleges.map((college: any, index: number) => (
          <CollegeCard key={college.id} college={college} index={index} />
        ))}
      </div>

      {rankedColleges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No colleges found matching your criteria.
          </p>
          <Button onClick={() => router.push("/profile")}>
            Adjust Your Profile
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 3. College Card Component

**File**: `components/results/CollegeCard.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  tuitionInState: number;
  tuitionOutOfState: number;
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

interface CollegeCardProps {
  college: College;
  index: number;
}

export default function CollegeCard({ college, index }: CollegeCardProps) {
  const [isExpanded, setIsExpanded] = useState(index < 3); // Auto-expand top 3

  const costRatingColors = {
    Excellent: "bg-green-100 text-green-800 border-green-300",
    Good: "bg-blue-100 text-blue-800 border-blue-300",
    Fair: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };

  const fitScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-yellow-600";
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-gray-400">
              #{college.rank}
            </span>
            <div>
              <h3 className="text-xl font-bold">{college.name}</h3>
              <p className="text-sm text-gray-600">
                {college.city}, {college.state}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge
              variant="outline"
              className={costRatingColors[college.costRating]}
            >
              {college.costRating} Value
            </Badge>
            <Badge variant="outline" className="bg-gray-100">
              Fit Score: <span className={fitScoreColor(college.fitScore)}>{college.fitScore}</span>
            </Badge>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            ${college.tuitionInState.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500">In-State Tuition</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500">Acceptance Rate</p>
          <p className="font-semibold">
            {college.admissionRate
              ? `${(college.admissionRate * 100).toFixed(0)}%`
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Test Scores</p>
          <p className="font-semibold">
            {college.avgSAT
              ? `SAT ${college.avgSAT}`
              : college.avgACT
              ? `ACT ${college.avgACT}`
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Students</p>
          <p className="font-semibold">
            {college.studentSize?.toLocaleString() || "N/A"}
          </p>
        </div>
      </div>

      {/* AI Analysis (Expandable) */}
      <div className="mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          AI Analysis
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {college.analysis}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        {college.url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(college.url, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Website
          </Button>
        )}
        <Button variant="ghost" size="sm">
          Save College
        </Button>
      </div>
    </Card>
  );
}
```

### 4. Results Header Component

**File**: `components/results/ResultsHeader.tsx`

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ResultsHeaderProps {
  collegeCount: number;
  filters: {
    budget: number;
    states: string[];
    major: string;
  };
  onNewSearch: () => void;
}

export default function ResultsHeader({
  collegeCount,
  filters,
  onNewSearch,
}: ResultsHeaderProps) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your College Matches</h1>
          <p className="text-gray-600">
            Found {collegeCount} {collegeCount === 1 ? "college" : "colleges"}{" "}
            ranked by affordability and fit
          </p>
        </div>
        <Button variant="outline" onClick={onNewSearch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          New Search
        </Button>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Search Criteria:
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Budget:</span>{" "}
            <span className="font-medium">
              ${filters.budget.toLocaleString()}/year
            </span>
          </div>
          <div>
            <span className="text-gray-500">Major:</span>{" "}
            <span className="font-medium">{filters.major}</span>
          </div>
          <div>
            <span className="text-gray-500">Locations:</span>{" "}
            <span className="font-medium">{filters.states.join(", ")}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Colleges are ranked with cost as the top
          priority. Scroll down to see all matches!
        </p>
      </div>
    </div>
  );
}
```

### 5. Loading Skeleton

**File**: `components/results/ResultsSkeleton.tsx`

```typescript
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResultsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-6 w-96 mb-6" />

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-12 w-24" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 6. UI Components Needed (shadcn/ui)

```bash
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add skeleton
```

## Additional Features

### Sort/Filter Controls (Optional Enhancement)

```typescript
// Add to ResultsPage
const [sortBy, setSortBy] = useState<"rank" | "cost" | "fitScore">("rank");
const [filterCostRating, setFilterCostRating] = useState<string | null>(null);

const filteredAndSortedColleges = useMemo(() => {
  let colleges = [...rankedColleges];

  // Filter by cost rating
  if (filterCostRating) {
    colleges = colleges.filter((c) => c.costRating === filterCostRating);
  }

  // Sort
  colleges.sort((a, b) => {
    if (sortBy === "cost") return a.tuitionInState - b.tuitionInState;
    if (sortBy === "fitScore") return b.fitScore - a.fitScore;
    return a.rank - b.rank; // default: rank
  });

  return colleges;
}, [rankedColleges, sortBy, filterCostRating]);
```

### Export Results (Optional)

```typescript
const handleExport = () => {
  const csvContent = [
    "Rank,Name,City,State,Tuition,Cost Rating,Fit Score,Analysis",
    ...rankedColleges.map(
      (c) =>
        `${c.rank},"${c.name}","${c.city}","${c.state}",${c.tuitionInState},"${c.costRating}",${c.fitScore},"${c.analysis}"`
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `college-matches-${Date.now()}.csv`;
  a.click();
};
```

## Visual Design Guidelines

### Typography
- Headers: Bold, large (24-32px)
- College names: Semi-bold, 18-20px
- Body text: Regular, 14-16px
- Labels: Small, 12px, gray

### Colors
- **Excellent Value**: Green (#10b981)
- **Good Value**: Blue (#3b82f6)
- **Fair Value**: Yellow (#f59e0b)
- **Primary Action**: Blue (#2563eb)
- **Background**: White/Gray-50
- **Borders**: Gray-200

### Spacing
- Card padding: 24px
- Gap between cards: 16px
- Section spacing: 24px
- Inline spacing: 12px

### Responsive Design
- Desktop (1024px+): 2-column layout for stats
- Tablet (768-1024px): 2-column layout, smaller cards
- Mobile (< 768px): Single column, stacked layout

## Testing Checklist

- [ ] Results load correctly from database
- [ ] All ranked colleges display in order
- [ ] Cost ratings shown with correct colors
- [ ] Fit scores calculate and display properly
- [ ] AI analysis expands/collapses correctly
- [ ] Website links open in new tab
- [ ] Loading skeleton shows while data fetches
- [ ] Empty state displays when no results
- [ ] Unauthorized access blocked (ownership check)
- [ ] Responsive design works on mobile/tablet
- [ ] Long college names don't break layout
- [ ] Missing data (SAT/ACT, etc.) handled gracefully

## Performance Considerations

- Use Convex real-time subscriptions for instant updates
- Lazy load college cards if list is very long (100+)
- Memoize filtered/sorted results
- Optimize images (if adding college photos later)
- Keep initial page load fast with skeleton loader

## Accessibility

- Semantic HTML (proper heading hierarchy)
- ARIA labels for expand/collapse buttons
- Keyboard navigation support
- Color contrast meets WCAG AA standards
- Screen reader friendly descriptions
- Focus indicators on interactive elements

## Dependencies

- **Existing**: Convex, Next.js, shadcn/ui, Tailwind CSS
- **New UI components**: card, badge, skeleton (shadcn/ui)

## Estimated Time
**1.5 hours**

## Implementation Order

1. Create Convex queries for fetching results (15 min)
2. Build main results page structure (20 min)
3. Create CollegeCard component (30 min)
4. Create ResultsHeader component (15 min)
5. Add loading skeleton and empty states (10 min)
6. Style and polish UI (20 min)
7. Test responsive design and accessibility (10 min)

## Notes

- Focus on clarity and readability - users will scan quickly
- Cost should be prominently displayed (biggest pain point)
- AI analysis is key differentiator - make it stand out
- Consider adding "Save for later" / bookmarking (nice-to-have)
- May want to add comparison view later (2-3 colleges side-by-side)
- Export functionality would be valuable for sharing with parents
