import {
  ConfigUtils,
  DendronError,
  USERS_HIERARCHY,
} from "@dendronhq/common-all";
import type { Handle as ToMarkdownHandle } from "mdast-util-to-markdown";
import { Plugin, Processor } from "unified";
import { createInlineRegexExtension, previousTagTrigger } from "../micromark/inlineRegex";
import { registerSyntaxExtensions } from "../micromark/registerExtensions";
import { SiteUtils } from "../SiteUtils";
import { DendronASTDest, DendronASTTypes, UserTag } from "../types";
import { MDUtilsV5 } from "../utilsv5";
import { PUNCTUATION_MARKS } from "./hashtag";

/** Can have period in the middle */
const GOOD_MIDDLE_CHARACTER = `[^#@|\\[\\]\\s${PUNCTUATION_MARKS}]`;
/** Can have period in the end */
const GOOD_END_CHARACTER = `[^#@|\\[\\]\\s${PUNCTUATION_MARKS}]`;

/** User tags have the form @Lovelace, or @Hamilton.Margaret, or @7of9.
 *
 * User tags are also not allowed to contain any punctuation or quotation marks, and will not include a trailing dot
 * This allows them to be more easily mixed into text, for example:
 *
 * ```
 * Please contact @Ben.Barres.
 * ```
 *
 * Here, the tag is `#important` without the following comma.
 */
export const USERTAG_REGEX = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like foo@example.com)
  `^(?<!\\S)(?<tagSymbol>@)(?<tagContents>` +
    `${GOOD_MIDDLE_CHARACTER}*` +
    `${GOOD_END_CHARACTER}` +
    `)`
);
/** Same as `USERTAG_REGEX`, except that that it doesn't have to be at the start of the string. */
export const USERTAG_REGEX_LOOSE = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like foo@example.com)
  `(?<!\\S)(?<userTag>@)(?<userTagContents>` +
    `${GOOD_MIDDLE_CHARACTER}*` +
    `${GOOD_END_CHARACTER}` +
    `)`
);

export class UserTagUtils {
  static extractTagFromMatch(match: RegExpMatchArray | null) {
    if (match && match.groups) {
      return match.groups.tagContents || match.groups.userTagContents;
    }
    return;
  }

  /**
   *
   * @param text The text to check if it matches an hashtag.
   * @param matchLoose If true, a hashtag anywhere in the string will match. Otherwise the string must contain only the anchor.
   * @returns The identifier for the matched hashtag, or undefined if it did not match.
   */
  static matchUserTag = (
    text: string,
    matchLoose: boolean = true
  ): string | undefined => {
    const match = (matchLoose ? USERTAG_REGEX : USERTAG_REGEX_LOOSE).exec(text);
    return this.extractTagFromMatch(match);
  };
}

type PluginOpts = {};

function userTagToMarkdown(proc: Processor): ToMarkdownHandle {
  return function userTagHandler(node, _parent, _context) {
    const tagNode = node as UserTag;
    const { dest, config } = MDUtilsV5.getProcData(proc);
    const prefix = SiteUtils.getSitePrefixForNote(config);
    switch (dest) {
      case DendronASTDest.MD_DENDRON:
        return tagNode.value;
      case DendronASTDest.MD_REGULAR:
      case DendronASTDest.MD_ENHANCED_PREVIEW:
        return `[${tagNode.value}](${prefix}${tagNode.fname})`;
      default:
        throw new DendronError({ message: "Unable to render user tag" });
    }
  };
}

function userTagSyntax(proc: Processor) {
  return createInlineRegexExtension<UserTag>({
    charCode: "@".charCodeAt(0),
    tokenType: "dendronUserTag",
    mdastType: DendronASTTypes.USERTAG,
    match: USERTAG_REGEX,
    previous: previousTagTrigger,
    toFields: (matched) => {
      const { enableUserTags } = ConfigUtils.getWorkspace(
        MDUtilsV5.getProcData(proc).config
      );
      if (enableUserTags === false) {
        return undefined;
      }
      if (!matched.groups?.tagContents) {
        return undefined;
      }
      return {
        value: matched[0]!,
        fname: `${USERS_HIERARCHY}${matched.groups.tagContents}`,
      } as Omit<UserTag, "type">;
    },
    toMarkdown: userTagToMarkdown(proc),
  });
}

const plugin: Plugin<[PluginOpts?]> = function (
  this: Processor,
  _opts?: PluginOpts
) {
  registerSyntaxExtensions(this, userTagSyntax(this));
};

export { plugin as userTags };
export { PluginOpts as UserTagOpts };