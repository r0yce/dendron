/**
 * Frontmatter offset helpers (1-indexed line numbers) and anchor-in-ref checks.
 */
import _ from "lodash";
import { FoundRefT } from "./types";

export function getFrontmatterEndingOffsetPosition(input: string): number | undefined {
  const frontMatterEndingStringPattern = "\n---";
  const offset = input.indexOf(frontMatterEndingStringPattern);

  if (offset < 0) {
    return undefined;
  }

  return offset + frontMatterEndingStringPattern.length;
}

/**
 * This returns the line number of the '---' that concludes the frontmatter
 * section of a note. The line numbers are 1 indexed in the document. If the
 * frontmatter ending marker is not found, this returns undefined.
 * @param input
 * @returns
 */
export function getOneIndexedFrontmatterEndingLineNumber(
  input: string
): number | undefined {
  const offset = getFrontmatterEndingOffsetPosition(input);

  if (!offset) {
    return undefined;
  }

  return (_.countBy(input.slice(0, offset))["\n"] || 0) + 1;
}

/**
 * Given a {@link FoundRefT} and a list of anchor names,
 * check if ref contains an anchor name to update.
 * @param ref
 * @param anchorNamesToUpdate
 * @returns
 */
export function hasAnchorsToUpdate(
  ref: FoundRefT,
  anchorNamesToUpdate: string[]
) {
  const matchText = ref.matchText;
  const wikiLinkRegEx = /\[\[(?<text>.+?)\]\]/;

  const wikiLinkMatch = wikiLinkRegEx.exec(matchText);

  if (wikiLinkMatch && wikiLinkMatch.groups?.text) {
    let processed = wikiLinkMatch.groups.text;
    if (processed.includes("|")) {
      const [_alias, link] = processed.split("|");
      processed = link || processed;
    }

    if (processed.includes("#")) {
      const [_fname, anchor] = processed.split("#");
      const a = anchor!; // guarded by includes("#")
      if (a.startsWith("^")) {
        return anchorNamesToUpdate.includes(a.substring(1));
      }
      return anchorNamesToUpdate.includes(a);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
