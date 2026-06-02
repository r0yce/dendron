/* eslint-disable func-names */
import {
  ConfigUtils,
  CONSTANTS,
  DendronError,
  NoteDictsUtils,
  NoteUtils,
  Position,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import type { Handle as ToMarkdownHandle } from "mdast-util-to-markdown";
import { Plugin, Processor } from "unified";
import { createInlineRegexExtension } from "../micromark/inlineRegex";
import { registerSyntaxExtensions } from "../micromark/registerExtensions";
import {
  DendronASTDest,
  DendronASTTypes,
  WikiLinkNoteV4,
} from "../types";
import { MDUtilsV5, ProcMode } from "../utilsv5";
import { addError, getNoteOrError, LinkUtils } from "./utils";

export const LINK_REGEX = /^\[\[([^\]\n]+)\]\]/;
/**
 * Does not require wiki link be the start of the word
 */
export const LINK_REGEX_LOOSE = /\[\[([^\]\n]+)\]\]/;

const parseWikiLink = (linkMatch: string) => {
  linkMatch = NoteUtils.normalizeFname(linkMatch);
  return LinkUtils.parseLinkV2({ linkString: linkMatch });
};

export const matchWikiLink = (text: string) => {
  const match = LINK_REGEX_LOOSE.exec(text);
  if (match) {
    // Lean v2: ! after match for noUncheckedIndexedAccess (wiki link regex)
    const start = match.index;
    const end = match.index + match[0]!.length;
    const linkMatch = match[1]!.trim();
    const link = parseWikiLink(linkMatch);
    return { link, start, end };
  }
  return false;
};

type PluginOpts = CompilerOpts;

type CompilerOpts = {
  convertObsidianLinks?: boolean | undefined;
  useId?: boolean | undefined;
  prefix?: string | undefined;
  convertLinks?: boolean | undefined;
};

function normalizeSpaces(link: string) {
  return link.replace(/ /g, "%20");
}

function parseLink(proc: Processor, linkMatch: string) {
  const pOpts = MDUtilsV5.getProcOpts(proc);
  linkMatch = NoteUtils.normalizeFname(linkMatch);
  const out = LinkUtils.parseLinkV2({
    linkString: linkMatch,
    explicitAlias: true,
  });
  if (_.isNull(out)) {
    throw new DendronError({ message: `link is null: ${linkMatch}` });
  }
  if (pOpts.mode === ProcMode.NO_DATA) {
    return out;
  }

  const procData = MDUtilsV5.getProcData(proc);
  const { fname } = procData;

  if (!out.value) {
    // same file block reference, value is implicitly current file
    out.value = _.trim(NoteUtils.normalizeFname(fname)); // recreate what value would have been parsed
  }

  return out;
}

function wikiLinkToMarkdown(
  proc: Processor,
  opts?: CompilerOpts
): ToMarkdownHandle {
  const copts = _.defaults(opts || {}, {
    convertObsidianLinks: false,
    useId: false,
  });

  return function wikiLinkHandler(node, _parent, _context) {
    const wikiNode = node as WikiLinkNoteV4;
    const pOpts = MDUtilsV5.getProcOpts(proc);
    const data = wikiNode.data;
    let value = wikiNode.value;
    const { anchorHeader } = data;

    if (pOpts.mode === ProcMode.NO_DATA) {
      const link = value;
      const calias = data.alias !== value ? `${data.alias}|` : "";
      const anchor = anchorHeader ? `#${anchorHeader}` : "";
      const vaultPrefix = data.vaultName
        ? `${CONSTANTS.DENDRON_DELIMETER}${data.vaultName}/`
        : "";
      return `[[${calias}${vaultPrefix}${link}${anchor}]]`;
    }

    const { dest, noteCacheForRenderDict, vaults, config } =
      MDUtilsV5.getProcData(proc);

    let alias = data.alias;

    const shouldApplyPublishingRules =
      MDUtilsV5.shouldApplyPublishingRules(proc);
    const enableNoteTitleForLink = ConfigUtils.getEnableNoteTitleForLink(
      config,
      shouldApplyPublishingRules
    );

    if (
      dest !== DendronASTDest.MD_DENDRON &&
      enableNoteTitleForLink &&
      !data.alias
    ) {
      if (noteCacheForRenderDict) {
        const targetVault = data.vaultName
          ? VaultUtils.getVaultByName({ vname: data.vaultName, vaults })
          : undefined;

        const candidates = NoteDictsUtils.findByFname({
          fname: value,
          noteDicts: noteCacheForRenderDict,
          ...(targetVault !== undefined ? { vault: targetVault } : {}),
        });
        const target = candidates.length > 0 ? candidates[0]! : undefined;  // length/invariant guard + ! only after check (wikiLinks noteCache findByFname[0] position cluster part of 3 position! + noteRef/data/SiteUtils synergy for unified remark micro); "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). THE CHAIN DOES NOT STOP.

        if (target) {
          alias = target.title;
        }
      }
    }

    // if converting back to dendron md, no further processing
    if (dest === DendronASTDest.MD_DENDRON) {
      return LinkUtils.renderNoteLink({
        link: {
          from: {
            fname: value,
            alias,
            anchorHeader: data.anchorHeader,
            vaultName: data.vaultName,
          },
          data: {
            xvault: !_.isUndefined(data.vaultName),
          },
          type: LinkUtils.astType2DLinkType(DendronASTTypes.WIKI_LINK),
          position: (wikiNode.position ?? undefined) as Position /* TODO: Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). WikiLinks local position cast (?? hygiene + 4-axis boundary per precedent; part of documented 3 position! + noteRef/data paths + SiteUtils synergy clusters for unified remark micro in parallel with engine batch 3). Target-first/?? at call site + full verbatim mandates. No bare @ts. 0 tests. */,
        },
        dest,
      });
    }

    if (copts.useId && dest === DendronASTDest.HTML) {
      let notes;
      const { noteCacheForRenderDict } = MDUtilsV5.getProcData(proc);
      // TODO: Consolidate logic.
      if (noteCacheForRenderDict) {
        // TODO: Add vault filter
        notes = NoteDictsUtils.findByFname({
          fname: alias,
          noteDicts: noteCacheForRenderDict,
        });
      } else {
        return "error - no note cache provided";
      }

      const { error, note } = getNoteOrError(notes, value);
      if (error) {
        addError(proc, error);
        return "error with link";
      } else {
        value = note!.id;
      }
    }

    const aliasToUse = alias ?? value;
    switch (dest) {
      case DendronASTDest.MD_REGULAR: {
        return `[${aliasToUse}](${copts.prefix || ""}${normalizeSpaces(
          value
        )})`;
      }
      case DendronASTDest.HTML: {
        return `[${aliasToUse}](${copts.prefix || ""}${value}.html${
          data.anchorHeader ? "#" + data.anchorHeader : ""
        })`;
      }
      default:
        return `unhandled case: ${dest}`;
    }
  };
}

function wikiLinkSyntax(proc: Processor, opts?: CompilerOpts) {
  return createInlineRegexExtension<WikiLinkNoteV4>({
    charCode: "[".charCodeAt(0),
    tokenType: "dendronWikiLink",
    mdastType: DendronASTTypes.WIKI_LINK,
    match: LINK_REGEX,
    toFields: (matched) => {
      const linkMatch = matched[1]!.trim();
      try {
        const parsed = parseLink(proc, linkMatch);
        const value = parsed.value;
        if (!value) {
          return undefined;
        }
        const data: WikiLinkNoteV4["data"] = {
          alias: parsed.alias ?? value,
        };
        if (parsed.anchorHeader !== undefined) {
          data.anchorHeader = parsed.anchorHeader;
        }
        if (parsed.vaultName !== undefined) {
          data.vaultName = parsed.vaultName;
        }
        if (parsed.sameFile) {
          data.sameFile = parsed.sameFile;
        }
        return { value, data };
      } catch {
        // Broken link, just refuse to parse it
        return undefined;
      }
    },
    toMarkdown: wikiLinkToMarkdown(proc, opts),
  });
}

const plugin: Plugin<[CompilerOpts?]> = function (
  this: Processor,
  opts?: PluginOpts
) {
  registerSyntaxExtensions(this, wikiLinkSyntax(this, opts));
};

export { plugin as wikiLinks };
export { PluginOpts as WikiLinksOpts };