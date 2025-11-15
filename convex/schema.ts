import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  todos: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed")),
    userId: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  studentProfiles: defineTable({
    userId: v.id("users"),
    // Financial Information
    budget: v.number(),
    income: v.number(),
    // Academic Information
    major: v.string(),
    gpa: v.number(),
    testScores: v.object({
      sat: v.optional(v.number()),
      act: v.optional(v.number()),
    }),
    // Preferences
    locationPreferences: v.array(v.string()),
    extracurriculars: v.array(v.string()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  searchResults: defineTable({
    userId: v.id("users"),
    profileId: v.id("studentProfiles"),
    // College data from College Scorecard (sorted by admission rate)
    colleges: v.array(v.any()),
    // Metadata
    createdAt: v.number(),
    searchFilters: v.object({
      budget: v.number(),
      states: v.array(v.string()),
      major: v.string(),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_profile", ["profileId"]),
});
