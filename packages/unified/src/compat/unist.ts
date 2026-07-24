/**
 * Safe re-exports for unist/unified ecosystem packages that mix ESM named
 * exports with CJS interop. Prefer importing from here over deep package paths
 * so default-import breakage (e.g. visitParents is not a function) cannot recur.
 */

import { visit as visitFn } from "unist-util-visit";
import { visitParents as visitParentsFn } from "unist-util-visit-parents";

export const visit = visitFn;
export const visitParents = visitParentsFn;

export default {
  visit,
  visitParents,
};
