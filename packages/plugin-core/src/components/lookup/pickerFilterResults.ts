/**
 * Pure post-query filtering/ranking of picker note results.
 * No VS Code / engine deps — unit-testable in Node.
 */
import {
  NoteProps,
  OrderedMatcher,
  TransformedQueryString,
  VaultUtils,
} from "@dendronhq/common-all";
import { orderBy } from "lodash";

function countDots(subStr: string) {
  return Array.from(subStr).filter((ch) => ch === ".").length;
}

/**
 * When the query ends with `.`, keep descendants of the matched segment and
 * sort by clean hierarchy match quality (see comment inside).
 */
function sortForQueryEndingWithDot(
  transformedQuery: TransformedQueryString,
  itemsToFilter: NoteProps[],
) {
  const lowercaseQuery = transformedQuery.originalQuery.toLowerCase();

  // If the user enters the query 'data.' we want to keep items that have 'data.'
  // and sort the results in the along the following order:
  //
  // ```
  // data.driven                  (data. has clean-match, grandchild-free, 1st in hierarchy)
  // level1.level2.data.integer   (data. has clean-match, grandchild-free, 3rd in hierarchy)
  // l1.l2.l3.data.bool           (data. has clean-match, grandchild-free, 4th in hierarchy)
  // l1.with-data.and-child       (data. has partial match 2nd level)
  // l1.l2.with-data.and-child    (data. has partial match 3rd level)
  // level1.level2.data.integer.has-grandchild
  // l1.l2.with-data.and-child.has-grandchild
  // data.stub (Stub notes come at the end).
  // ```

  const itemsWithMetadata = itemsToFilter
    .map((item) => {
      // Firstly pre-process the items in attempt to find the match.
      const lowercaseFName = item.fname.toLowerCase();
      const matchIndex = lowercaseFName.indexOf(lowercaseQuery);
      return { matchIndex, item };
    })
    // Filter out items without a match.
    .filter((item) => item.matchIndex !== -1)
    // Filter out items where the match is at the end (match does not have children)
    .filter(
      (item) =>
        !(item.matchIndex + lowercaseQuery.length === item.item.fname.length),
    )
    .map((item) => {
      // Meaning the match takes up entire level of the hierarchy.
      // 'one.two-hi.three'->'two-hi.' is clean match while 'o-hi.' is a
      // match but not a clean one.
      const isCleanMatch =
        item.matchIndex === 0 ||
        item.item.fname.charAt(item.matchIndex - 1) === ".";

      const dotsBeforeMatch = countDots(
        item.item.fname.substring(0, item.matchIndex),
      );
      const dotsAfterMatch = countDots(
        item.item.fname.substring(item.matchIndex + lowercaseQuery.length),
      );
      const isStub = item.item.stub;
      const zeroGrandchildren = dotsAfterMatch === 0;
      return {
        isStub,
        dotsBeforeMatch,
        dotsAfterMatch,
        zeroGrandchildren,
        isCleanMatch,
        ...item,
      };
    });

  const sortOrder: { fieldName: string; order: "asc" | "desc" }[] = [
    { fieldName: "isStub", order: "desc" },
    { fieldName: "zeroGrandchildren", order: "desc" },
    { fieldName: "isCleanMatch", order: "desc" },
    { fieldName: "dotsAfterMatch", order: "asc" },
    { fieldName: "dotsBeforeMatch", order: "asc" },
  ];

  return orderBy(
    itemsWithMetadata,
    sortOrder.map((it) => it.fieldName),
    sortOrder.map((it) => it.order),
  ).map((item) => item.item);
}

/**
 * Apply vault / wiki-link / hierarchy-dot filters to engine note results
 * before they are shown in lookup.
 */
export function filterPickerResults({
  itemsToFilter,
  transformedQuery,
}: {
  itemsToFilter: NoteProps[];
  transformedQuery: TransformedQueryString;
}): NoteProps[] {
  // If we have specific vault name within the query then keep only those results
  // that match the specific vault name.
  if (transformedQuery.vaultName) {
    itemsToFilter = itemsToFilter.filter(
      (item) => VaultUtils.getName(item.vault) === transformedQuery.vaultName,
    );
  }

  // Ending the query with a dot adds special processing of showing matched descendents.
  if (transformedQuery.originalQuery.endsWith(".")) {
    itemsToFilter = sortForQueryEndingWithDot(transformedQuery, itemsToFilter);
  }

  if (transformedQuery.splitByDots && transformedQuery.splitByDots.length > 0) {
    const matcher = new OrderedMatcher(transformedQuery.splitByDots);

    itemsToFilter = itemsToFilter.filter((item) => matcher.isMatch(item.fname));
  }

  if (transformedQuery.wasMadeFromWikiLink) {
    // If we are dealing with a wiki link we want to show only the exact matches
    // for the link instead some fuzzy/partial matches.
    itemsToFilter = itemsToFilter.filter(
      (item) => item.fname === transformedQuery.queryString,
    );
  }

  return itemsToFilter;
}
