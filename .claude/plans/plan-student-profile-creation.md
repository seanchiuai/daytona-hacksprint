# Implementation Plan: Student Profile Creation

## Feature Overview
Multi-step form where users input their financial information, academic credentials, location preferences, and extracurricular activities. Data is saved to Convex database and associated with the authenticated user.

## Priority
**Must-Have** - Core MVP feature

## User Flow
1. User logs in via Clerk authentication
2. User navigates to profile creation page
3. User completes multi-step form:
   - Step 1: Financial Information (budget, family income)
   - Step 2: Academic Information (GPA, SAT/ACT scores, intended major)
   - Step 3: Preferences (location, extracurriculars)
4. Data is saved to Convex database
5. User receives confirmation and can proceed to college search

## Technical Implementation

### 1. Database Schema (Convex)

**File**: `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  studentProfiles: defineTable({
    userId: v.id("users"),
    // Financial Information
    budget: v.number(), // Maximum annual budget
    income: v.number(), // Family income
    // Academic Information
    major: v.string(), // Intended major/field of study
    gpa: v.number(), // Student GPA (0.0-4.0 scale)
    testScores: v.object({
      sat: v.optional(v.number()), // SAT score (400-1600)
      act: v.optional(v.number()), // ACT score (1-36)
    }),
    // Preferences
    locationPreferences: v.array(v.string()), // Preferred states (2-letter codes)
    extracurriculars: v.array(v.string()), // Activities and interests
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
```

### 2. Convex Functions

**File**: `convex/mutations/studentProfile.ts`

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveProfile = mutation({
  args: {
    budget: v.number(),
    income: v.number(),
    major: v.string(),
    gpa: v.number(),
    testScores: v.object({
      sat: v.optional(v.number()),
      act: v.optional(v.number()),
    }),
    locationPreferences: v.array(v.string()),
    extracurriculars: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Find user in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if profile exists
    const existingProfile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const timestamp = Date.now();

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        ...args,
        updatedAt: timestamp,
      });
      return existingProfile._id;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("studentProfiles", {
        userId: user._id,
        ...args,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return profileId;
    }
  },
});
```

**File**: `convex/queries/studentProfile.ts`

```typescript
import { query } from "../_generated/server";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Find user in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    // Get profile
    const profile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return profile;
  },
});
```

### 3. Frontend Components

**File Structure**:
```
app/
  (protected)/
    profile/
      page.tsx                 # Main profile page
components/
  profile/
    ProfileForm.tsx            # Main form wrapper
    StepOne.tsx                # Financial information
    StepTwo.tsx                # Academic information
    StepThree.tsx              # Preferences
    ProgressIndicator.tsx      # Shows current step
```

**File**: `components/profile/ProfileForm.tsx`

```typescript
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import ProgressIndicator from "./ProgressIndicator";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FormData {
  // Financial
  budget: number;
  income: number;
  // Academic
  major: string;
  gpa: number;
  sat?: number;
  act?: number;
  // Preferences
  states: string[];
  extracurriculars: string[];
}

export default function ProfileForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingProfile = useQuery(api.queries.getProfile);
  const saveProfile = useMutation(api.mutations.saveProfile);

  // Load existing profile data
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        budget: existingProfile.budget,
        income: existingProfile.income,
        major: existingProfile.major,
        gpa: existingProfile.gpa,
        sat: existingProfile.testScores.sat,
        act: existingProfile.testScores.act,
        states: existingProfile.locationPreferences,
        extracurriculars: existingProfile.extracurriculars,
      });
    }
  }, [existingProfile]);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveProfile({
        budget: formData.budget!,
        income: formData.income!,
        major: formData.major!,
        gpa: formData.gpa!,
        testScores: {
          sat: formData.sat,
          act: formData.act,
        },
        locationPreferences: formData.states!,
        extracurriculars: formData.extracurriculars!,
      });

      // Redirect to search page
      router.push("/search");
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressIndicator currentStep={step} totalSteps={3} />

      {step === 1 && (
        <StepOne
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <StepTwo
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 3 && (
        <StepThree
          data={formData}
          onUpdate={updateFormData}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
```

**File**: `components/profile/StepOne.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StepOne({ data, onUpdate, onNext }) {
  const [budget, setBudget] = useState(data.budget || "");
  const [income, setIncome] = useState(data.income || "");
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};

    if (!budget || budget <= 0) {
      newErrors.budget = "Please enter a valid budget";
    }
    if (!income || income < 0) {
      newErrors.income = "Please enter a valid income";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate({
        budget: Number(budget),
        income: Number(income),
      });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Financial Information</h2>
        <p className="text-gray-600 mt-2">
          Help us find colleges within your budget
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="budget">
            Maximum Annual Budget (Tuition + Fees)
          </Label>
          <Input
            id="budget"
            type="number"
            placeholder="e.g., 30000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            step="1000"
          />
          {errors.budget && (
            <p className="text-sm text-red-600 mt-1">{errors.budget}</p>
          )}
        </div>

        <div>
          <Label htmlFor="income">Annual Family Income</Label>
          <Input
            id="income"
            type="number"
            placeholder="e.g., 75000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            min="0"
            step="1000"
          />
          {errors.income && (
            <p className="text-sm text-red-600 mt-1">{errors.income}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Used to estimate financial aid eligibility
          </p>
        </div>
      </div>

      <Button onClick={handleNext} className="w-full">
        Continue to Academic Info
      </Button>
    </div>
  );
}
```

**File**: `components/profile/StepTwo.tsx` (similar pattern for GPA, SAT/ACT, major)

**File**: `components/profile/StepThree.tsx` (similar pattern for states, extracurriculars)

### 4. UI Components Needed (shadcn/ui)

Install required components:
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add badge
```

### 5. Validation Rules

**Frontend Validation**:
- Budget: Must be > 0
- Income: Must be >= 0
- GPA: Must be between 0.0 and 4.0
- SAT: If provided, must be between 400-1600
- ACT: If provided, must be between 1-36
- Major: Required, non-empty string
- At least one location preference selected
- Extracurriculars: Optional, but max 10 items

**Backend Validation**:
- Implement validators in Convex mutations using `v.number()` with custom validators
- Check ranges and required fields server-side

## Testing Checklist

- [ ] New profile creation works
- [ ] Updating existing profile preserves other data
- [ ] All three steps navigate correctly
- [ ] Back button preserves data
- [ ] Form validation shows appropriate errors
- [ ] Data persists to Convex database
- [ ] Profile loads correctly on page refresh
- [ ] Unauthenticated users are redirected
- [ ] Multiple users can create separate profiles

## Dependencies

- **Existing**: Convex, Clerk, Next.js, shadcn/ui, Tailwind CSS
- **New**: None (all tools already available)

## Estimated Time
**1.5-2 hours**

## Implementation Order

1. Define database schema (15 min)
2. Create Convex mutations and queries (30 min)
3. Build form components (45 min)
4. Add validation and error handling (20 min)
5. Test and polish (20 min)

## Notes

- Keep form simple and focused - avoid overwhelming users
- Use placeholder text for guidance (e.g., "Computer Science, Engineering, Business")
- Auto-save draft to prevent data loss (optional enhancement)
- Consider adding tooltips for financial terms
- Design should be clean and encourage completion
