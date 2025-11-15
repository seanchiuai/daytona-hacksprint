import { query } from "../_generated/server";
import { v } from "convex/values";

export const getSearchResultById = query({
  args: {
    searchResultId: v.id("searchResults"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.searchResultId);
  },
});

export const getLatestSearchResult = query({
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

    // Get latest search result
    const searchResult = await ctx.db
      .query("searchResults")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return searchResult;
  },
});

export const getUserSearchHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Find user in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const limit = args.limit ?? 10;

    // Get user's search results, ordered by most recent
    const searchResults = await ctx.db
      .query("searchResults")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return searchResults;
  },
});
