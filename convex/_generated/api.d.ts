/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_findColleges from "../actions/findColleges.js";
import type * as mutations_savedColleges from "../mutations/savedColleges.js";
import type * as mutations_searchResults from "../mutations/searchResults.js";
import type * as myFunctions from "../myFunctions.js";
import type * as queries_savedColleges from "../queries/savedColleges.js";
import type * as queries_searchResults from "../queries/searchResults.js";
import type * as studentProfile from "../studentProfile.js";
import type * as todos from "../todos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/findColleges": typeof actions_findColleges;
  "mutations/savedColleges": typeof mutations_savedColleges;
  "mutations/searchResults": typeof mutations_searchResults;
  myFunctions: typeof myFunctions;
  "queries/savedColleges": typeof queries_savedColleges;
  "queries/searchResults": typeof queries_searchResults;
  studentProfile: typeof studentProfile;
  todos: typeof todos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
