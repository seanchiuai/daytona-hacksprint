import { query } from "../_generated/server";
import { v } from "convex/values";

export const getSavedColleges = query({
  args: {},
  handler: async (ctx) => {
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

    // Get all saved colleges for this user
    const savedColleges = await ctx.db
      .query("savedColleges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return savedColleges;
  },
});

export const isCollegeSaved = query({
  args: {
    collegeId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return false;
    }

    // Check if college is saved
    const savedCollege = await ctx.db
      .query("savedColleges")
      .withIndex("by_user_and_college", (q) =>
        q.eq("userId", user._id).eq("collegeId", args.collegeId)
      )
      .unique();

    return !!savedCollege;
  },
});
