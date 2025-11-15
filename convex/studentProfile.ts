import { mutation, query } from "./_generated/server";
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

export const getProfileById = query({
  args: {
    profileId: v.id("studentProfiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});
