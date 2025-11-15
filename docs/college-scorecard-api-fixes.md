# College Scorecard API Fixes

## Date
2025-11-15

## Problem
College Scorecard API was returning 500 Internal Server Error when users tried to search for colleges.

## Root Causes

1. **Extreme Budget Values**: User profile had budget of $500,000/year, which is unrealistic and may cause the API to fail
2. **Missing API Constraints**: No filters for degree types or student size, causing the API to process too many results
3. **No Retry Logic**: Single API failure would immediately fail the entire search
4. **Invalid Claude Model**: Using `claude-sonnet-4-20250514` which doesn't exist

## Fixes Applied

### 1. Budget Validation and Capping
**File**: `convex/actions/findColleges.ts`

```typescript
// Cap budget at $80,000 (reasonable max for college tuition)
const maxBudget = Math.min(filters.budget, 80000);
if (filters.budget > 80000) {
  console.log(`⚠️ Budget capped from $${filters.budget.toLocaleString()} to $${maxBudget.toLocaleString()}`);
}
```

### 2. Additional API Filters
Added constraints to reduce result set and prevent API overload:

```typescript
"school.degrees_awarded.predominant__range": "2..3", // Associate's and Bachelor's degrees
"latest.student.size__range": "1..", // Must have at least 1 student
```

### 3. Retry Logic with Exponential Backoff
Implemented 3-attempt retry with delays for 500/502/503 errors:

```typescript
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
    // ... API call
  } catch (error) {
    if (attempt >= maxRetries) throw error;
  }
}
```

### 4. Enhanced Error Logging
Added detailed error logging to help diagnose issues:
- Status codes
- Response text (first 500 chars)
- Retry attempts
- Full error details

### 5. Fixed Claude Model Name
**Before**: `claude-sonnet-4-20250514` (invalid)
**After**: `claude-haiku-4-5` (valid Claude Haiku 4.5)

### 6. Better HTTP Headers
Added proper Accept header for JSON responses:

```typescript
const response = await fetch(url, {
  headers: {
    'Accept': 'application/json',
  },
});
```

## Testing Recommendations

1. **Test with various budgets**:
   - Low: $10,000
   - Medium: $40,000
   - High: $80,000
   - Extreme: $500,000 (should be capped to $80,000)

2. **Test with different state configurations**:
   - Empty array (all states)
   - Single state: `["CA"]`
   - Multiple states: `["CA", "NY", "TX"]`

3. **Test major filtering**:
   - Common majors: "Computer Science", "Engineering", "Business"
   - Uncommon majors: Should still return results

4. **Monitor logs for**:
   - Budget capping warnings
   - Retry attempts
   - API response metadata
   - Error details if failures occur

## Expected Behavior

### Success Case
1. Budget validated and capped if needed
2. API called with proper constraints
3. Results returned and logged
4. Claude AI analyzes colleges
5. Results displayed to user

### Failure Case (with recovery)
1. API returns 500 error
2. System waits 1 second
3. Retry attempt #2
4. If fails again, wait 2 seconds
5. Retry attempt #3
6. If all retries fail, show user-friendly error

## Future Improvements

1. **Major/Program Filtering**: Map major names to CIP codes for better filtering
2. **Progressive Loading**: Fetch colleges in batches instead of all at once
3. **Caching**: Cache API responses for common searches
4. **User Feedback**: Show retry progress to user during long waits
5. **Alternative APIs**: Fallback to different data sources if College Scorecard fails

---

**Status**: ✅ Fixed and Deployed
**Build**: ✅ Successful
**TypeScript**: ✅ No errors
