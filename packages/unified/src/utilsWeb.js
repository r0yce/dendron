"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MDUtilsV5Web = void 0;
const common_all_1 = require("@dendronhq/common-all");
// @ts-ignore
const rehype_prism_1 = __importDefault(require("@mapbox/rehype-prism"));
// @ts-ignore
const remark_mermaid_1 = __importDefault(require("@dendronhq/remark-mermaid"));
const lodash_1 = __importDefault(require("lodash"));
const rehype_autolink_headings_1 = __importDefault(require("rehype-autolink-headings"));
const remark_math_1 = __importDefault(require("remark-math"));
// @ts-ignore
const remark_variables_1 = __importDefault(require("remark-variables"));
// @ts-ignore
const rehype_raw_1 = __importDefault(require("rehype-raw"));
const rehype_slug_1 = __importDefault(require("rehype-slug"));
const rehype_stringify_1 = __importDefault(require("rehype-stringify"));
const remark_1 = __importDefault(require("remark"));
const remark_abbr_1 = __importDefault(require("remark-abbr"));
const remark_footnotes_1 = __importDefault(require("remark-footnotes"));
const remark_frontmatter_1 = __importDefault(require("remark-frontmatter"));
const remark_parse_1 = __importDefault(require("remark-parse"));
const remark_rehype_1 = __importDefault(require("remark-rehype"));
const remark_2 = require("./remark");
const backlinks_1 = require("./remark/backlinks");
const backlinksHover_1 = require("./remark/backlinksHover");
const blockAnchors_1 = require("./remark/blockAnchors");
const dendronPreview_1 = require("./remark/dendronPreview");
const dendronPub_1 = require("./remark/dendronPub");
const extendedImage_1 = require("./remark/extendedImage");
const hashtag_1 = require("./remark/hashtag");
// import { noteRefsV2 } from "./remark/noteRefsV2";
const userTags_1 = require("./remark/userTags");
const wikiLinks_1 = require("./remark/wikiLinks");
const types_1 = require("./types");
const utilsv5_1 = require("./utilsv5");
/**
 * Special version of MDUtilsV5 to get preview working in the web extension.
 * This class should eventually be deleted and converged with utilsV5 once
 * utilsV5 is compatible with EngineV3.
 */
class MDUtilsV5Web {
    static procRehypeWeb(data, opts) {
        const proc = this._procRehype({ mode: utilsv5_1.ProcMode.FULL, parseOnly: false, flavor: opts?.flavor }, data);
        return proc.use(rehype_stringify_1.default);
    }
    /**
     * Used for processing a Dendron markdown note
     */
    static _procRemarkWeb(opts, data) {
        const errors = [];
        opts = lodash_1.default.defaults(opts, { flavor: common_all_1.ProcFlavor.REGULAR });
        let proc = (0, remark_1.default)()
            .use(remark_parse_1.default, { gfm: true })
            .use(remark_frontmatter_1.default, ["yaml"])
            .use(remark_abbr_1.default)
            .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
            // .use(noteRefsV2) TODO: Add in note ref functionalit
            .use(blockAnchors_1.blockAnchors)
            .use(hashtag_1.hashtags)
            .use(userTags_1.userTags)
            .use(extendedImage_1.extendedImage)
            .use(remark_footnotes_1.default)
            .use(remark_variables_1.default)
            .use(backlinksHover_1.backlinksHover, data.backlinkHoverOpts)
            .use(wikiLinks_1.wikiLinks)
            .data("errors", errors);
        // set options and do validation
        proc = utilsv5_1.MDUtilsV5.setProcOpts(proc, opts);
        switch (opts.mode) {
            case utilsv5_1.ProcMode.FULL:
                {
                    if (lodash_1.default.isUndefined(data)) {
                        throw common_all_1.DendronError.createFromStatus({
                            status: common_all_1.ERROR_STATUS.INVALID_CONFIG,
                            message: `data is required when not using raw proc`,
                        });
                    }
                    const note = data.noteToRender;
                    if (!lodash_1.default.isUndefined(note)) {
                        proc = proc.data("fm", utilsv5_1.MDUtilsV5.getFM({ note }));
                    }
                    utilsv5_1.MDUtilsV5.setProcData(proc, data);
                    // NOTE: order matters. this needs to appear before `dendronPub`
                    if (data.dest === types_1.DendronASTDest.HTML) {
                        //do not convert backlinks, children if convertLinks set to false. Used by gdoc export pod. It uses HTMLPublish pod to do the md-->html conversion
                        if (lodash_1.default.isUndefined(data.wikiLinksOpts?.convertLinks) ||
                            data.wikiLinksOpts?.convertLinks) {
                            proc = proc.use(remark_2.hierarchies).use(backlinks_1.backlinks);
                        }
                    }
                    // Add flavor specific plugins. These need to come before `dendronPub`
                    // to fix extended image URLs before they get converted to HTML
                    if (opts.flavor === common_all_1.ProcFlavor.PREVIEW) {
                        // No extra plugins needed for the preview right now. We used to
                        // need a plugin to rewrite URLs to get the engine to proxy images,
                        // but now that's done by the
                        // [[PreviewPanel|../packages/plugin-core/src/components/views/PreviewPanel.ts#^preview-rewrites-images]]
                    }
                    if (opts.flavor === common_all_1.ProcFlavor.HOVER_PREVIEW ||
                        opts.flavor === common_all_1.ProcFlavor.BACKLINKS_PANEL_HOVER) {
                        proc = proc.use(dendronPreview_1.dendronHoverPreview);
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
                    proc = proc.use(dendronPub_1.dendronPub, {
                        insertTitle,
                        transformNoPublish: opts.flavor === common_all_1.ProcFlavor.PUBLISHING,
                        ...data.publishOpts,
                    });
                    // const shouldApplyPublishRules =
                    //   MDUtilsV5.shouldApplyPublishingRules(proc);
                    // if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
                    //   proc = proc.use(math);
                    // }
                    // if (ConfigUtils.getEnableMermaid(config, shouldApplyPublishRules)) {
                    //   proc = proc.use(mermaid, { simple: true });
                    // }
                    proc = proc.use(remark_math_1.default);
                    proc = proc.use(remark_mermaid_1.default, { simple: true });
                    // Add remaining flavor specific plugins
                    if (opts.flavor === common_all_1.ProcFlavor.PUBLISHING) {
                        const prefix = assetsPrefix ? assetsPrefix + "/notes/" : "/notes/";
                        proc = proc.use(dendronPub_1.dendronPub, {
                            wikiLinkOpts: {
                                prefix,
                            },
                        });
                    }
                }
                break;
            case utilsv5_1.ProcMode.IMPORT:
            case utilsv5_1.ProcMode.NO_DATA:
                break;
            default:
                (0, common_all_1.assertUnreachable)(opts.mode);
        }
        return proc;
    }
    static _procRehype(opts, data
    // data?: Partial<ProcDataFullWebV5>
    ) {
        const pRemarkParse = this.procRemarkParse(opts, {
            ...data,
            dest: types_1.DendronASTDest.HTML,
        });
        // add additional plugin for publishing
        let pRehype = pRemarkParse
            .use(remark_rehype_1.default, { allowDangerousHtml: true })
            .use(rehype_prism_1.default, { ignoreMissing: true })
            .use(rehype_raw_1.default)
            .use(rehype_slug_1.default);
        // apply plugins enabled by config
        // const config = data?.engine?.config as IntermediateDendronConfig;
        const shouldApplyPublishRules = utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(pRehype);
        // if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
        //   pRehype = pRehype.use(katex);
        // }
        // apply publishing specific things
        if (shouldApplyPublishRules) {
            pRehype = pRehype.use(rehype_autolink_headings_1.default, {
                behavior: "append",
                properties: {
                    "aria-hidden": "true",
                    class: "anchor-heading icon-link",
                },
                content: {
                    type: "text",
                    // @ts-ignore
                    value: "",
                },
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
    static procRemarkParse(opts, data) {
        return this._procRemarkWeb({ ...opts, parseOnly: true }, data);
    }
}
exports.MDUtilsV5Web = MDUtilsV5Web;
//# sourceMappingURL=utilsWeb.js.map