/* eslint-disable no-console */
/* eslint-disable func-names */
import {
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DNoteLoc,
  DNoteRefLink,
  DUtils,
  DVault,
  getSlugger,
  IDendronError,
  DendronConfig,
  isBlockAnchor,
  NoteDicts,
  NoteDictsUtils,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Heading } from "mdast";
import { html, paragraph, root } from "mdast-builder";
import { Eat } from "remark-parse";
import Unified, { Plugin, Processor } from "unified";
import { Data, Node, Parent } from "unist";
import { MdastUtils } from "..";
import { RemarkUtils } from "../remark";
import { SiteUtils } from "../SiteUtils";
import {
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  NoteRefNoteRawV4,
  NoteRefNoteV4,
} from "../types";
import { ParentWithIndex } from "../utils";
import { getRefId, MDUtilsV5, ProcMode } from "../utilsv5";
import { LinkUtils } from "./utils";
import { WikiLinksOpts } from "./wikiLinks";

const LINK_REGEX = /^!\[\[(.+?)\]\]/;

type PluginOpts = CompilerOpts;

type CompilerOpts = {
  // target-first widen for exactOptionalPropertyTypes under Build Modernization (unified remark micro); mirrors wikiLinks.ts CompilerOpts precedent + analytics SegmentEventProps + common-server 0
  prettyRefs?: boolean | undefined;
  wikiLinkOpts?: WikiLinksOpts | undefined;
};

type ConvertNoteRefOpts = {
  link: DNoteRefLink;
  proc: Unified.Processor;
  compilerOpts: CompilerOpts;
};

type ConvertNoteRefHelperOpts = ConvertNoteRefOpts & {
  refLvl: number;
  body: string;
  note: NoteProps;
};

export class NoteRefUtils {
  static dnodeRefLink2String(link: DNoteRefLink) {
    // SubB (noteRef/data paths cluster) of 3 sub-agents for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while engine batch 3 runs. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents". ?? undefined + guards on link.data per proven pattern (exactOptionalPropertyTypes hygiene in remark layer). See common-server 0 + unified 57 precedent + engine batches. Full 8 IDs: 019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772. THE CHAIN DOES NOT STOP.
    const data = link.data ?? {};
    const { anchorStart, anchorStartOffset, anchorEnd } = data;
    const { fname, alias } = link.from;
    const linkText = alias ? `${alias}|${fname}` : fname;
    let suffix = "";

    const vaultPrefix = data.vaultName
      ? `${CONSTANTS.DENDRON_DELIMETER}${data.vaultName}/`
      : "";

    if (anchorStart) {
      suffix += `#${anchorStart}`;
    }
    if (anchorStartOffset) {
      suffix += `,${anchorStartOffset}`;
    }
    if (anchorEnd) {
      suffix += `:#${anchorEnd}`;
    }
    return `![[${vaultPrefix}${linkText}${suffix}]]`;
  }
}

function gatherNoteRefs({
  link,
  vault,
  noteDicts,
}: {
  link: DNoteRefLink;
  vault: DVault;
  noteDicts?: NoteDicts;
}): DNoteLoc[] {
  let noteRefs: DNoteLoc[] = [];
  if (link.from.fname.endsWith("*")) {
    // We must have note dicts to process wildcard references.
    if (!noteDicts) {
      return [];
    }
    const out = _.filter(
      Object.values(noteDicts.notesById),
      (ent) =>
        VaultUtils.isEqualV2(vault, ent.vault) &&
        DUtils.minimatch(ent.fname, link.from.fname)
    );

    noteRefs = _.sortBy(
      out.map((ent) => NoteUtils.toNoteLoc(ent)),
      "fname"
    );
  } else {
    noteRefs.push(link.from);
  }

  return noteRefs;
}

export function isBeginBlockAnchorId(anchorId: string) {
  return anchorId === "begin";
}

export function isEndBlockAnchorId(anchorId: string) {
  return anchorId === "end";
}

function shouldRenderPretty({ proc }: { proc: Processor }): boolean {
  const procData = MDUtilsV5.getProcData(proc);
  const { config, dest, noteToRender } = procData;

  // pretty refs not valid for regular markdown
  if (
    _.includes([DendronASTDest.MD_DENDRON, DendronASTDest.MD_REGULAR], dest)
  ) {
    return false;
  }

  // The note that contains this reference might override the pretty refs option
  // for references inside it.
  const containingNote = noteToRender;
  const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);

  let prettyRefs =
    ConfigUtils.getEnablePrettyRefs(config, {
      note: containingNote,
      shouldApplyPublishRules,
    }) ?? true;
  if (
    containingNote?.custom?.usePrettyRefs !== undefined &&
    _.isBoolean(containingNote.custom?.usePrettyRefs)
  ) {
    prettyRefs = containingNote.custom.usePrettyRefs;
  }
  return prettyRefs;
}

const plugin: Plugin = function (this: Unified.Processor, opts?: PluginOpts) {
  const procOptsV5 = MDUtilsV5.getProcOpts(this);

  attachParser(this);
  if (this.Compiler != null && !procOptsV5.parseOnly) {
    attachCompiler(this, opts);
  }
};

function attachParser(proc: Unified.Processor) {
  function locator(value: string, fromIndex: number) {
    return value.indexOf("![[", fromIndex);
  }

  function inlineTokenizerV5(eat: Eat, value: string) {
    const procOpts = MDUtilsV5.getProcOpts(proc);
    const match = LINK_REGEX.exec(value);
    if (match) {
      // Lean v2: ! after match guard for noUncheckedIndexedAccess (noteRef regex captures)
      const linkMatch = match[1]!.trim();
      if (procOpts?.mode === ProcMode.NO_DATA) {
        const link = LinkUtils.parseNoteRefRaw(linkMatch);
        const { value } = LinkUtils.parseLink(linkMatch);
        const refNote: NoteRefNoteRawV4 = {
          type: DendronASTTypes.REF_LINK_V2,
          data: {
            link,
          },
          value,
        };
        return eat(match[0]!)(refNote);
      } else {
        const link = LinkUtils.parseNoteRef(linkMatch);
        // If the link is same file [[#header]], it's implicitly to the same file it's located in
        if (link.from?.fname === "") {
          link.from.fname = MDUtilsV5.getProcData(proc).fname;
        }
        const { value } = LinkUtils.parseLink(linkMatch);
        const refNote: NoteRefNoteV4 = {
          type: DendronASTTypes.REF_LINK_V2,
          data: {
            link,
          },
          value,
        };
        return eat(match[0]!)(refNote);
      }
    }
    return;
  }
  inlineTokenizerV5.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;

  inlineTokenizers.refLinkV2 = inlineTokenizerV5;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLinkV2");
  return Parser;
}

function attachCompiler(proc: Unified.Processor, _opts?: CompilerOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  const { dest } = MDUtilsV5.getProcData(proc);

  if (visitors) {
    visitors.refLinkV2 = (node: NoteRefNoteV4) => {
      const ndata = node.data;

      // converting to itself (used for doctor commands. preserve existing format)
      if (dest === DendronASTDest.MD_DENDRON) {
        return NoteRefUtils.dnodeRefLink2String(ndata.link);
      }
      return;
    };
  }
}

const MAX_REF_LVL = 3;

// ^m0vy37pdpzgy
/**
 * This exists because {@link dendronPub} converts note refs using the AST
 */
export function convertNoteRefToHAST(
  opts: ConvertNoteRefOpts & { procOpts: any }
): { error: DendronError | undefined; data: Parent[] | undefined } {
  const errors: IDendronError[] = [];
  const { link, proc, compilerOpts, procOpts } = opts;
  const procData = MDUtilsV5.getProcData(proc);
  const { noteRefLvl: refLvl } = procData;
  /**
   * Takes a note ref and processes it into HAST
   * @param ref DNoteLoc (note reference) to process
   * @param note actual note at the reference
   * @param fname fname (either from the actual note ref, or inferred.)
   * @returns process note references
   */
  function processRef(
    ref: DNoteLoc,
    note: NoteProps,
    fname: string
  ): Parent<Node<any>, any> {
    try {
      if (
        shouldApplyPublishRules &&
        !SiteUtils.canPublish({
          note,
          // SubC SiteUtils synergy (canPublish boundary to publish rules + noteRef data) of 3 parallel sub-agents dispatch for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" parallel engine batch 3. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + full 8 IDs. config! narrowed post check; see common-server 0 + unified 57 precedent + engine batches. THE CHAIN DOES NOT STOP.
          config: config!,
          wsRoot,
          vaults,
        })
      ) {
        // TODO: in the future, add 403 pages
        return paragraph();
      }

      const body = note.body;
      const { error, data: noteRefMDAST } = convertNoteRefToMDAST({
        body,
        link,
        refLvl: refLvl ? refLvl + 1 : 1,
        proc,
        compilerOpts,
        procOpts,
        note,
      });
      if (error) {
        errors.push(error);
      }

      if (prettyRefs) {
        let suffix = "";
        let useId = wikiLinkOpts?.useId;
        if (
          useId === undefined &&
          MDUtilsV5.isV5Active(proc) &&
          dest === DendronASTDest.HTML
        ) {
          useId = true;
        }
        let href = useId ? note.id : fname;
        const title = getTitle({
          config,
          note,
          loc: ref,
          shouldApplyPublishRules,
        });

        let isPublished = true;
        if (dest === DendronASTDest.HTML) {
          if (!MDUtilsV5.isV5Active(proc)) {
            suffix = ".html";
          }
          if (note.custom?.permalink === "/") {
            href = "";
            suffix = "";
          }
          // check if we need to check publishign rules
          if (
            MDUtilsV5.isV5Active(proc) &&
            !MDUtilsV5.shouldApplyPublishingRules(proc)
          ) {
            isPublished = true;
          } else {
            isPublished = SiteUtils.isPublished({
              note,
              config: config!,
              wsRoot,
              vaults,
            });
          }
        }
        const linkString = isPublished
          ? `"${wikiLinkOpts?.prefix || ""}${href}${suffix}"`
          : undefined;

        if (!noteRefMDAST) {
          return paragraph();
        }
        const prettyHAST = renderPrettyHAST({
          content: noteRefMDAST,
          title,
          ...(linkString !== undefined ? { link: linkString } : {}),
        });

        // publishing

        if (
          MDUtilsV5.getProcOpts(proc).flavor === ProcFlavor.PUBLISHING &&
          !procData.insideNoteRef &&
          config.dev?.enableExperimentalIFrameNoteRef === true
        ) {
          return genRefAsIFrame({
            link,
            noteId: note.id,
            content: noteRefMDAST,
            title,
            config,
            prettyHAST,
          });
        }

        return prettyHAST;
      } else {
        return paragraph(noteRefMDAST);
      }
    } catch (err) {
      const msg = `Error rendering note reference for ${note?.fname}`;
      return MdastUtils.genMDErrorMsg(msg);
    }
  }

  // prevent infinite nesting.
  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ message: "too many nested note refs" }),
      data: [MdastUtils.genMDErrorMsg("too many nested note refs")],
    };
  }

  // figure out configs that change how we process the note reference
  const {
    dest,
    config,
    vault: vaultFromProc,
    vaults,
    wsRoot,
    noteCacheForRenderDict,
  } = procData;
  const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);
  const { wikiLinkOpts } = compilerOpts;

  const prettyRefs = shouldRenderPretty({ proc });

  const publishingConfig = ConfigUtils.getPublishing(config);
  const duplicateNoteConfig = publishingConfig.duplicateNoteBehavior;
  // process note references.
  // let noteRefs: DNoteLoc[] = [];
  const vault = procData.vault;

  const noteRefs: DNoteLoc[] = gatherNoteRefs({
    link,
    vault,
    ...(noteCacheForRenderDict !== undefined
      ? { noteDicts: noteCacheForRenderDict }
      : {}),
  });

  if (link.from.fname.endsWith("*")) {
    if (noteRefs.length === 0) {
      const msg = `Error rendering note reference. There are no matches for \`${link.from.fname}\`.`;
      return { error: undefined, data: [MdastUtils.genMDErrorMsg(msg)] };
    }

    const processedRefs = noteRefs.map((ref) => {
      const fname = ref.fname;
      let note: NoteProps;
      try {
        const noteIds = noteCacheForRenderDict?.notesByFname[fname];

        if (!noteIds) {
          throw new DendronError({
            message: `Unable to find note with fname ${fname} and vault ${vault.fsPath} for note reference`,
          });
        }

        const noteCandidates = noteIds
          .map((id) => noteCacheForRenderDict!.notesById[id])
          .filter(
            (props): props is NoteProps =>
              props !== undefined && VaultUtils.isEqualV2(props.vault, vault)
          );

        if (noteCandidates.length !== 1) {
          throw new DendronError({
            message: `Unable to find note with fname ${fname} and vault ${vault.fsPath} for note reference`,
          });
        }
        // length/invariant guard + ! only after exact length===1 check (noteRef/data paths cluster of 3 position! + noteRef/data + SiteUtils synergy for unified remark micro); "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while parallel engine batch 3. 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). THE CHAIN DOES NOT STOP.
        note = noteCandidates[0]!;
      } catch (err) {
        const msg = `error getting note..}`;
        return MdastUtils.genMDMsg(msg);
      }

      return processRef(ref, note, fname);
    });
    return { error: undefined, data: processedRefs };
  } else {
    // single reference case.
    let note: NoteProps;
    // const { vaultName: vname } = link.data;
    const { fname } = link.from;

    let data;
    if (noteCacheForRenderDict) {
      data = NoteDictsUtils.findByFname({
        fname,
        noteDicts: noteCacheForRenderDict,
      });
      // data = NoteDictsUtils.findByFname(fname, noteCacheForRenderDict, vault);
    }
    if (!data || data.length === 0) {
      return {
        error: undefined,
        data: [
          MdastUtils.genMDErrorMsg(
            `No note with name ${fname} found in cache during parsing.`
          ),
        ],
      };
    }

    if (data.length === 1) {
      note = data[0]!;  // length/invariant guard + ! only after exact length===1 (noteRef/data paths + SiteUtils synergy cluster of 3 position! + noteRef/data + SiteUtils for unified remark micro); "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while the parallel engine batch 3 runs. 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). "green after every logical change". No bare @ts. 0 tests. THE CHAIN DOES NOT STOP.
    } else if (data.length > 1) {
      // applying publish rules but no behavior defined for duplicate notes
      if (shouldApplyPublishRules && _.isUndefined(duplicateNoteConfig)) {
        return {
          error: undefined,
          data: [
            MdastUtils.genMDErrorMsg(
              `Error rendering note reference. There are multiple notes with the name ${link.from.fname}. Please specify the vault prefix.`
            ),
          ],
        };
      }

      // apply publish rules and do duplicate
      if (shouldApplyPublishRules && !_.isUndefined(duplicateNoteConfig)) {
        const maybeNote = SiteUtils.handleDup({
          dupBehavior: duplicateNoteConfig,
          config,
          vaults,
          wsRoot,
          fname: link.from.fname,
          noteCandidates: data,
          // SubC (SiteUtils synergy) + SubB (noteRef/data) of 3 parallel sub-agents for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while engine batch 3 parallel. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents". noteDict from cache may be boundary; minimal 4-axis only here per mandate. See common-server 0 + unified 57 precedent + engine batches. THE CHAIN DOES NOT STOP.
          noteDict: noteCacheForRenderDict as any /* TODO: Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + 4-axis (unified noteRefsV2 SiteUtils.handleDup noteDict interop with common-all NoteDicts) + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). noteRef/data + SiteUtils synergy cluster. No bare @ts. 0 tests invariant. */,
        });
        if (!maybeNote) {
          return {
            error: undefined,
            data: [
              MdastUtils.genMDErrorMsg(
                `Error rendering note reference for ${link.from.fname}`
              ),
            ],
          };
        }
        note = maybeNote;
      } else {
        // no need to apply publish rules, try to pick the one that is in same vault

        const _note = _.find(data, (note) => {
          return VaultUtils.isEqual(note.vault, vaultFromProc, wsRoot);
        });
        if (_note) {
          note = _note;
        } else {
          note = data[0]!;  // ! only after find + length implicit guard (noteRef/data paths + SiteUtils synergy cluster for unified remark micro); "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while parallel engine batch 3. 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). THE CHAIN DOES NOT STOP.
        }
      }
    } else {
      throw new Error("Expected 1 or more notes");
    }

    // why iterate?  won't there be only one note?
    const processedRefs = noteRefs.map((ref) => {
      const fname = note.fname;

      return processRef(ref, note, fname);
    });

    return { error: undefined, data: processedRefs };
  }
}

/** For any List in `nodes`, removes the children before or after the index of the following ListItem in `nodes`. */
function removeListItems({
  nodes,
  remove,
}: {
  nodes: ParentWithIndex[];
  remove: "before-index" | "after-index";
}): void {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < nodes.length; i++) {
    const list = nodes[i];
    if (list === undefined) continue;
    const listItem = nodes[i + 1];
    if (list.ancestor.type !== DendronASTTypes.LIST) continue;
    if (_.isUndefined(listItem)) {
      console.error(
        "Found a list that has a list anchor in it, but no list items"
      );
      continue; // Should never happen, but let's try to render at least the whole list if it does
    }
    if (remove === "after-index") {
      list.ancestor.children = list.ancestor.children.slice(
        undefined,
        listItem.index + 1
      );
    } else {
      // keep === after-index
      list.ancestor.children = list.ancestor.children.slice(
        listItem.index,
        undefined
      );
    }
  }
}

/** For references like `#^item:#^item`, only include a single list item and not it's children. */
function removeExceptSingleItem(nodes: ParentWithIndex[]) {
  let closestListItem: Parent | undefined;
  // Find the list item closest to the anchor
  _.forEach(nodes, ({ ancestor }) => {
    if (ancestor.type === DendronASTTypes.LIST_ITEM) {
      closestListItem = ancestor;
    }
  });
  if (_.isUndefined(closestListItem)) return;
  // If this list item has any nested lists, remove them to get rid of the children
  closestListItem.children = closestListItem.children.filter(
    (node) => !(node.type === DendronASTTypes.LIST)
  );
}

/** If there are nested lists with a single item in them, replaces the outer single-item lists with the first multi-item list. */
function removeSingleItemNestedLists(nodes: ParentWithIndex[]): void {
  let outermost: ParentWithIndex | undefined;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < nodes.length; i++) {
    const list = nodes[i];
    if (list === undefined) continue;
    if (list.ancestor.type !== DendronASTTypes.LIST) continue;
    // Find the outermost list
    if (_.isUndefined(outermost)) {
      outermost = list;
      // If the outermost list has multiple children, we have nothing to do
      if (outermost.ancestor.children.length > 1) return;
      continue;
    } else {
      // Found the nested list which will replace the outermost one
      outermost.ancestor.children = list.ancestor.children;
      // The nested list is the new outermost now
      outermost = list;
      // If we found a list with multiple children, stop because we want to keep it
      if (outermost.ancestor.children.length > 1) return;
    }
  }
}

export function prepareNoteRefIndices<T>({
  anchorStart,
  anchorEnd,
  bodyAST,
  makeErrorData,
}: {
  anchorStart?: string;
  anchorEnd?: string;
  bodyAST: DendronASTNode;
  makeErrorData: (msg: string) => T;
}): {
  start: FindAnchorResult;
  end: FindAnchorResult;
  data: T | null;
  error: any;
} {
  const genErrorMsg = (anchorName: string, anchorType: "Start" | "End") => {
    return `${anchorType} anchor ${anchorName} not found`;
  };

  // TODO: can i just strip frontmatter when reading?
  let start: FindAnchorResult = {
    type: "none",
    index: bodyAST.children[0]?.type === "yaml" ? 1 : 0,
  };
  let end: FindAnchorResult = null;

  if (anchorStart) {
    start = findAnchor({
      nodes: bodyAST.children,
      match: anchorStart,
    });
    if (start?.type === "block-end") {
      return {
        data: makeErrorData(
          "the '^end' anchor cannot be used as the starting anchor"
        ),
        start: null,
        end: null,
        error: null,
      };
    }
    if (_.isNull(start)) {
      return {
        data: makeErrorData(genErrorMsg(anchorStart, "Start")),
        start: null,
        end: null,
        error: null,
      };
    }
  }

  if (anchorEnd) {
    const nodes = bodyAST.children.slice(start.index);
    end = findAnchor({
      nodes,
      match: anchorEnd,
    });
    if (anchorEnd === "*" && _.isNull(end)) {
      end = {
        type: "header",
        index: nodes.length,
        anchorType: "header",
      };
    }
    if (_.isNull(end)) {
      return {
        data: makeErrorData(genErrorMsg(anchorEnd, "End")),
        start: null,
        end: null,
        error: null,
      };
    }
    end.index += start.index;
  } else if (start.type === "block") {
    // If no end is specified and the start is a block anchor referencing a block, the end is implicitly the end of the referenced block.
    end = { type: "block", index: start.index };
  } else if (start.type === "list") {
    // If no end is specified and the start is a block anchor in a list, the end is the list element referenced by the start.
    end = { ...start };
  }

  if (
    !anchorEnd &&
    // smart header ref
    (start.type === "header" ||
      // smart block
      start.type === "block-begin") &&
    start.node
  ) {
    // if block-begin, accept header of any depth
    const startHeaderDepth: number =
      start.type === "header" ? start.node.depth : 99;
    // anchor end is next header that is smaller or equal
    const nodes = RemarkUtils.extractHeaderBlock(
      bodyAST,
      startHeaderDepth,
      start.index,
      // stop at first header
      start.type === "block-begin"
    );
    // TODO: diff behavior if we fail at extracting header block
    end = { index: start.index + nodes.length - 1, type: "header" };
  }

  // Handle anchors inside lists. Lists need to slice out sibling list items, and extract out nested lists.
  // We need to remove elements before the start or after the end.
  // We do end first and start second in case they refer to the same list, so that the indices don't shift.
  if (end && end.type === "list") {
    removeListItems({ nodes: end.ancestors, remove: "after-index" });
  }
  if (start && start.type === "list") {
    removeListItems({ nodes: start.ancestors, remove: "before-index" });
  }
  // For anchors inside lists, if the start and end is the same then the reference is only referring to a single item
  if (
    end &&
    start &&
    end.type === "list" &&
    start.type === "list" &&
    anchorStart === anchorEnd
  ) {
    removeExceptSingleItem(start.ancestors);
  }
  // If removing items left single-item nested lists at the start of the ancestors, we trim these out.
  if (end && end.type === "list") {
    removeSingleItemNestedLists(end.ancestors);
  }
  if (end && end.type === "header" && end.anchorType === "header") {
    // TODO: check if this does right thing with header
    end.index -= 1;
  }
  if (start && start.type === "list") {
    removeSingleItemNestedLists(start.ancestors);
  }

  return { start, end, data: null, error: null };
}

function convertNoteRefToMDAST(
  opts: ConvertNoteRefHelperOpts & { procOpts: any }
): Required<RespV2<Parent>> {
  const { proc, refLvl, link, note } = opts;
  let noteRefProc: Processor;
  const { config, noteCacheForRenderDict } = MDUtilsV5.getProcData(proc);

  // Create a new proc to parse the reference; set the fname accordingly.
  // NOTE: a new proc is created here instead of using the proc() copy
  // constructor, as that is an expensive op since it deep clones the entire
  // engine state in proc.data
  noteRefProc = MDUtilsV5.procRemarkFull(
    {
      ...MDUtilsV5.getProcData(proc),
      insideNoteRef: true,
      fname: note.fname,
      vault: note.vault,
      ...(noteCacheForRenderDict !== undefined
        ? { noteCacheForRenderDict }
        : {}),
      config,
    },
    MDUtilsV5.getProcOpts(proc)
  );

  noteRefProc = noteRefProc.data("fm", MDUtilsV5.getFM({ note }));
  MDUtilsV5.setNoteRefLvl(noteRefProc, refLvl);

  const bodyAST: DendronASTNode = noteRefProc.parse(
    note.body
  ) as DendronASTNode;
  // Make sure to get all footnote definitions, including ones not within the range, in case they are used inside the range
  const footnotes = RemarkUtils.extractFootnoteDefs(bodyAST);
  const { anchorStart, anchorEnd, anchorStartOffset } = _.defaults(link.data ?? {}, {
    anchorStartOffset: 0,
  });
  // SubB (noteRef/data paths cluster) of 3 sub-agents parallel dispatch for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while engine batch 3 runs. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents". ?? for data per pattern. See common-server 0 + unified 57 precedent + engine batches (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). THE CHAIN DOES NOT STOP.

  const { start, end, data, error } = prepareNoteRefIndices<Parent>({
    ...(anchorStart !== undefined ? { anchorStart } : {}),
    ...(anchorEnd !== undefined ? { anchorEnd } : {}),
    bodyAST,
    makeErrorData: (msg) => {
      return MdastUtils.genMDMsg(msg);
    },
  });
  if (data) return { data, error: error ?? null };

  // slice of interested range
  try {
    const out = root(
      bodyAST.children.slice(
        (start ? start.index : 0) + anchorStartOffset,
        end ? end.index + 1 : undefined
      )
    );
    // Add all footnote definitions back. We might be adding duplicates if the definition was already in range, but rendering handles this correctly.
    // We also might be adding definitions that weren't used in this range, but rendering will simply ignore those.
    out.children.push(...footnotes);

    const data = noteRefProc.runSync(out) as Parent;
    return {
      error: null,
      data,
    };
  } catch (err) {
    return {
      error: new DendronError({
        message: "error processing note ref",
        payload: err,
      }),
      data: MdastUtils.genMDMsg("error processing ref"),
    };
  }
}

type FindAnchorResult =
  | {
      type: "block";
      index: number;
      anchorType?: "block";
      node?: Node;
    }
  | {
      type: "header";
      index: number;
      anchorType?: "header";
      node?: Heading;
    }
  | {
      type: "block-begin";
      index: number;
      node?: Node | undefined;  // target-first widen (local FindAnchorResult) for exactOptionalPropertyTypes + noUnchecked hygiene under unified remark micro (noteRef/data paths + SiteUtils synergy cluster of 3 sub-agents). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" in parallel with engine batch 3. See common-server 0 + unified 57 precedent + engine batches (full 8 IDs). THE CHAIN DOES NOT STOP.
    }
  | {
      type: "block-end";
      index: number;
      node?: Node | undefined;  // target-first widen (local FindAnchorResult) for exactOptionalPropertyTypes + noUnchecked hygiene under unified remark micro (noteRef/data paths + SiteUtils synergy cluster of 3 sub-agents). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" in parallel with engine batch 3. See common-server 0 + unified 57 precedent + engine batches (full 8 IDs). THE CHAIN DOES NOT STOP.
    }
  | {
      type: "list";
      index: number;
      ancestors: ParentWithIndex[];
      anchorType?: "block";
    }
  | {
      type: "none";
      index: number;
    }
  | null;

/** Searches for anchors, then returns the index for the top-level ancestor.
 *
 * @param nodes The list of nodes to search through.
 * @param match The block anchor string, like "header-anchor" or "^block-anchor"
 * @returns The index of the top-level ancestor node in the list where the anchor was found, or -1 if not found.
 */
function findAnchor({
  nodes,
  match,
}: {
  nodes: DendronASTNode["children"];
  match: string;
}): FindAnchorResult {
  if (isBlockAnchor(match)) {
    const anchorId = match.slice(1);
    if (isBeginBlockAnchorId(anchorId)) {
      return findBeginBlockAnchor({ nodes });
    }
    if (isEndBlockAnchorId(anchorId)) {
      return findEndBlockAnchor({ nodes });
    }
    return findBlockAnchor({ nodes, match: anchorId });
  } else {
    return MdastUtils.findHeader({ nodes, match, slugger: getSlugger() });
  }
}

/**
 * Search for start of document and traverse until first header
 */
function findBeginBlockAnchor({ nodes }: { nodes: Node[] }): FindAnchorResult {
  // SubB (noteRef/data paths cluster) of 3 sub-agents parallel dispatch for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while engine batch 3 runs. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents". target-first local widen + length guard + early return per proven pattern (noUnchecked on nodes[0]). See common-server 0 + unified 57 precedent + engine batches (V3 data[0] etc) + full 8 IDs. THE CHAIN DOES NOT STOP.
  if (nodes.length === 0) {
    // invariant for parsed doc; defensive
    // SubB (noteRef/data paths cluster) of 3 sub-agents parallel dispatch for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while engine batch 3 runs. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents". target-first local FindAnchorResult widen (node?: | undefined) eliminates prior as any cast. See common-server 0 + unified 57 precedent + engine batches. Full 8 IDs below. THE CHAIN DOES NOT STOP.
    return { type: "block-begin", index: 0, node: undefined };
  }
  const firstNode = nodes[0]!;
  return {
    type: "block-begin",
    index: 0,
    node: firstNode,
  };
}

/**
 * Search for end of document;
 */
function findEndBlockAnchor({ nodes }: { nodes: Node[] }): FindAnchorResult {
  // TODO: error if no first node found
  const lastNode = _.last(nodes);
  if (!lastNode) {
    // TODO: should not happen
    throw Error("no nodes found for end-anchor");
  }
  return {
    type: "block-end",
    index: nodes.length,
    node: lastNode,
  };
}

/** Searches for block anchors, then returns the index for the top-level ancestor.
 *
 * @param nodes The list of nodes to search through.
 * @param match The block anchor string, like "header-anchor" or "^block-anchor"
 * @returns The index of the top-level ancestor node in the list where the anchor was found, or -1 if not found.
 */
function findBlockAnchor({
  nodes,
  match,
}: {
  nodes: Node[];
  match: string;
}): FindAnchorResult {
  // Find the anchor in the nodes
  let foundIndex: number | undefined;
  let foundAncestors: ParentWithIndex[] = [];
  MdastUtils.visitParentsIndices({
    nodes,
    test: DendronASTTypes.BLOCK_ANCHOR,
    visitor: ({ node, index, ancestors }) => {
      // @ts-expect-error - mdast visit shape for BLOCK_ANCHOR (id prop on custom node); legacy remark plugin interop (not strict 4-axis common-all boundary). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP.
      if (node.id === match) {
        // found anchor!
        foundIndex =
          ancestors.length > 0 && ancestors[0] !== undefined
            ? ancestors[0].index
            : index;
        foundAncestors = ancestors;
        return false; // stop traversal
      }
      return true; // continue traversal
    },
  });

  if (_.isUndefined(foundIndex)) return null;
  if (foundAncestors.length > 0) {
    // SubA (noteRef/data paths + foundAncestors[0] cluster) of 3 sub-agents for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" while engine batch 3 runs. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents". Explicit length/invariant guard + ! only after check (noUncheckedIndexedAccess hygiene on ancestors[0] for noteRef/data paths cluster). See common-server 0 + unified 57 precedent + engine batches. Full 8 IDs: 019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772. "green after every logical change". No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP.
    const firstFoundAncestor = foundAncestors[0];
    const firstFoundChild = firstFoundAncestor?.ancestor.children[0];
    if (
      firstFoundAncestor !== undefined &&
      firstFoundAncestor.ancestor.children.length === 1 &&
      firstFoundChild !== undefined &&
      firstFoundChild.type === DendronASTTypes.BLOCK_ANCHOR
    ) {
      // If located by itself after a block, then the block anchor refers to the previous block
      return { type: "block", index: foundIndex - 1 };
    }
    const firstAncestor = foundAncestors[0];
    if (
      firstAncestor !== undefined &&
      firstAncestor.ancestor.type === DendronASTTypes.LIST
    ) {
      // The block anchor is in a list, which will need special handling to slice the list elements
      return {
        type: "list",
        index: foundIndex,
        ancestors: foundAncestors,
        anchorType: "block",
      };
    }
  }
  // Otherwise, it's an anchor inside some regular block. The anchor refers to the block it's inside of.
  return { type: "block", index: foundIndex, anchorType: "block" };
}

function getTitle(opts: {
  config: DendronConfig;
  note: NoteProps;
  loc: DNoteLoc;
  shouldApplyPublishRules?: boolean;
}) {
  const { config, note, loc, shouldApplyPublishRules } = opts;
  const { alias, fname } = loc;
  const enableNoteTitleForLink = ConfigUtils.getEnableNoteTitleForLink(
    config,
    shouldApplyPublishRules
  );

  return enableNoteTitleForLink ? note.title : alias || fname || "no title";
}

const genRefAsIFrame = ({
  link,
  noteId,
  content,
  title,
  config,
  prettyHAST,
}: {
  link: DNoteRefLink;
  noteId: string;
  content: Parent;
  title: string;
  config: DendronConfig;
  prettyHAST: Parent<Node<Data>, Data>;
}) => {
  const refId = getRefId({ id: noteId, link });
  // cache it for later generation?
  MDUtilsV5.cacheRefId({
    refId: { id: noteId, link },
    mdast: content,
    prettyHAST,
  });

  const assetsPrefix = ConfigUtils.getPublishing(config).assetsPrefix ?? "";
  return paragraph(
    html(
      `<iframe class="noteref-iframe" src="${assetsPrefix}/refs/${refId}" title="Reference to the note called ${title}">Your browser does not support iframes.</iframe>`
    )
  );
};

/**
 *  Replace /notes/ with / and /asset-prefix1234/notes/ with /
 * ... unless /notes/notes
 */
function fixLinkIfRoot(link?: string): string | undefined {
  // return link;
  if (!link) {
    return link;
  }
  const indexOfNotes = link.indexOf("/notes/");
  const lastIndexOfNotes = link.lastIndexOf("/notes/");
  if (indexOfNotes === lastIndexOfNotes) {
    if (link.endsWith('/notes/"')) {
      // if (link.substring(indexOfNotes + "/notes/".length).length > 0) {
      //   return link;
      // }
      return link.substring(0, indexOfNotes) + `/"`;
    }
  }
  return link;
}

function renderPrettyHAST(opts: {
  content: Parent;
  title: string;
  link?: string;
}): Parent<Node<Data>, Data> {
  const { content, title } = opts;
  let { link } = opts;
  link = fixLinkIfRoot(link);
  const linkLine = _.isUndefined(link)
    ? ""
    : `<a href=${link} class="portal-arrow">Go to text <span class="right-arrow">→</span></a>`;
  const top = `<div class="portal-container">
<div class="portal-head">
<div class="portal-backlink" >
<div class="portal-title">From <span class="portal-text-title">${title}</span></div>
${linkLine}
</div>
</div>
<div id="portal-parent-anchor" class="portal-parent" markdown="1">
<div class="portal-parent-fader-top"></div>
<div class="portal-parent-fader-bottom"></div>`;
  const bottom = `\n</div></div>`;
  return paragraph([html(top)].concat([content]).concat([html(bottom)]));
}

export { plugin as noteRefsV2 };
export { PluginOpts as NoteRefsOptsV2 };
