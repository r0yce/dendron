/**
 * Pure helpers for BacklinksTreeDataProvider (sort, descriptions, snippets).
 * Node-smokeable.
 */
import _ from "lodash";

/** Collapse whitespace and cap length for the tree description column. */
export function formatOneLineSnippet(line: string, maxLen = 72): string {
  return line.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

export function formatNoteLevelBacklinkDescription(opts: {
  linkCount: number;
  candidateCount: number;
}): string {
  const { linkCount, candidateCount } = opts;
  let linkCountDescription: string | undefined;
  if (linkCount === 1) {
    linkCountDescription = "1 link";
  } else if (linkCount > 1) {
    linkCountDescription = `${linkCount} links`;
  }

  let candidateCountDescription: string | undefined;
  if (candidateCount === 1) {
    candidateCountDescription = "1 candidate";
  } else if (candidateCount > 1) {
    candidateCountDescription = `${candidateCount} candidates`;
  }

  return _.compact([linkCountDescription, candidateCountDescription]).join(
    ", ",
  );
}

export function formatRefLevelDescription(opts: {
  lineNum: number;
  snippet: string;
}): string {
  const { lineNum, snippet } = opts;
  return snippet ? `L${lineNum + 1} · ${snippet}` : `on line ${lineNum + 1}`;
}

/**
 * Sort path keys by note.updated descending (last updated first).
 * `getUpdated` returns timestamp for a path; missing → treat as 0.
 */
export function sortPathsByLastUpdated(
  paths: string[],
  getUpdated: (path: string) => number | undefined,
): string[] {
  return paths.slice().sort((p1, p2) => {
    const ref2Updated = getUpdated(p2) ?? 0;
    const ref1Updated = getUpdated(p1) ?? 0;
    return ref2Updated - ref1Updated;
  });
}

/**
 * Lines of surrounding context to request per reference count.
 * Matches historical BacklinksTreeDataProvider hover sizing.
 */
export function linesOfContextForRefCount(
  refCount: number,
  maxLines: number,
): number {
  switch (refCount) {
    case 1:
      return maxLines;
    case 2:
      return 7;
    case 3:
      return 5;
    default:
      return 3;
  }
}
