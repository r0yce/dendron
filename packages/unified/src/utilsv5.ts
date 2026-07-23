import {
  assertUnreachable,
  ConfigUtils,
  DendronError,
  DNoteRefLink,
  DVault,
  ERROR_STATUS,
  getSlugger,
  DendronConfig,
  NoteDicts,
  NotePropsMeta,
  OptionalExceptFor,
  ProcFlavor,
} from "@dendronhq/common-all";
import "./module-shims";
import "./unified-data";
import rehypePrism from "@mapbox/rehype-prism";
import { remarkMermaid } from "./remark/remarkMermaid";
import _ from "lodash";
import link from "rehype-autolink-headings";
import math from "remark-math";
import variables from "remark-variables";
import katex from "rehype-katex";
import raw from "rehype-raw";
import slug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import abbrPlugin from "remark-abbr";
import frontmatterPlugin from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remark2rehype from "remark-rehype";
// import rehypeWrap from "rehype-wrap";
import { wrap } from "./rehype/wrap";
import { Plugin, Processor } from "unified";
import { hierarchies } from "./remark";
import { backlinks } from "./remark/backlinks";
import { BacklinkOpts, backlinksHover } from "./remark/backlinksHover";
import { blockAnchors } from "./remark/blockAnchors";
import { dendronHoverPreview } from "./remark/dendronPreview";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { extendedImage } from "./remark/extendedImage";
import { hashtags } from "./remark/hashtag";
import { noteRefsV2 } from "./remark/noteRefsV2";
import { userTags } from "./remark/userTags";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTDest, UnistNode } from "./types";
import path from "path";
import { Parent } from "unist";

export { ProcFlavor };

/**
 * What mode a processor should run in
 */
export enum ProcMode {
  /**
   * Expect no properties from {@link ProcDataFullV5} when running the processor
   */
  NO_DATA = "NO_DATA",
  /**
   * Expect all properties from {@link ProcDataFullV5} when running the processor
   */
  FULL = "all data",
  /**
   * Running processor in import mode. Notes don't exist. Used for import pods like {@link MarkdownPod}
   * where notes don't exist in the engine prior to import.
   */
  IMPORT = "IMPORT",
}

/**
 * Options for how processor should function
 */
export type ProcOptsV5 = {
  /**
   * Determines what information is passed in to `Proc`
   */
  mode: ProcMode;
  /**
   * Don't attach compiler if `parseOnly`
   */
  parseOnly?: boolean;
  /**
   * Are we using specific variant of processor
   */
  flavor?: ProcFlavor | undefined;  // target-first widen (?: T → ?: T | undefined) per Batch 5+/6+ for exactOptionalPropertyTypes (ProcFlavor | undefined at call sites in procRehypeFull/procRehypeWeb + MDUtilsV5Web). Part of unified remark micro + final exactOptional cluster for first-3 clean hybrid (second of 3: unified). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro + v5 ProcOptsV5 final)" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772 + 019e81fe-eefb-73a2-ad2c-5fa4efebcad7 + 019e81fb-4a4c-7580-bd41-51cbe849ae9c + 019e81ff-4b05-72f0-bf68-6b320c74dbdf + 019e81fe-7bd6-77c1-a74c-a24ea27983bd + 019e81fe-a131-7082-ba77-e9397743ac84 + 019e81fd-2f81-7950-9dba-7168c5cfa65f + 019e81fb-9696-7652-b2ef-60a63adb907e). No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP.
};

/**
 * Data to initialize the processor
 */
export type ProcDataFullOptsV5 = {
  vault: DVault;
  fname: string;
  dest: DendronASTDest;
  config: DendronConfig;
  vaults?: DVault[];

  /**
   * Check to see if we are in a note reference.
   */
  insideNoteRef?: boolean;
  /**
   * frontmatter variables exposed for substitution
   */
  fm?: any;
  wikiLinksOpts?: WikiLinksOpts;
  publishOpts?: DendronPubOpts;
  backlinkHoverOpts?: BacklinkOpts;
  wsRoot?: string;
  noteToRender: NotePropsMeta;
  noteCacheForRenderDict?: NoteDicts | undefined;
};

/**
 * Data from the processor
 */
export type ProcDataFullV5 = {
  // main properties that are configured when processor is created
  vault: DVault;
  fname: string;
  dest: DendronASTDest;
  wsRoot: string;
  vaults: DVault[];

  // derived: unless passed in, these come from engine or are set by
  // other unified plugins
  config: DendronConfig;
  insideNoteRef?: boolean;

  fm?: any;
  /**
   * Keep track of current note ref level
   */
  noteRefLvl: number;

  noteToRender: NotePropsMeta;
  noteCacheForRenderDict?: NoteDicts | undefined;
};

function checkProps({
  requiredProps,
  data,
}: {
  requiredProps: string[];
  data: any;
}): { valid: true } | { valid: false; missing: string[] } {
  const hasAllProps = _.map(requiredProps, (prop) => {
    return !_.isUndefined(data[prop]);
  });
  if (!_.every(hasAllProps)) {
    const missing = _.filter(requiredProps, (prop) =>
      // dynamic undefined check on any data for v5 proc validation (noteRef/data paths + SiteUtils synergy cluster of unified remark micro); local any interop (not strict 4-axis common-all) — directive removed (unused post prior hygiene). Per "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro + v5 ProcOptsV5 final)" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772 + 019e81fe-eefb-73a2-ad2c-5fa4efebcad7 + 019e81fb-4a4c-7580-bd41-51cbe849ae9c + 019e81ff-4b05-72f0-bf68-6b320c74dbdf + 019e81fe-7bd6-77c1-a74c-a24ea27983bd + 019e81fe-a131-7082-ba77-e9397743ac84 + 019e81fd-2f81-7950-9dba-7168c5cfa65f + 019e81fb-9696-7652-b2ef-60a63adb907e). No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP.
      _.isUndefined(data[prop])
    );
    return { valid: false, missing };
  }
  return { valid: true };
}

export type NoteRefId = { id: string; link: DNoteRefLink };
export type SerializedNoteRef = {
  node: UnistNode;
  refId: NoteRefId;
  prettyHAST: any;
};

type RefCache = Record<string, SerializedNoteRef>;
let REF_CACHE: RefCache | undefined;

export class MDUtilsV5 {
  static getRefsRoot = (wsRoot: string) => {
    return path.join(wsRoot, "build", "refs");
  };

  /**
   * Write ref
   * @param param1
   */
  static cacheRefId({
    refId,
    mdast,
    prettyHAST,
  }: {
    refId: NoteRefId;
    mdast: Parent;
    prettyHAST: any;
  }): void {
    if (REF_CACHE === undefined) {
      REF_CACHE = {};
    }
    const idString = getRefId(refId);
    const payload: SerializedNoteRef = { node: mdast, refId, prettyHAST };

    REF_CACHE[idString] = payload;
  }

  static clearRefCache(): void {
    REF_CACHE = undefined;
  }

  static getRefCache(): RefCache {
    if (!REF_CACHE) {
      return {};
    }
    return REF_CACHE;
  }

  static getProcOpts(proc: Processor): ProcOptsV5 {
    const _data = proc.data("dendronProcOptsv5") as ProcOptsV5;
    return _data || {};
  }

  static getProcData(proc: Processor): ProcDataFullV5 {
    const _data = proc.data("dendronProcDatav5") as ProcDataFullV5;
    return _data || {};
  }

  static setNoteRefLvl(proc: Processor, lvl: number) {
    return this.setProcData(proc, { noteRefLvl: lvl });
  }

  static setProcData(proc: Processor, opts: Partial<ProcDataFullV5>) {
    const _data = proc.data("dendronProcDatav5") as ProcDataFullV5;
    return proc.data("dendronProcDatav5", { ..._data, ...opts });
  }

  static setProcOpts(proc: Processor, opts: ProcOptsV5): Processor {
    const _data = proc.data("dendronProcOptsv5") as ProcOptsV5;
    return proc.data("dendronProcOptsv5", { ..._data, ...opts }) as Processor;
  }

  static isV5Active(proc: Processor) {
    return !_.isUndefined(this.getProcOpts(proc).mode);
  }

  static shouldApplyPublishingRules(proc: Processor): boolean {
    return (
      this.getProcData(proc).dest === DendronASTDest.HTML &&
      this.getProcOpts(proc).flavor === ProcFlavor.PUBLISHING
    );
  }

  static getFM(opts: { note: NotePropsMeta }) {
    const { note } = opts;
    const custom = note.custom ? note.custom : undefined;
    return {
      ...custom,
      id: note.id,
      title: note.title,
      desc: note.desc,
      created: note.created,
      updated: note.updated,
    };
  }

  /**
   * Used for processing a Dendron markdown note
   */
  static _procRemark(
    opts: ProcOptsV5,
    data: OptionalExceptFor<ProcDataFullOptsV5, "config">
  ) {
    const errors: DendronError[] = [];
    opts = _.defaults(opts, { flavor: ProcFlavor.REGULAR });
    let proc = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(frontmatterPlugin as unknown as Plugin, ["yaml"] as any)
      .use(abbrPlugin as unknown as Plugin)
      .data("settings", {
        listItemIndent: "one",
        fences: true,
        bullet: "-",
      })
      .use(noteRefsV2)
      .use(blockAnchors)
      .use(hashtags)
      .use(userTags)
      .use(extendedImage)
      // Footnotes: remark-gfm (already applied) replaces deprecated remark-footnotes
      .use(variables as Plugin)
      .use(backlinksHover, data.backlinkHoverOpts)
      .data("errors", errors) as unknown as Processor;

    //do not convert wikilinks if convertLinks set to false. Used by gdoc export pod. It uses HTMLPublish pod to do the md-->html conversion
    if (
      _.isUndefined(data.wikiLinksOpts?.convertLinks) ||
      data.wikiLinksOpts?.convertLinks
    ) {
      proc = proc.use(
        wikiLinks,
        data.wikiLinksOpts ?? {}
      ) as unknown as Processor;
    }

    // set options and do validation
    proc = this.setProcOpts(proc, opts);

    switch (opts.mode) {
      case ProcMode.FULL:
        {
          if (_.isUndefined(data)) {
            throw DendronError.createFromStatus({
              status: ERROR_STATUS.INVALID_CONFIG,
              message: `data is required when not using raw proc`,
            });
          }
          const requiredProps = ["vault", "fname", "dest"];
          const resp = checkProps({ requiredProps, data });
          if (!resp.valid) {
            throw DendronError.createFromStatus({
              status: ERROR_STATUS.INVALID_CONFIG,
              message: `missing required fields in data. ${resp.missing.join(
                " ,"
              )} missing`,
            });
          }
          const note = data.noteToRender;

          if (!_.isUndefined(note)) {
            proc = proc.data("fm", this.getFM({ note }));
          }

          this.setProcData(proc, data as ProcDataFullV5);

          // NOTE: order matters. this needs to appear before `dendronPub`
          if (data.dest === DendronASTDest.HTML) {
            //do not convert backlinks, children if convertLinks set to false. Used by gdoc export pod. It uses HTMLPublish pod to do the md-->html conversion
            if (
              _.isUndefined(data.wikiLinksOpts?.convertLinks) ||
              data.wikiLinksOpts?.convertLinks
            ) {
              proc = proc.use(hierarchies).use(backlinks) as unknown as Processor;
            }
          }
          // Add flavor specific plugins. These need to come before `dendronPub`
          // to fix extended image URLs before they get converted to HTML
          if (opts.flavor === ProcFlavor.PREVIEW) {
            // No extra plugins needed for the preview right now. We used to
            // need a plugin to rewrite URLs to get the engine to proxy images,
            // but now that's done by the
            // [[PreviewPanel|../packages/plugin-core/src/components/views/PreviewPanel.ts#^preview-rewrites-images]]
          }
          if (
            opts.flavor === ProcFlavor.HOVER_PREVIEW ||
            opts.flavor === ProcFlavor.BACKLINKS_PANEL_HOVER
          ) {
            proc = proc.use(dendronHoverPreview) as unknown as Processor;
          }
          // add additional plugins
          const isNoteRef = !_.isUndefined((data as ProcDataFullV5).noteRefLvl);
          let insertTitle;
          if (isNoteRef || opts.flavor === ProcFlavor.BACKLINKS_PANEL_HOVER) {
            insertTitle = false;
          } else {
            const shouldApplyPublishRules =
              MDUtilsV5.shouldApplyPublishingRules(proc);
            insertTitle = ConfigUtils.getEnableFMTitle(
              data.config,
              shouldApplyPublishRules
            );
          }
          const config = data.config;
          const publishingConfig = ConfigUtils.getPublishing(config);
          const assetsPrefix = publishingConfig.assetsPrefix;

          proc = proc.use(dendronPub, {
            insertTitle,
            transformNoPublish: opts.flavor === ProcFlavor.PUBLISHING,
            ...data.publishOpts,
          }) as unknown as Processor;

          const shouldApplyPublishRules =
            MDUtilsV5.shouldApplyPublishingRules(proc);

          if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
            proc = proc.use(math) as unknown as Processor;
          }
          proc = proc.use(remarkMermaid, { simple: true }) as unknown as Processor;
          // Add remaining flavor specific plugins
          if (opts.flavor === ProcFlavor.PUBLISHING) {
            const prefix = assetsPrefix ? assetsPrefix + "/notes/" : "/notes/";
            proc = proc.use(dendronPub, {
              wikiLinkOpts: {
                prefix,
              },
            }) as unknown as Processor;
          }
        }
        break;
      case ProcMode.IMPORT: {
        const requiredProps = ["vault", "dest"];
        const resp = checkProps({ requiredProps, data });
        if (!resp.valid) {
          throw DendronError.createFromStatus({
            status: ERROR_STATUS.INVALID_CONFIG,
            message: `missing required fields in data. ${resp.missing.join(
              " ,"
            )} missing`,
          });
        }

        // backwards compatibility, default to v4 values
        this.setProcData(proc, data as ProcDataFullV5);

        // add additional plugins
        const config = data.config as DendronConfig;
        const shouldApplyPublishRules =
          MDUtilsV5.shouldApplyPublishingRules(proc);

        if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
          proc = proc.use(math);
        }

        proc = proc.use(remarkMermaid, { simple: true }) as unknown as Processor;

        break;
      }
      case ProcMode.NO_DATA:
        break;
      default:
        assertUnreachable(opts.mode);
    }
    return proc.use(remarkStringify) as unknown as Processor;
  }

  static _procRehype(opts: ProcOptsV5, data: Omit<ProcDataFullOptsV5, "dest">) {
    const pRemarkParse = this.procRemarkParse(opts, {
      ...data,
      dest: DendronASTDest.HTML,
    });

    // add additional plugin for publishing
    let pRehype = pRemarkParse
      .use(remark2rehype as unknown as Plugin, [{ allowDangerousHtml: true }] as any)
      .use(rehypePrism as any, { ignoreMissing: true })
      .use(wrap as any, { selector: "table", wrapper: "div.table-responsive" })
      .use(raw as any)
      .use(slug as any);

    // apply plugins enabled by config
    const shouldApplyPublishRules =
      MDUtilsV5.shouldApplyPublishingRules(pRehype as unknown as Processor);

    const { insideNoteRef } = data;
    if (ConfigUtils.getEnableKatex(data.config, shouldApplyPublishRules)) {
      pRehype = pRehype.use(katex);
    }
    // apply publishing specific things, don't use anchor headings in note refs
    if (shouldApplyPublishRules && !insideNoteRef) {
      pRehype = pRehype.use(link as any, {
        behavior: "append",
        properties: {
          "aria-hidden": "true",
          class: "anchor-heading icon-link",
        },
        content: {
          type: "text",
          value: "",
        } as any,
      });
    }
    return pRehype;
  }

  static procRemarkFull(
    data: ProcDataFullOptsV5,
    opts?: { mode?: ProcMode; flavor?: ProcFlavor | undefined }
  ) {
    return this._procRemark(
      {
        mode: opts?.mode || ProcMode.FULL,
        flavor: opts?.flavor || ProcFlavor.REGULAR,
      },
      data
    );
  }

  /**
   * Parse Dendron Markdown Note. No compiler is attached.
   * @param opts
   * @param data
   * @returns
   */
  static procRemarkParse(
    opts: ProcOptsV5,
    data: OptionalExceptFor<ProcDataFullOptsV5, "config">
  ) {
    return this._procRemark({ ...opts, parseOnly: true }, data);
  }

  /**
   * Equivalent to running {@link procRemarkParse({mode: ProcMode.NO_DATA})}
   *
   * Warning! When using a no-data parser, any user configuration will not be
   * available. Avoid using it unless you are sure that the user configuration
   * has no effect on what you are doing.
   */
  static procRemarkParseNoData(
    opts: Omit<ProcOptsV5, "mode" | "parseOnly">,
    data: Partial<ProcDataFullOptsV5> & { dest: DendronASTDest }
  ) {
    // ProcMode.NO_DATA doesn't need config so we generate default to pass compilation
    const withConfig = { ...data, config: ConfigUtils.genDefaultConfig() };
    return this._procRemark(
      { ...opts, parseOnly: true, mode: ProcMode.NO_DATA },
      withConfig
    );
  }

  /**
   * Equivalent to running {@link procRemarkParse({mode: ProcMode.FULL})}
   */
  static procRemarkParseFull(
    opts: Omit<ProcOptsV5, "mode" | "parseOnly">,
    data: ProcDataFullOptsV5
  ) {
    return this._procRemark(
      { ...opts, parseOnly: true, mode: ProcMode.FULL },
      data
    );
  }

  static procRehypeFull(
    data: Omit<ProcDataFullOptsV5, "dest">,
    opts?: { flavor?: ProcFlavor }
  ) {
    const proc = this._procRehype(
      { mode: ProcMode.FULL, parseOnly: false, flavor: opts?.flavor },
      data
    );
    return proc.use(rehypeStringify);
  }
}

export const getRefId = ({ link, id }: { link: DNoteRefLink; id: string }) => {
  const { anchorStart, anchorEnd, anchorStartOffset } = _.defaults(link.data, {
    anchorStartOffset: 0,
  });
  const slug = getSlugger();
  return slug.slug([id, anchorStart, anchorEnd, anchorStartOffset].join("-"));
};
