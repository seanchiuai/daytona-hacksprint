import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveSearchResult = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("studentProfiles"),
    colleges: v.array(v.any()),
    searchFilters: v.object({
      budget: v.number(),
      states: v.array(v.string()),
      major: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const searchResultId = await ctx.db.insert("searchResults", {
      userId: args.userId,
      profileId: args.profileId,
      colleges: args.colleges,
      searchFilters: args.searchFilters,
      createdAt: Date.now(),
    });

    return searchResultId;
  },
});
