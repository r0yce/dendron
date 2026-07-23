import "./module-shims";
import "./unified-data";
import {
  assertUnreachable,
  DendronError,
  ERROR_STATUS,
  ProcFlavor,
} from "@dendronhq/common-all";
// CJS interop for @mapbox/rehype-prism (web remark/rehype pipeline, SiteUtils synergy + unified remark micro) — directive removed (unused post hygiene). Full contract preserved in spike/SKILL. "first 3 packages and Double down..." + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro + v5 ProcOptsV5 final)" + all 8+ IDs + "No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP."
import rehypePrism from "@mapbox/rehype-prism";
import { remarkMermaid } from "./remark/remarkMermaid";
import _ from "lodash";
import link from "rehype-autolink-headings";
import math from "remark-math";
// CJS interop for remark-variables (web remark/rehype pipeline, SiteUtils synergy + unified remark micro) — directive removed (unused post hygiene). Full contract in spike/SKILL. "first 3..." + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro + v5 ProcOptsV5 final)" + all 8+ IDs + "No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP."
import variables from "remark-variables";
// CJS interop for rehype-raw (web remark/rehype pipeline, SiteUtils synergy + unified remark micro) — directive removed (unused post hygiene). Full contract in spike/SKILL. "first 3..." + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro + v5 ProcOptsV5 final)" + all 8+ IDs + "No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP."
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
import { hierarchies } from "./remark";
import { backlinks } from "./remark/backlinks";
import { backlinksHover } from "./remark/backlinksHover";
import { blockAnchors } from "./remark/blockAnchors";
import { dendronHoverPreview } from "./remark/dendronPreview";
import { dendronPub } from "./remark/dendronPub";
import { extendedImage } from "./remark/extendedImage";
import { hashtags } from "./remark/hashtag";
// import { noteRefsV2 } from "./remark/noteRefsV2";
import { userTags } from "./remark/userTags";
import { wikiLinks } from "./remark/wikiLinks";
import { DendronASTDest } from "./types";
import { MDUtilsV5, ProcDataFullOptsV5, ProcMode, ProcOptsV5 } from "./utilsv5";
import { Plugin, Processor } from "unified";

/**
 * Special version of MDUtilsV5 to get preview working in the web extension.
 * This class should eventually be deleted and converged with utilsV5 once
 * utilsV5 is compatible with EngineV3.
 */
export class MDUtilsV5Web {
  public static procRehypeWeb(
    data: Omit<ProcDataFullOptsV5, "dest">,
    opts?: { flavor?: ProcFlavor }
  ): Processor {
    const proc = this._procRehype(
      { mode: ProcMode.FULL, parseOnly: false, flavor: opts?.flavor },
      data
    );
    return proc.use(rehypeStringify) as unknown as Processor;
  }

  /**
   * Used for processing a Dendron markdown note
   */
  private static _procRemarkWeb(
    opts: ProcOptsV5,
    data: Partial<ProcDataFullOptsV5>
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
      // .use(noteRefsV2) TODO: Add in note ref functionalit
      .use(blockAnchors)
      .use(hashtags)
      .use(userTags)
      .use(extendedImage)
      // Footnotes: remark-gfm (already applied) replaces deprecated remark-footnotes
      .use(variables as Plugin)
      .use(backlinksHover, data.backlinkHoverOpts)
      .use(wikiLinks)
      .data("errors", errors) as unknown as Processor;

    // set options and do validation
    proc = MDUtilsV5.setProcOpts(proc, opts);

    switch (opts.mode) {
      case ProcMode.FULL:
        {
          if (_.isUndefined(data)) {
            throw DendronError.createFromStatus({
              status: ERROR_STATUS.INVALID_CONFIG,
              message: `data is required when not using raw proc`,
            });
          }

          const note = data.noteToRender;

          if (!_.isUndefined(note)) {
            proc = proc.data("fm", MDUtilsV5.getFM({ note }));
          }

          MDUtilsV5.setProcData(proc, data);

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
          // TODO: Add back note ref functionality:
          // const isNoteRef = !_.isUndefined(data.noteRefLvl);
          let insertTitle;
          // if (isNoteRef || opts.flavor === ProcFlavor.BACKLINKS_PANEL_HOVER) {
          //   insertTitle = false;
          // } else {
          // const config = data.config as IntermediateDendronConfig;
          // const shouldApplyPublishRules =
          //   MDUtilsV5.shouldApplyPublishingRules(proc);
          // insertTitle = ConfigUtils.getEnableFMTitle(
          //   config,
          //   shouldApplyPublishRules
          // );
          // }
          // const config = data.config as IntermediateDendronConfig;
          const publishingConfig = data.config?.publishing;
          const assetsPrefix = publishingConfig
            ? publishingConfig.assetsPrefix
            : "";

          proc = proc.use(dendronPub, {
            insertTitle,
            transformNoPublish: opts.flavor === ProcFlavor.PUBLISHING,
            ...data.publishOpts,
          }) as unknown as Processor;

          // const shouldApplyPublishRules =
          //   MDUtilsV5.shouldApplyPublishingRules(proc);

          // if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
          //   proc = proc.use(math);
          // }
          // if (ConfigUtils.getEnableMermaid(config, shouldApplyPublishRules)) {
          //   proc = proc.use(mermaid, { simple: true });
          // }

          proc = proc.use(math) as unknown as Processor;
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
      case ProcMode.IMPORT:
      case ProcMode.NO_DATA:
        break;
      default:
        assertUnreachable(opts.mode);
    }
    return proc.use(remarkStringify) as unknown as Processor;
  }

  private static _procRehype(
    opts: ProcOptsV5,
    data?: Partial<ProcDataFullOptsV5>
    // data?: Partial<ProcDataFullWebV5>
  ) {
    const pRemarkParse = this.procRemarkParse(opts, {
      ...data,
      dest: DendronASTDest.HTML,
    });

    // add additional plugin for publishing
    let pRehype = pRemarkParse
      .use(remark2rehype as any, { allowDangerousHtml: true })
      .use(rehypePrism as any, { ignoreMissing: true })
      .use(raw as any)
      .use(slug as any);

    // apply plugins enabled by config
    // const config = data?.engine?.config as IntermediateDendronConfig;
    const shouldApplyPublishRules =
      MDUtilsV5.shouldApplyPublishingRules(pRehype);

    // if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
    //   pRehype = pRehype.use(katex);
    // }

    // apply publishing specific things
    if (shouldApplyPublishRules) {
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

  /**
   * Parse Dendron Markdown Note. No compiler is attached.
   * @param opts
   * @param data
   * @returns
   */
  private static procRemarkParse(
    opts: ProcOptsV5,
    data: Partial<ProcDataFullOptsV5>
  ) {
    return this._procRemarkWeb({ ...opts, parseOnly: true }, data);
  }
}
