# Console logs from the browser

react-dom-client.development.js:25630 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
clerk.browser.js:19 Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview
warnOnce @ clerk.browser.js:19
turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 146ms
Mona-Sans.woff2:1  Failed to load resource: the server responded with a status of 404 ()
turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 585ms
turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 213ms
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] 'Fetching colleges from College Scorecard...'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '\n' +
  '================================================================================'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '🏫 COLLEGE SCORECARD API REQUEST'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '================================================================================'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '\n🔍 SEARCH FILTERS:'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '{\n  "budget": 500000,\n  "states": [],\n  "major": "CS"\n}'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '\n🌐 API URL:'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] 'https://api.data.gov/ed/collegescorecard/v1/schools?api_key=adj2lngXgMXJwuG1Y6i91cvYYI1jg9O7dG13sC10&fields=id%2Cschool.name%2Cschool.city%2Cschool.state%2Cschool.school_url%2Clatest.cost.tuition.in_state%2Clatest.cost.tuition.out_of_state%2Clatest.admissions.admission_rate.overall%2Clatest.admissions.sat_scores.average.overall%2Clatest.admissions.act_scores.midpoint.cumulative%2Clatest.student.size&school.operating=1&latest.cost.tuition.in_state__range=0..500000&per_page=100&page=0&_sort=latest.cost.tuition.in_state%3Aasc'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '\n📋 REQUEST PARAMS:'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '{\n' +
  '  "api_key": "adj2lngXgMXJwuG1Y6i91cvYYI1jg9O7dG13sC10",\n' +
  '  "fields": "id,school.name,school.city,school.state,school.school_url,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.admissions.admission_rate.overall,latest.admissions.sat_scores.average.overall,latest.admissions.act_scores.midpoint.cumulative,latest.student.size",\n' +
  '  "school.operating": "1",\n' +
  '  "latest.cost.tuition.in_state__range": "0..500000",\n' +
  '  "per_page": "100",\n' +
  '  "page": "0",\n' +
  '  "_sort": "latest.cost.tuition.in_state:asc"\n' +
  '}'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '================================================================================\n'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [LOG] '⏳ Calling College Scorecard API...\n'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [ERROR] '\n❌ COLLEGE SCORECARD API ERROR:'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [ERROR] 'Status: 500 Internal Server Error'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [ERROR] '\n' +
  '================================================================================'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [ERROR] '❌ COLLEGE SCORECARD API FAILED'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [ERROR] '================================================================================'
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [ERROR] 'Error:' Error: College Scorecard API error: 500 Internal Server Error
    at fetchCollegesFromScorecard (convex:/user/actions/findColleges.js:4981:94)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async handler (convex:/user/actions/findColleges.js:4919:13)
    at async invokeFunction (convex:/user/actions/findColleges.js:1080:9)
    at async invokeAction (convex:/user/actions/findColleges.js:1140:10)
    at async executeInner (bundledFunctions.js:28196:17)
    at async execute (bundledFunctions.js:28139:19)
    at bundledFunctions.js:28096:21
    at bundledFunctions.js:28093:14
    at async invoke (bundledFunctions.js:28089:18)
logging.ts:103 [CONVEX A(actions/findColleges:findColleges)] [ERROR] '================================================================================\n'
intercept-console-error.ts:44 [CONVEX A(actions/findColleges:findColleges)] [Request ID: 3576c78573393c0a] Server Error
Uncaught Error: Could not retrieve college data. Please try again later.
    at fetchCollegesFromScorecard (../../convex/actions/findColleges.ts:192:2)
    at async handler (../../convex/actions/findColleges.ts:46:6)

error @ intercept-console-error.ts:44
intercept-console-error.ts:44 Search failed: Error: [CONVEX A(actions/findColleges:findColleges)] [Request ID: 3576c78573393c0a] Server Error
Uncaught Error: Could not retrieve college data. Please try again later.
    at fetchCollegesFromScorecard (../../convex/actions/findColleges.ts:192:2)
    at async handler (../../convex/actions/findColleges.ts:46:6)

  Called by client
    at fetchCollegesFromScorecard (../../convex/actions/findColleges.ts:192:2)
    at async handler (../../convex/actions/findColleges.ts:46:6)

  Called by client
    at BaseConvexClient.action (http://localhost:3000/_next/static/chunks/node_modules_convex_dist_esm_8dd34609._.js:4169:19)
    at async handleSearch (http://localhost:3000/_next/static/chunks/_14e23953._.js:153:28)
error @ intercept-console-error.ts:44



# NextJS errors
## Error Type
Console Error

## Error Message
[CONVEX A(actions/findColleges:findColleges)] [Request ID: 3576c78573393c0a] Server Error
Uncaught Error: Could not retrieve college data. Please try again later.
    at fetchCollegesFromScorecard (../../convex/actions/findColleges.ts:192:2)
    at async handler (../../convex/actions/findColleges.ts:46:6)



    at fetchCollegesFromScorecard (../../convex/actions/findColleges.ts:192:2)
    at async handler (../../convex/actions/findColleges.ts:46:6)

Next.js version: 15.5.6 (Turbopack)

## Error Type
Console Error

## Error Message
[CONVEX A(actions/findColleges:findColleges)] [Request ID: 3576c78573393c0a] Server Error
Uncaught Error: Could not retrieve college data. Please try again later.
    at fetchCollegesFromScorecard (../../convex/actions/findColleges.ts:192:2)
    at async handler (../../convex/actions/findColleges.ts:46:6)

  Called by client


    at fetchCollegesFromScorecard (../../convex/actions/findColleges.ts:192:2)
    at async handler (../../convex/actions/findColleges.ts:46:6)
    at async handleSearch (app/search/page.tsx:27:22)

## Code Frame
  25 |
  26 |     try {
> 27 |       const result = await findColleges({
     |                      ^
  28 |         profileId: profile._id,
  29 |       });
  30 |

Next.js version: 15.5.6 (Turbopack)
