"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dendronPub = plugin;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const mdast_builder_1 = require("mdast-builder");
const unist_builder_1 = __importDefault(require("unist-builder"));
const unist_util_visit_parents_1 = __importDefault(require("unist-util-visit-parents"));
const SiteUtils_1 = require("../SiteUtils");
const types_1 = require("../types");
const utilsv5_1 = require("../utilsv5");
const blockAnchors_1 = require("./blockAnchors");
const extendedImage_1 = require("./extendedImage");
const noteRefsV2_1 = require("./noteRefsV2");
const utils_1 = require("./utils");
/**
 * Get the vault name, either from processor or passed in vaultName
 * @param opts.vaultMissingBehavior how to respond if no vault is found. See {@link VaultMissingBehavior}
 */
function getVault({ vaultMissingBehavior, vaultName, vault, vaults, }) {
    if (vaultName) {
        try {
            vault = common_all_1.VaultUtils.getVaultByNameOrThrow({
                vaults,
                vname: vaultName,
            });
        }
        catch (err) {
            if (vaultMissingBehavior === types_1.VaultMissingBehavior.THROW_ERROR) {
                throw err;
            }
        }
    }
    return vault;
}
/**
 * Returns a new copy of children array where the first un-rendered
 * reference ![[ref]] in children array is replaced with the given `data`. */
function replacedUnrenderedRefWithConvertedData(data, children) {
    if (children.length > 1) {
        const idx = lodash_1.default.findIndex(children, utils_1.RemarkUtils.isNoteRefV2);
        const processedChildren = children
            .slice(0, idx)
            .concat(data)
            .concat(children.slice(idx + 1));
        return processedChildren;
    }
    else {
        return data;
    }
}
/**
 * Handles AST nodes that contain urls (i.e images, extended images, and links)
 *
 * Provides a matcher that could be used in the transformer so that a node could be
 * matched for potential transformation.
 *
 * Handler takes the node and correct / resolves the url properly.
 */
class NodeUrlHandler {
    // Detects if its a link to a header on the same page (this is valid in Github
    // flavored markdown). If we need this elsewhere, we can pull this function
    // out into a util.
    static isSamePageHeaderUrl(url) {
        return url.startsWith("#");
    }
    static match(node, { pData }) {
        return ((node.type === types_1.DendronASTTypes.IMAGE ||
            node.type === types_1.DendronASTTypes.EXTENDED_IMAGE ||
            node.type === types_1.DendronASTTypes.LINK) &&
            pData.dest === types_1.DendronASTDest.HTML);
    }
    static handle(node, { proc, cOpts }) {
        if (!(0, common_all_1.isWebUri)(node.url) && !NodeUrlHandler.isSamePageHeaderUrl(node.url)) {
            const { config } = utilsv5_1.MDUtilsV5.getProcData(proc);
            //handle assetPrefix
            const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
            const assetsPrefix = utilsv5_1.MDUtilsV5.isV5Active(proc)
                ? publishingConfig.assetsPrefix
                : cOpts?.assetsPrefix;
            const url = lodash_1.default.trim(node.url, "/");
            node.url = (assetsPrefix ? assetsPrefix + "/" : "/") + url;
        }
        return { node };
    }
}
function shouldInsertTitle({ proc }) {
    const data = utilsv5_1.MDUtilsV5.getProcData(proc);
    const opts = utilsv5_1.MDUtilsV5.getProcOpts(proc);
    const isNoteRef = !lodash_1.default.isNumber(data.noteRefLvl) && data.noteRefLvl > 0;
    let insertTitle;
    if (isNoteRef ||
        opts.flavor === common_all_1.ProcFlavor.BACKLINKS_PANEL_HOVER ||
        opts.flavor === common_all_1.ProcFlavor.HOVER_PREVIEW) {
        insertTitle = false;
    }
    else {
        const config = data.config;
        const shouldApplyPublishRules = utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(proc);
        insertTitle = common_all_1.ConfigUtils.getEnableFMTitle(config, shouldApplyPublishRules);
    }
    return insertTitle;
}
function plugin(opts) {
    const proc = this;
    const { vault, vaults, wsRoot } = utilsv5_1.MDUtilsV5.getProcData(proc);
    const pOpts = utilsv5_1.MDUtilsV5.getProcOpts(proc);
    const { mode } = pOpts;
    const pData = utilsv5_1.MDUtilsV5.getProcData(proc);
    const { dest, fname, config, insideNoteRef, noteToRender, noteCacheForRenderDict, } = pData;
    function transformer(tree, _file) {
        const root = tree;
        const insertTitle = shouldInsertTitle({ proc });
        if (mode !== utilsv5_1.ProcMode.IMPORT && !insideNoteRef && root.children) {
            if (!fname || !vault) {
                // TODO: tmp
                throw new common_all_1.DendronError({
                    message: `dendronPub - no fname or vault for node: ${JSON.stringify(tree)}`,
                });
            }
            let note;
            // Special Logic for 403 Error Static Page:
            if (fname === "403") {
                note = SiteUtils_1.SiteUtils.create403StaticNote({ vaults });
            }
            else {
                note = noteToRender;
            }
            // ^53ueid06urse
            if (insertTitle) {
                const idx = lodash_1.default.findIndex(root.children, (ent) => ent.type !== "yaml");
                root.children.splice(idx, 0, (0, unist_builder_1.default)(types_1.DendronASTTypes.HEADING, { depth: 1 }, [(0, unist_builder_1.default)("text", note.title)]));
            }
        }
        (0, unist_util_visit_parents_1.default)(tree, (node, ancestors) => {
            const parent = lodash_1.default.last(ancestors);
            if (lodash_1.default.isUndefined(parent) || !utils_1.RemarkUtils.isParent(parent))
                return; // root node
            if (node.type === types_1.DendronASTTypes.HASHTAG) {
                const hashtag = node;
                const parentIndex = lodash_1.default.findIndex(parent.children, node);
                if (parentIndex === -1)
                    return;
                // For hashtags, convert them to regular links for rendering
                // but not if they are inside of a link, otherwise they break link rendering.
                if (!ancestors.some((node) => utils_1.RemarkUtils.isLink(node))) {
                    node = (0, utils_1.hashTag2WikiLinkNoteV4)(hashtag);
                }
                else {
                    // If they are inside a link, rendering them as wikilinks will break the link rendering. Convert them to regular text.
                    node = (0, mdast_builder_1.text)(hashtag.value);
                }
                parent.children[parentIndex] = node;
            }
            if (node.type === types_1.DendronASTTypes.USERTAG) {
                const userTag = node;
                const parentIndex = lodash_1.default.findIndex(parent.children, node);
                if (parentIndex === -1)
                    return;
                // Convert user tags to regular links for rendering
                // but not if they are inside of a link, otherwise they break link rendering.
                if (!ancestors.some((node) => utils_1.RemarkUtils.isLink(node))) {
                    node = (0, utils_1.userTag2WikiLinkNoteV4)(userTag);
                }
                else {
                    node = (0, mdast_builder_1.text)(userTag.value);
                }
                parent.children[parentIndex] = node;
            }
            if (node.type === types_1.DendronASTTypes.WIKI_LINK) {
                const shouldApplyPublishingRules = utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(proc);
                const enableNoteTitleForLink = common_all_1.ConfigUtils.getEnableNoteTitleForLink(config, shouldApplyPublishingRules);
                // If the target is Dendron, no processing of links is needed
                if (dest === types_1.DendronASTDest.MD_DENDRON)
                    return;
                const _node = node;
                // @ts-ignore
                let value = node.value;
                // we change this later
                const valueOrig = value;
                let isPublished = true;
                const data = _node.data;
                // eslint-disable-next-line prefer-const
                let { vault } = utilsv5_1.MDUtilsV5.getProcData(proc);
                vault = getVault({
                    vault,
                    vaults,
                    vaultMissingBehavior: types_1.VaultMissingBehavior.FALLBACK_TO_ORIGINAL_VAULT,
                    vaultName: data.vaultName,
                });
                let error;
                let note;
                if (mode !== utilsv5_1.ProcMode.IMPORT) {
                    if (noteCacheForRenderDict) {
                        note = common_all_1.NoteDictsUtils.findByFname({
                            fname: valueOrig,
                            noteDicts: noteCacheForRenderDict,
                            vault,
                        })[0];
                    }
                    if (!note) {
                        error = new common_all_1.DendronError({ message: `no note found. ${value}` });
                    }
                }
                let color;
                if (mode !== utilsv5_1.ProcMode.IMPORT && value.startsWith(common_all_1.TAGS_HIERARCHY)) {
                    const { color: maybeColor, type: colorType } = common_all_1.NoteUtils.color({
                        fname: value,
                        note: noteToRender,
                        vault,
                    });
                    const enableRandomlyColoredTagsConfig = common_all_1.ConfigUtils.getEnableRandomlyColoredTags(config);
                    if (colorType === "configured" ||
                        (enableRandomlyColoredTagsConfig && !opts?.noRandomlyColoredTags)) {
                        color = maybeColor;
                    }
                }
                const copts = opts?.wikiLinkOpts;
                if (!note && opts?.transformNoPublish) {
                    const code = common_all_1.StatusCodes.FORBIDDEN;
                    value = lodash_1.default.toString(code);
                    (0, utils_1.addError)(proc, new common_all_1.DendronError({
                        message: "no note",
                        code,
                        severity: common_all_1.ERROR_SEVERITY.MINOR,
                    }));
                }
                else if (note && opts?.transformNoPublish) {
                    if (error) {
                        value = lodash_1.default.toString(common_all_1.StatusCodes.FORBIDDEN);
                        (0, utils_1.addError)(proc, error);
                    }
                    else if (!config) {
                        const code = common_all_1.StatusCodes.FORBIDDEN;
                        value = lodash_1.default.toString(code);
                        (0, utils_1.addError)(proc, new common_all_1.DendronError({
                            message: "no config",
                            code,
                            severity: common_all_1.ERROR_SEVERITY.MINOR,
                        }));
                    }
                    else {
                        isPublished = SiteUtils_1.SiteUtils.isPublished({
                            note,
                            config,
                            wsRoot,
                            vaults,
                        });
                        if (!isPublished) {
                            value = lodash_1.default.toString(common_all_1.StatusCodes.FORBIDDEN);
                        }
                    }
                }
                let useId = copts?.useId;
                if (useId === undefined &&
                    utilsv5_1.MDUtilsV5.isV5Active(proc) &&
                    dest === types_1.DendronASTDest.HTML) {
                    useId = true;
                }
                if (note && useId && isPublished) {
                    if (error) {
                        (0, utils_1.addError)(proc, error);
                    }
                    else {
                        value = note.id;
                    }
                }
                let title;
                if (enableNoteTitleForLink) {
                    if (noteCacheForRenderDict) {
                        const targetVault = data.vaultName
                            ? common_all_1.VaultUtils.getVaultByName({ vname: data.vaultName, vaults })
                            : undefined;
                        const target = common_all_1.NoteDictsUtils.findByFname({
                            fname: valueOrig,
                            noteDicts: noteCacheForRenderDict,
                            vault: targetVault,
                        })[0];
                        if (target) {
                            title = target.title;
                        }
                    }
                }
                const alias = data.alias ?? title ?? value;
                const href = SiteUtils_1.SiteUtils.getSiteUrlPathForNote({
                    addPrefix: pOpts.flavor === common_all_1.ProcFlavor.PUBLISHING,
                    pathValue: value,
                    config,
                    pathAnchor: data.anchorHeader,
                    note,
                });
                const exists = true;
                // for rehype
                //_node.value = newValue;
                //_node.value = alias;
                const { before, after } = linkExtras({ note, config });
                _node.data = {
                    vaultName: data.vaultName,
                    alias,
                    permalink: href,
                    exists,
                    hName: "a",
                    hProperties: {
                        className: color ? "color-tag" : undefined,
                        style: color ? `--tag-color: ${color};` : undefined,
                        href,
                    },
                    hChildren: [
                        ...before,
                        {
                            type: "text",
                            value: alias,
                        },
                        ...after,
                    ],
                };
                if (value === "403") {
                    const aliasToUse = alias === "403" ? valueOrig : alias;
                    _node.data = {
                        alias: aliasToUse,
                        hName: "a",
                        hProperties: {
                            title: "Private",
                            href: "https://wiki.dendron.so/notes/hfyvYGJZQiUwQaaxQO27q.html",
                            target: "_blank",
                            class: "private",
                        },
                        hChildren: [
                            {
                                type: "text",
                                value: `${aliasToUse} (Private)`,
                            },
                        ],
                    };
                }
            }
            if (node.type === types_1.DendronASTTypes.REF_LINK_V2) {
                // If the target is Dendron, no processing of refs is needed
                if (dest === types_1.DendronASTDest.MD_DENDRON)
                    return;
                // we have custom compiler for markdown to handle note ref
                const ndata = node.data;
                const copts = {
                    wikiLinkOpts: opts?.wikiLinkOpts,
                };
                const procOpts = utilsv5_1.MDUtilsV5.getProcOpts(proc);
                const { data: noteRefHAST } = (0, noteRefsV2_1.convertNoteRefToHAST)({
                    link: ndata.link,
                    proc,
                    compilerOpts: copts,
                    procOpts,
                });
                if (noteRefHAST) {
                    parent.children = replacedUnrenderedRefWithConvertedData(noteRefHAST, parent.children);
                }
            }
            if (node.type === types_1.DendronASTTypes.BLOCK_ANCHOR) {
                // no transform
                if (dest !== types_1.DendronASTDest.HTML) {
                    return;
                }
                const anchorHTML = (0, blockAnchors_1.blockAnchor2html)(node);
                let target;
                const grandParent = ancestors[ancestors.length - 2];
                if (utils_1.RemarkUtils.isParagraph(parent) &&
                    parent.children.length === 1 &&
                    (0, common_all_1.isNotUndefined)(grandParent) &&
                    utils_1.RemarkUtils.isRoot(grandParent)) {
                    // If the block anchor is at the top level, then it references the block before it
                    const parentIndex = lodash_1.default.indexOf(grandParent.children, parent);
                    const previous = grandParent.children[parentIndex - 1];
                    if (lodash_1.default.isUndefined(previous)) {
                        // Block anchor at the very start of the note, just add anchor to the start
                        target = grandParent;
                    }
                    else {
                        // There's an actual block before the anchor
                        target = previous;
                    }
                }
                else if (utils_1.RemarkUtils.isTableRow(grandParent)) {
                    // An anchor inside a table references the whole table.
                    const greatGrandParent = ancestors[ancestors.length - 3];
                    if ((0, common_all_1.isNotUndefined)(greatGrandParent) &&
                        utils_1.RemarkUtils.isTable(greatGrandParent)) {
                        // The table HTML generation drops anything not attached to a cell, so we put this in the first cell instead.
                        target = greatGrandParent.children[0]?.children[0];
                    }
                }
                else {
                    // Otherwise, it references the block it's inside
                    target = parent;
                }
                if (lodash_1.default.isUndefined(target))
                    return;
                if (utils_1.RemarkUtils.isList(target)) {
                    // Can't install as a child of the list, has to go into a list item
                    target = target.children[0];
                }
                if (utils_1.RemarkUtils.isTable(target)) {
                    // Can't install as a child of the table directly, has to go into a table cell
                    target = target.children[0].children[0];
                }
                if (utils_1.RemarkUtils.isParent(target)) {
                    // Install the block anchor at the target node
                    target.children.unshift(anchorHTML);
                }
                else if (utils_1.RemarkUtils.isRoot(target)) {
                    // If the anchor is the first thing in the note, anchorHTML goes to the start of the document
                    target.children.unshift(anchorHTML);
                }
                else if (utils_1.RemarkUtils.isParent(grandParent)) {
                    // For some elements (for example code blocks) we can't install the block anchor on them.
                    // In that case we at least put a link before the element so that the link will at least work.
                    const targetIndex = lodash_1.default.indexOf(grandParent.children, target);
                    const targetWrapper = (0, mdast_builder_1.paragraph)([
                        anchorHTML,
                        grandParent.children[targetIndex],
                    ]);
                    grandParent.children.splice(targetIndex, 1, targetWrapper);
                }
                // Remove the block anchor itself since we install the anchor at the target
                const index = lodash_1.default.indexOf(parent.children, node);
                parent.children.splice(index, 1);
                // We might be adding and removing siblings here. We must return the index of the next sibling to traverse.
                if (target === parent) {
                    // In this case, we removed block anchor but added a node to the start.
                    // As a result, the indices match and traversal can continue.
                    return;
                }
                else if (parent.children.length === 0) {
                    // After removing the block anchor, there are no siblings left in the parent to traverse.
                    return -1;
                }
                else {
                    // Otherwise, the next sibling got shifted down by 1 index, it will be at the same index as the block anchor.
                    return index;
                }
            }
            // The url correction needs to happen for both regular and extended images
            if (NodeUrlHandler.match(node, { pData, pOpts })) {
                const { nextAction } = NodeUrlHandler.handle(node, {
                    proc,
                    parent,
                    cOpts: opts,
                });
                if (nextAction) {
                    return nextAction;
                }
            }
            if (node.type === types_1.DendronASTTypes.EXTENDED_IMAGE &&
                dest === types_1.DendronASTDest.HTML) {
                const index = lodash_1.default.indexOf(parent.children, node);
                // Replace with the HTML containing the image including custom properties
                parent.children.splice(index, 1, (0, extendedImage_1.extendedImage2html)(node));
            }
            return; // continue traversal
        });
        return tree;
    }
    return transformer;
}
/** Generate elements to be included before and after the text of a wikilink. */
function linkExtras({ note, config, }) {
    const before = [];
    const after = [];
    // For task notes, add the status, priority, due, and owner info
    if (note &&
        common_all_1.TaskNoteUtils.isTaskNote(note) &&
        common_all_1.ConfigUtils.getPublishing(config).enableTaskNotes) {
        const taskConfig = common_all_1.ConfigUtils.getTask(config);
        const status = common_all_1.TaskNoteUtils.getStatusSymbolRaw({
            note,
            taskConfig,
        });
        if (status) {
            const checkbox = {
                type: "element",
                tagName: "input",
                properties: {
                    type: "checkbox",
                    disabled: true,
                    className: "task-before task-status",
                },
            };
            if (common_all_1.TaskNoteUtils.isTaskComplete({ note, taskConfig })) {
                checkbox.properties.checked = true;
            }
            else if (status.trim().length > 0) {
                checkbox.children = [span("task-status-text", `(${status})`)];
            }
            before.push(checkbox);
        }
        const priority = common_all_1.TaskNoteUtils.getPrioritySymbol({
            note,
            taskConfig,
        });
        if (priority) {
            after.push(span("task-after task-priority", `priority:${priority}`));
        }
        const { due, owner } = note.custom;
        if (due) {
            after.push(span("task-after task-due", `due:${due}`));
        }
        if (owner) {
            after.push(span("task-after task-owner", `@${owner}`));
        }
    }
    return { before, after };
}
/** Generates a hast (unifiedjs html) element for a span that has the given class names, and contains the given text as contents. */
function span(className, text) {
    return {
        type: "element",
        tagName: "span",
        properties: {
            className,
        },
        children: [{ type: "text", value: text }],
    };
}
//# sourceMappingURL=dendronPub.js.map