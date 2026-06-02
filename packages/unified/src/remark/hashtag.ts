import {
  ConfigUtils,
  DendronError,
  TAGS_HIERARCHY,
} from "@dendronhq/common-all";
import type { Handle as ToMarkdownHandle } from "mdast-util-to-markdown";
import { Plugin, Processor } from "unified";
import { createInlineRegexExtension, previousTagTrigger } from "../micromark/inlineRegex";
import { registerSyntaxExtensions } from "../micromark/registerExtensions";
import { SiteUtils } from "../SiteUtils";
import { DendronASTDest, DendronASTTypes, HashTag } from "../types";
import { MDUtilsV5 } from "../utilsv5";

/** All sorts of punctuation marks and quotation marks from different languages. Please add any that may be missing.
 *
 * Be warned that this excludes period (.) as it has a special meaning in Dendron. Make sure to handle it appropriately depending on the context.
 *
 * Mind that this may have non regex-safe characters, run it through `_.escapeRegExp` if needed.
 */
export const PUNCTUATION_MARKS =
  ",;:'\"<>()?!`~«‹»›„“‟”’❝❞❮❯⹂〝〞〟＂‚‘‛❛❜❟［］【】…‥「」『』·؟،।॥‽⸘¡¿⁈⁉";

/** Can't start with a number or period */
const GOOD_FIRST_CHARACTER = `[^0-9#@|\\[\\]\\s.${PUNCTUATION_MARKS}]`;
/** Can have numbers and period in the middle */
const GOOD_MIDDLE_CHARACTER = `[^@#|\\[\\]\\s${PUNCTUATION_MARKS}]`;
/** Can have numbers and period at the end */
const GOOD_END_CHARACTER = `[^@#|\\[\\]\\s${PUNCTUATION_MARKS}]`;

/** Hashtags have the form #foo, or #foo.bar, or #f123
 *
 * Hashtags are not allowed to start with numbers: this is to reserve them in
 * case we want to add Github issues integration, where issues look like #123
 *
 * Hashtags are also not allowed to contain any punctuation or quotation marks.
 * This allows them to be more easily mixed into text, for example:
 *
 * ```
 * This issue is #important, and should be prioritized.
 * ```
 *
 * Here, the tag is `#important` without the following comma.
 */
export const HASHTAG_REGEX = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like ab#cd)
  `^(?<!\\S)(?<hashTag>#)(?<tagContents>` +
    // 2 or more characters, like #a1x or #a.x. This MUST come before 1 character case, or regex will match 1 character and stop.
    `${GOOD_FIRST_CHARACTER}${GOOD_MIDDLE_CHARACTER}*${GOOD_END_CHARACTER}` +
    // or
    "|" +
    // Just 1 character, like #a
    `${GOOD_FIRST_CHARACTER}` +
    ")"
);
/** Same as `HASHTAG_REGEX`, except that that it doesn't have to be at the start of the string. */
export const HASHTAG_REGEX_LOOSE = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like ab#cd)
  `(?<!\\S)(?<hashTag>#)(?<tagContents>` +
    // 2 or more characters, like #a1x or #a.x. This MUST come before 1 character case, or regex will match 1 character and stop.
    `${GOOD_FIRST_CHARACTER}${GOOD_MIDDLE_CHARACTER}*${GOOD_END_CHARACTER}` +
    // or
    "|" +
    // Just 1 character, like #a
    `${GOOD_FIRST_CHARACTER}` +
    ")"
);
/** Used for `getWordAtRange` queries. Too permissive, but the full regex breaks the function. */
export const HASHTAG_REGEX_BASIC = new RegExp(`#${GOOD_MIDDLE_CHARACTER}+`);

export class HashTagUtils {
  static extractTagFromMatch(match: RegExpMatchArray | null) {
    if (match && match.groups) return match.groups.tagContents;
    return undefined;
  }

  /**
   *
   * @param text The text to check if it matches an hashtag.
   * @param matchLoose If true, a hashtag anywhere in the string will match. Otherwise the string must contain only the anchor.
   * @returns The identifier for the matched hashtag, or undefined if it did not match.
   */
  static matchHashtag = (
    text: string,
    matchLoose: boolean = true
  ): string | undefined => {
    const match = (matchLoose ? HASHTAG_REGEX : HASHTAG_REGEX_LOOSE).exec(text);
    return this.extractTagFromMatch(match);
  };
}

type PluginOpts = {};

function hashtagToMarkdown(proc: Processor): ToMarkdownHandle {
  return function hashtagHandler(node, _parent, _context) {
    const tagNode = node as HashTag;
    const { dest, config } = MDUtilsV5.getProcData(proc);
    const prefix = SiteUtils.getSitePrefixForNote(config);
    switch (dest) {
      case DendronASTDest.MD_DENDRON:
        return tagNode.value;
      case DendronASTDest.MD_REGULAR:
      case DendronASTDest.MD_ENHANCED_PREVIEW:
        return `[${tagNode.value}](${prefix}${tagNode.fname})`;
      default:
        throw new DendronError({ message: "Unable to render hashtag" });
    }
  };
}

function hashtagSyntax(proc: Processor) {
  return createInlineRegexExtension<HashTag>({
    charCode: "#".charCodeAt(0),
    tokenType: "dendronHashtag",
    mdastType: DendronASTTypes.HASHTAG,
    match: HASHTAG_REGEX,
    previous: previousTagTrigger,
    toFields: (matched) => {
      const { enableHashTags } = ConfigUtils.getWorkspace(
        MDUtilsV5.getProcData(proc).config
      );
      if (enableHashTags === false) {
        return undefined;
      }
      if (!matched.groups?.tagContents) {
        return undefined;
      }
      return {
        value: matched[0]!,
        fname: `${TAGS_HIERARCHY}${matched.groups.tagContents}`,
      } as Omit<HashTag, "type">;
    },
    toMarkdown: hashtagToMarkdown(proc),
  });
}

const plugin: Plugin<[PluginOpts?]> = function (
  this: Processor,
  _opts?: PluginOpts
) {
  registerSyntaxExtensions(this, hashtagSyntax(this));
};

export { plugin as hashtags };
export { PluginOpts as HashTagOpts };