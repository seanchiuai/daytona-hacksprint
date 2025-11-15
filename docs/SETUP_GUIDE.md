# Setup Guide: LLM-Powered College Matching

## Quick Start

The feature is **ready to use**! All backend code is deployed and API keys are configured.

## What's Already Done

✅ **Backend**:
- Convex schema updated with `searchResults` table
- Action created: `findColleges` (fetches + analyzes colleges)
- Queries created: Get search results
- Mutations created: Save search results
- Environment variables set in Convex

✅ **Frontend**:
- Search page: `/app/search/page.tsx`
- Results page: `/app/results/[id]/page.tsx`

✅ **API Keys**:
- Anthropic API key set in Convex
- College Scorecard API key set in Convex

## How to Test

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Create a Student Profile (if you haven't)

1. Navigate to `http://localhost:3000/profile`
2. Fill out the profile form:
   - Budget: e.g., $20,000/year
   - Income: e.g., $50,000/year
   - GPA: e.g., 3.5
   - Major: e.g., "Computer Science"
   - Location: Select states like "CA", "NY", "TX"
   - Test scores (optional): SAT 1200, ACT 26
   - Extracurriculars: e.g., "Debate", "Robotics"
3. Save the profile

### 3. Run College Search

1. Navigate to `http://localhost:3000/search`
2. Review your search criteria
3. Click **"Find Colleges"**
4. Wait 10-20 seconds while:
   - System fetches colleges from College Scorecard
   - Claude AI analyzes and ranks them
   - Results are saved to database
5. You'll be redirected to the results page

### 4. View Results

The results page will show:
- Ranked colleges (with #1 being the best fit)
- Cost ratings (Excellent/Good/Fair)
- Fit scores (0-100)
- Personalized AI analysis for each college
- Admission stats, test scores, student size
- Links to college websites

## Expected Behavior

### Successful Search
- **Loading**: 10-20 seconds
- **Results**: Colleges ranked by affordability and fit
- **Top Result**: Best cost/fit match based on Claude AI analysis
- **Analysis**: 2-3 sentences explaining why each college fits

### Error Cases

**No Profile Found**:
- Message: "Please create a profile first"
- Action: Redirects to `/profile`

**No Colleges Found**:
- Message: "No colleges found matching your criteria. Try adjusting your budget or location preferences."
- Action: User can modify profile and search again

**API Rate Limit**:
- Message: "AI service is temporarily busy. Please try again in a moment."
- Action: Wait a few seconds and retry

## Testing Different Scenarios

### Test Case 1: Low Budget
- Budget: $10,000/year
- Expected: More community colleges, in-state public schools

### Test Case 2: High GPA/Scores
- GPA: 4.0, SAT: 1500
- Expected: AI suggests better academic matches with higher admission standards

### Test Case 3: Specific Location
- States: Only CA
- Expected: Only California colleges returned

### Test Case 4: High Budget
- Budget: $50,000/year
- Expected: Mix of public and private schools

## Monitoring Costs

### Claude AI Usage
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Check "Usage" tab
3. Monitor token consumption per search
4. **Expected**: $0.01-$0.05 per search

### Estimated Costs
- **10 searches**: ~$0.10-$0.50
- **100 searches**: ~$1-$5
- **1,000 searches**: ~$10-$50

## Troubleshooting

### Problem: Search takes too long (>30 seconds)
**Possible Cause**: Too many colleges to analyze
**Solution**: Reduce budget or add location filters to narrow results

### Problem: "Profile not found" error
**Possible Cause**: Not authenticated or profile not created
**Solution**: Make sure you're logged in and have created a profile

### Problem: Malformed JSON from Claude
**Possible Cause**: Claude returned unexpected format
**Solution**: This is rare, but handled gracefully. Try again.

### Problem: College Scorecard API error
**Possible Cause**: API rate limit or downtime
**Solution**: Wait a few minutes and retry

## Advanced Configuration

### Modify Search Parameters

Edit `/convex/actions/findColleges.ts`:

```typescript
// Change number of colleges returned
per_page: "100", // Change to "50" for faster searches

// Change sorting
_sort: "latest.cost.tuition.in_state:asc", // Or "desc" for highest cost first
```

### Modify Claude Prompt

Edit `/convex/actions/findColleges.ts` line ~194:

```typescript
const prompt = `You are an expert college advisor...`
```

Adjust the weighting:
- Cost weight (currently 50%)
- Academic match weight (currently 25%)
- Location weight (currently 15%)
- Major fit weight (currently 10%)

### Add Caching

To avoid re-analyzing same searches:

```typescript
// Before calling Claude, check if we've analyzed this combination
const existingResult = await ctx.runQuery(api.queries.searchResults.getCachedResult, {
  profileId,
  filters,
});

if (existingResult && existingResult.createdAt > Date.now() - 24 * 60 * 60 * 1000) {
  // Use cached result if less than 24 hours old
  return { searchResultId: existingResult._id };
}
```

## Next Steps

### Immediate Testing
1. ⬜ Test with a real student profile
2. ⬜ Verify results make sense (cost-prioritized)
3. ⬜ Check Claude analysis quality
4. ⬜ Verify all college data displays correctly

### Future Enhancements
1. ⬜ Add caching to reduce API costs
2. ⬜ Implement major filtering with CIP codes
3. ⬜ Add "Save Favorite Colleges" feature
4. ⬜ Export results to PDF
5. ⬜ Email results to user

## Support

### API Key Issues
If you need to update API keys:

```bash
# Update Anthropic key
npx convex env set ANTHROPIC_API_KEY your-new-key

# Update College Scorecard key
npx convex env set COLLEGE_SCORECARD_API_KEY your-new-key
```

### Deployment
To deploy to production:

```bash
npx convex deploy
npm run build
```

Then deploy Next.js app to Vercel or your preferred platform.

## Files Reference

### Backend
- `/convex/schema.ts` - Database schema
- `/convex/actions/findColleges.ts` - Main search logic
- `/convex/queries/searchResults.ts` - Get results
- `/convex/mutations/searchResults.ts` - Save results
- `/convex/studentProfile.ts` - Profile queries

### Frontend
- `/app/search/page.tsx` - Search interface
- `/app/results/[id]/page.tsx` - Results display
- `/app/profile/page.tsx` - Profile creation

### Documentation
- `/docs/llm-college-matching-implementation.md` - Full implementation details
- `/docs/convexGuidelines.md` - Convex best practices
- `/.claude/plans/plan-llm-college-matching.md` - Original plan

## Success!

The LLM-Powered College Matching feature is fully implemented and ready to use. Start by creating a profile and running your first search!
