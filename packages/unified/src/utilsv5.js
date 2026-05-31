"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefId = exports.MDUtilsV5 = exports.ProcMode = exports.ProcFlavor = void 0;
const common_all_1 = require("@dendronhq/common-all");
Object.defineProperty(exports, "ProcFlavor", { enumerable: true, get: function () { return common_all_1.ProcFlavor; } });
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
const rehype_katex_1 = __importDefault(require("rehype-katex"));
const rehype_raw_1 = __importDefault(require("rehype-raw"));
const rehype_slug_1 = __importDefault(require("rehype-slug"));
const rehype_stringify_1 = __importDefault(require("rehype-stringify"));
const remark_1 = __importDefault(require("remark"));
const remark_abbr_1 = __importDefault(require("remark-abbr"));
const remark_footnotes_1 = __importDefault(require("remark-footnotes"));
const remark_frontmatter_1 = __importDefault(require("remark-frontmatter"));
const remark_parse_1 = __importDefault(require("remark-parse"));
const remark_rehype_1 = __importDefault(require("remark-rehype"));
// import rehypeWrap from "rehype-wrap";
const wrap_1 = require("./rehype/wrap");
const remark_2 = require("./remark");
const backlinks_1 = require("./remark/backlinks");
const backlinksHover_1 = require("./remark/backlinksHover");
const blockAnchors_1 = require("./remark/blockAnchors");
const dendronPreview_1 = require("./remark/dendronPreview");
const dendronPub_1 = require("./remark/dendronPub");
const extendedImage_1 = require("./remark/extendedImage");
const hashtag_1 = require("./remark/hashtag");
const noteRefsV2_1 = require("./remark/noteRefsV2");
const userTags_1 = require("./remark/userTags");
const wikiLinks_1 = require("./remark/wikiLinks");
const types_1 = require("./types");
const path_1 = __importDefault(require("path"));
/**
 * What mode a processor should run in
 */
var ProcMode;
(function (ProcMode) {
    /**
     * Expect no properties from {@link ProcDataFullV5} when running the processor
     */
    ProcMode["NO_DATA"] = "NO_DATA";
    /**
     * Expect all properties from {@link ProcDataFullV5} when running the processor
     */
    ProcMode["FULL"] = "all data";
    /**
     * Running processor in import mode. Notes don't exist. Used for import pods like {@link MarkdownPod}
     * where notes don't exist in the engine prior to import.
     */
    ProcMode["IMPORT"] = "IMPORT";
})(ProcMode || (exports.ProcMode = ProcMode = {}));
function checkProps({ requiredProps, data, }) {
    const hasAllProps = lodash_1.default.map(requiredProps, (prop) => {
        // @ts-ignore
        return !lodash_1.default.isUndefined(data[prop]);
    });
    if (!lodash_1.default.every(hasAllProps)) {
        // @ts-ignore
        const missing = lodash_1.default.filter(requiredProps, (prop) => 
        // @ts-ignore
        lodash_1.default.isUndefined(data[prop]));
        return { valid: false, missing };
    }
    return { valid: true };
}
let REF_CACHE;
class MDUtilsV5 {
    static getRefsRoot = (wsRoot) => {
        return path_1.default.join(wsRoot, "build", "refs");
    };
    /**
     * Write ref
     * @param param1
     */
    static cacheRefId({ refId, mdast, prettyHAST, }) {
        if (REF_CACHE === undefined) {
            REF_CACHE = {};
        }
        const idString = (0, exports.getRefId)(refId);
        const payload = { node: mdast, refId, prettyHAST };
        REF_CACHE[idString] = payload;
    }
    static clearRefCache() {
        REF_CACHE = undefined;
    }
    static getRefCache() {
        if (!REF_CACHE) {
            return {};
        }
        return REF_CACHE;
    }
    static getProcOpts(proc) {
        const _data = proc.data("dendronProcOptsv5");
        return _data || {};
    }
    static getProcData(proc) {
        const _data = proc.data("dendronProcDatav5");
        return _data || {};
    }
    static setNoteRefLvl(proc, lvl) {
        return this.setProcData(proc, { noteRefLvl: lvl });
    }
    static setProcData(proc, opts) {
        const _data = proc.data("dendronProcDatav5");
        return proc.data("dendronProcDatav5", { ..._data, ...opts });
    }
    static setProcOpts(proc, opts) {
        const _data = proc.data("dendronProcOptsv5");
        return proc.data("dendronProcOptsv5", { ..._data, ...opts });
    }
    static isV5Active(proc) {
        return !lodash_1.default.isUndefined(this.getProcOpts(proc).mode);
    }
    static shouldApplyPublishingRules(proc) {
        return (this.getProcData(proc).dest === types_1.DendronASTDest.HTML &&
            this.getProcOpts(proc).flavor === common_all_1.ProcFlavor.PUBLISHING);
    }
    static getFM(opts) {
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
    static _procRemark(opts, data) {
        const errors = [];
        opts = lodash_1.default.defaults(opts, { flavor: common_all_1.ProcFlavor.REGULAR });
        let proc = (0, remark_1.default)()
            .use(remark_parse_1.default, { gfm: true })
            .use(remark_frontmatter_1.default, ["yaml"])
            .use(remark_abbr_1.default)
            .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
            .use(noteRefsV2_1.noteRefsV2)
            .use(blockAnchors_1.blockAnchors)
            .use(hashtag_1.hashtags)
            .use(userTags_1.userTags)
            .use(extendedImage_1.extendedImage)
            .use(remark_footnotes_1.default)
            .use(remark_variables_1.default)
            .use(backlinksHover_1.backlinksHover, data.backlinkHoverOpts)
            .data("errors", errors);
        //do not convert wikilinks if convertLinks set to false. Used by gdoc export pod. It uses HTMLPublish pod to do the md-->html conversion
        if (lodash_1.default.isUndefined(data.wikiLinksOpts?.convertLinks) ||
            data.wikiLinksOpts?.convertLinks) {
            proc = proc.use(wikiLinks_1.wikiLinks, data.wikiLinksOpts);
        }
        // set options and do validation
        proc = this.setProcOpts(proc, opts);
        switch (opts.mode) {
            case ProcMode.FULL:
                {
                    if (lodash_1.default.isUndefined(data)) {
                        throw common_all_1.DendronError.createFromStatus({
                            status: common_all_1.ERROR_STATUS.INVALID_CONFIG,
                            message: `data is required when not using raw proc`,
                        });
                    }
                    const requiredProps = ["vault", "fname", "dest"];
                    const resp = checkProps({ requiredProps, data });
                    if (!resp.valid) {
                        throw common_all_1.DendronError.createFromStatus({
                            status: common_all_1.ERROR_STATUS.INVALID_CONFIG,
                            message: `missing required fields in data. ${resp.missing.join(" ,")} missing`,
                        });
                    }
                    const note = data.noteToRender;
                    if (!lodash_1.default.isUndefined(note)) {
                        proc = proc.data("fm", this.getFM({ note }));
                    }
                    this.setProcData(proc, data);
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
                    const isNoteRef = !lodash_1.default.isUndefined(data.noteRefLvl);
                    let insertTitle;
                    if (isNoteRef || opts.flavor === common_all_1.ProcFlavor.BACKLINKS_PANEL_HOVER) {
                        insertTitle = false;
                    }
                    else {
                        const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);
                        insertTitle = common_all_1.ConfigUtils.getEnableFMTitle(data.config, shouldApplyPublishRules);
                    }
                    const config = data.config;
                    const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
                    const assetsPrefix = publishingConfig.assetsPrefix;
                    proc = proc.use(dendronPub_1.dendronPub, {
                        insertTitle,
                        transformNoPublish: opts.flavor === common_all_1.ProcFlavor.PUBLISHING,
                        ...data.publishOpts,
                    });
                    const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);
                    if (common_all_1.ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
                        proc = proc.use(remark_math_1.default);
                    }
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
            case ProcMode.IMPORT: {
                const requiredProps = ["vault", "dest"];
                const resp = checkProps({ requiredProps, data });
                if (!resp.valid) {
                    throw common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.INVALID_CONFIG,
                        message: `missing required fields in data. ${resp.missing.join(" ,")} missing`,
                    });
                }
                // backwards compatibility, default to v4 values
                this.setProcData(proc, data);
                // add additional plugins
                const config = data.config;
                const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);
                if (common_all_1.ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
                    proc = proc.use(remark_math_1.default);
                }
                proc = proc.use(remark_mermaid_1.default, { simple: true });
                break;
            }
            case ProcMode.NO_DATA:
                break;
            default:
                (0, common_all_1.assertUnreachable)(opts.mode);
        }
        return proc;
    }
    static _procRehype(opts, data) {
        const pRemarkParse = this.procRemarkParse(opts, {
            ...data,
            dest: types_1.DendronASTDest.HTML,
        });
        // add additional plugin for publishing
        let pRehype = pRemarkParse
            .use(remark_rehype_1.default, { allowDangerousHtml: true })
            .use(rehype_prism_1.default, { ignoreMissing: true })
            .use(wrap_1.wrap, { selector: "table", wrapper: "div.table-responsive" })
            .use(rehype_raw_1.default)
            .use(rehype_slug_1.default);
        // apply plugins enabled by config
        const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(pRehype);
        const { insideNoteRef } = data;
        if (common_all_1.ConfigUtils.getEnableKatex(data.config, shouldApplyPublishRules)) {
            pRehype = pRehype.use(rehype_katex_1.default);
        }
        // apply publishing specific things, don't use anchor headings in note refs
        if (shouldApplyPublishRules && !insideNoteRef) {
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
    static procRemarkFull(data, opts) {
        return this._procRemark({
            mode: opts?.mode || ProcMode.FULL,
            flavor: opts?.flavor || common_all_1.ProcFlavor.REGULAR,
        }, data);
    }
    /**
     * Parse Dendron Markdown Note. No compiler is attached.
     * @param opts
     * @param data
     * @returns
     */
    static procRemarkParse(opts, data) {
        return this._procRemark({ ...opts, parseOnly: true }, data);
    }
    /**
     * Equivalent to running {@link procRemarkParse({mode: ProcMode.NO_DATA})}
     *
     * Warning! When using a no-data parser, any user configuration will not be
     * available. Avoid using it unless you are sure that the user configuration
     * has no effect on what you are doing.
     */
    static procRemarkParseNoData(opts, data) {
        // ProcMode.NO_DATA doesn't need config so we generate default to pass compilation
        const withConfig = { ...data, config: common_all_1.ConfigUtils.genDefaultConfig() };
        return this._procRemark({ ...opts, parseOnly: true, mode: ProcMode.NO_DATA }, withConfig);
    }
    /**
     * Equivalent to running {@link procRemarkParse({mode: ProcMode.FULL})}
     */
    static procRemarkParseFull(opts, data) {
        return this._procRemark({ ...opts, parseOnly: true, mode: ProcMode.FULL }, data);
    }
    static procRehypeFull(data, opts) {
        const proc = this._procRehype({ mode: ProcMode.FULL, parseOnly: false, flavor: opts?.flavor }, data);
        return proc.use(rehype_stringify_1.default);
    }
}
exports.MDUtilsV5 = MDUtilsV5;
const getRefId = ({ link, id }) => {
    const { anchorStart, anchorEnd, anchorStartOffset } = lodash_1.default.defaults(link.data, {
        anchorStartOffset: 0,
    });
    const slug = (0, common_all_1.getSlugger)();
    return slug.slug([id, anchorStart, anchorEnd, anchorStartOffset].join("-"));
};
exports.getRefId = getRefId;
//# sourceMappingURL=utilsv5.js.map