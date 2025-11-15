import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveCollege = mutation({
  args: {
    collegeId: v.string(),
    name: v.string(),
    city: v.string(),
    state: v.string(),
    tuitionInState: v.number(),
    tuitionOutOfState: v.optional(v.number()),
    admissionRate: v.optional(v.number()),
    avgSAT: v.optional(v.number()),
    avgACT: v.optional(v.number()),
    studentSize: v.optional(v.number()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already saved
    const existing = await ctx.db
      .query("savedColleges")
      .withIndex("by_user_and_college", (q) =>
        q.eq("userId", user._id).eq("collegeId", args.collegeId)
      )
      .unique();

    if (existing) {
      // Already saved, return existing ID
      return existing._id;
    }

    // Save the college
    const savedCollegeId = await ctx.db.insert("savedColleges", {
      userId: user._id,
      collegeId: args.collegeId,
      name: args.name,
      city: args.city,
      state: args.state,
      tuitionInState: args.tuitionInState,
      tuitionOutOfState: args.tuitionOutOfState,
      admissionRate: args.admissionRate,
      avgSAT: args.avgSAT,
      avgACT: args.avgACT,
      studentSize: args.studentSize,
      url: args.url,
      savedAt: Date.now(),
    });

    return savedCollegeId;
  },
});

export const unsaveCollege = mutation({
  args: {
    collegeId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Find the saved college
    const savedCollege = await ctx.db
      .query("savedColleges")
      .withIndex("by_user_and_college", (q) =>
        q.eq("userId", user._id).eq("collegeId", args.collegeId)
      )
      .unique();

    if (!savedCollege) {
      throw new Error("College not found in saved list");
    }

    // Delete it
    await ctx.db.delete(savedCollege._id);
  },
});
