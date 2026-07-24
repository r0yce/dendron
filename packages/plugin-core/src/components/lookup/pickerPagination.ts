/**
 * Pure pagination helpers for lookup QuickPick result lists.
 */
export type PaginationSlice<T> = {
  page: T[];
  hasMore: boolean;
  /** Full list when hasMore; otherwise undefined (no need to retain). */
  allResults?: T[];
  offset?: number;
};

/**
 * Slice results for the first QuickPick page.
 */
export function sliceForPaginationLimit<T>(
  nodes: T[],
  limit: number,
): PaginationSlice<T> {
  if (nodes.length > limit) {
    return {
      page: nodes.slice(0, limit),
      hasMore: true,
      allResults: nodes,
      offset: limit,
    };
  }
  return { page: nodes, hasMore: false };
}
