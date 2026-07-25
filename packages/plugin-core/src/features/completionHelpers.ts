/**
 * Pure completion helpers (no vscode) — Node-smokeable.
 */
import {
  ALIAS_NAME,
  LINK_NAME,
  LINK_NAME_NO_SPACES,
} from "@dendronhq/common-all";
import { HASHTAG_REGEX_LOOSE, USERTAG_REGEX_LOOSE } from "@dendronhq/unified";

/** Zero-pad sort indices so block completions stay ordered in VS Code. */
export function padWithZero(n: number): string {
  if (n > 99) return String(n);
  if (n > 9) return `0${n}`;
  return `00${n}`;
}

// prettier-ignore
export const NOTE_AUTOCOMPLETEABLE_REGEX = new RegExp("" +
  "(?<entireLink>" +
    // This may be a wikilink or reference
    "(?<beforeAnchor>" +
      "(?<beforeNote>" +
        // Should have the starting brackets
        "(?<reference>!)?\\[\\[" +
        // optional alias
        `(${ALIAS_NAME}(?=\\|)\\|)?` +
      ")" +
      // note name followed by brackets
      "(" +
        "(" +
          `(?<note>${LINK_NAME})?` +
          "(?<afterNote>" +
            // anchor
            "(?<hash>#+)(?<anchor>\\^)?" +
            // text of the header or anchor
            "[^\\[\\]]" +
          ")?" +
          // Must have ending brackets
          "\\]\\]" +
        ")|(?<noBracket>" +
          // Or, note name with no spaces and no brackets.
          // The distinction is needed to avoid consuming text following a link if there's no closing bracket.
          `(?<noteNoSpace>${LINK_NAME_NO_SPACES})?` +
          "(?<afterNoteNoSpace>" +
            // anchor
            "(?<hashNoSpace>#+)(?<anchorNoSpace>\\^)?" +
            // text of the header or anchor
            "[^\\[\\]]" +
          ")?" +
        ")" +
        // No ending brackets
      ")" +
    ")" +
    "|" + // or it may be a hashtag (potentially a hashtag that's empty)
    HASHTAG_REGEX_LOOSE.source + "?" +
    "|" + // or it may be a user tag
    USERTAG_REGEX_LOOSE.source + "?" +
  ")",
  "g"
);

// prettier-ignore
export const PARTIAL_WIKILINK_WITH_ANCHOR_REGEX = new RegExp("" +
  "(?<entireLink>" +
    // Should have the starting brackets
    "\\[\\[" +
    "(" +
      // Will then either look like [[^ or [[^anchor
      "(?<trigger>\\^)(?<afterTrigger>[\\w-]*)" +
    "|" + // or like [[alias|note#, or [[alias|note#anchor, or [[#, or [[#anchor
      "(?<beforeAnchor>" +
        // optional alias
        `(${ALIAS_NAME}(?=\\|)\\|)?` +
        // optional note
        `(?<note>${LINK_NAME})?` +
        // anchor
        "(?<hash>#+)(?<anchor>\\^)?" +
      ")" +
      // the text user typed to select the block
      `(?<afterAnchor>${LINK_NAME})?` +
    ")" +
    // May have ending brackets
    "\\]?\\]?" +
  ")",
  "g"
);

/**
 * Find the regex match whose `entireLink` group covers `character` on the line.
 */
export function findMatchAtCharacter(
  line: string,
  character: number,
  regex: RegExp,
): RegExpMatchArray | undefined {
  let found: RegExpMatchArray | undefined;
  // Reset lastIndex for global regexes
  const re = new RegExp(regex.source, regex.flags);
  const matches = line.matchAll(re);
  for (const match of matches) {
    if (match.groups === undefined || match.index === undefined) continue;
    const { entireLink } = match.groups;
    if (
      entireLink &&
      match.index <= character &&
      character <= match.index + entireLink.length
    ) {
      found = match;
    }
  }
  return found;
}

/**
 * Compute replace range [start, end) for note/tag completion within a match.
 */
export function computeNoteCompletionRange(opts: {
  foundIndex: number;
  groups: Record<string, string | undefined>;
}): { start: number; end: number } {
  const { foundIndex, groups } = opts;
  if (groups.hashTag || groups.userTag) {
    const start = foundIndex + 1; /* for the # or @ symbol */
    const end =
      start +
      (groups.tagContents?.length || groups.userTagContents?.length || 0);
    return { start, end };
  }
  // wikilink or reference
  const start = foundIndex + (groups.beforeNote?.length || 0);
  const end = start + (groups.note?.length || groups.noteNoSpace?.length || 0);
  return { start, end };
}

/**
 * Compute replace range for block-anchor completion within a partial wikilink match.
 */
export function computeBlockCompletionRange(opts: {
  foundIndex: number;
  groups: Record<string, string | undefined>;
}): { start: number; end: number } {
  const { foundIndex, groups } = opts;
  let start = foundIndex + 2; /* length of [[ */
  let end = start;
  if (groups.trigger) {
    start += groups.trigger.length;
    end = start;
    if (groups.afterTrigger) end += groups.afterTrigger.length;
  }
  if (groups.beforeAnchor) {
    start += groups.beforeAnchor.length;
    end = start;
    if (groups.afterAnchor) end += groups.afterAnchor.length;
  }
  return { start, end };
}
