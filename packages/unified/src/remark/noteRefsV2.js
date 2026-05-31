"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteRefsV2 = exports.NoteRefUtils = void 0;
exports.isBeginBlockAnchorId = isBeginBlockAnchorId;
exports.isEndBlockAnchorId = isEndBlockAnchorId;
exports.convertNoteRefToHAST = convertNoteRefToHAST;
exports.prepareNoteRefIndices = prepareNoteRefIndices;
/* eslint-disable no-console */
/* eslint-disable func-names */
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const mdast_builder_1 = require("mdast-builder");
const __1 = require("..");
const remark_1 = require("../remark");
const SiteUtils_1 = require("../SiteUtils");
const types_1 = require("../types");
const utilsv5_1 = require("../utilsv5");
const utils_1 = require("./utils");
const LINK_REGEX = /^!\[\[(.+?)\]\]/;
class NoteRefUtils {
    static dnodeRefLink2String(link) {
        const { anchorStart, anchorStartOffset, anchorEnd } = link.data;
        const { fname, alias } = link.from;
        const linkText = alias ? `${alias}|${fname}` : fname;
        let suffix = "";
        const vaultPrefix = link.data.vaultName
            ? `${common_all_1.CONSTANTS.DENDRON_DELIMETER}${link.data.vaultName}/`
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
exports.NoteRefUtils = NoteRefUtils;
function gatherNoteRefs({ link, vault, noteDicts, }) {
    let noteRefs = [];
    if (link.from.fname.endsWith("*")) {
        // We must have note dicts to process wildcard references.
        if (!noteDicts) {
            return [];
        }
        const out = lodash_1.default.filter(Object.values(noteDicts.notesById), (ent) => common_all_1.VaultUtils.isEqualV2(vault, ent.vault) &&
            common_all_1.DUtils.minimatch(ent.fname, link.from.fname));
        noteRefs = lodash_1.default.sortBy(out.map((ent) => common_all_1.NoteUtils.toNoteLoc(ent)), "fname");
    }
    else {
        noteRefs.push(link.from);
    }
    return noteRefs;
}
function isBeginBlockAnchorId(anchorId) {
    return anchorId === "begin";
}
function isEndBlockAnchorId(anchorId) {
    return anchorId === "end";
}
function shouldRenderPretty({ proc }) {
    const procData = utilsv5_1.MDUtilsV5.getProcData(proc);
    const { config, dest, noteToRender } = procData;
    // pretty refs not valid for regular markdown
    if (lodash_1.default.includes([types_1.DendronASTDest.MD_DENDRON, types_1.DendronASTDest.MD_REGULAR], dest)) {
        return false;
    }
    // The note that contains this reference might override the pretty refs option
    // for references inside it.
    const containingNote = noteToRender;
    const shouldApplyPublishRules = utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(proc);
    let prettyRefs = common_all_1.ConfigUtils.getEnablePrettyRefs(config, {
        note: containingNote,
        shouldApplyPublishRules,
    }) ?? true;
    if (containingNote?.custom?.usePrettyRefs !== undefined &&
        lodash_1.default.isBoolean(containingNote.custom?.usePrettyRefs)) {
        prettyRefs = containingNote.custom.usePrettyRefs;
    }
    return prettyRefs;
}
const plugin = function (opts) {
    const procOptsV5 = utilsv5_1.MDUtilsV5.getProcOpts(this);
    attachParser(this);
    if (this.Compiler != null && !procOptsV5.parseOnly) {
        attachCompiler(this, opts);
    }
};
exports.noteRefsV2 = plugin;
function attachParser(proc) {
    function locator(value, fromIndex) {
        return value.indexOf("![[", fromIndex);
    }
    function inlineTokenizerV5(eat, value) {
        const procOpts = utilsv5_1.MDUtilsV5.getProcOpts(proc);
        const match = LINK_REGEX.exec(value);
        if (match) {
            const linkMatch = match[1].trim();
            if (procOpts?.mode === utilsv5_1.ProcMode.NO_DATA) {
                const link = utils_1.LinkUtils.parseNoteRefRaw(linkMatch);
                const { value } = utils_1.LinkUtils.parseLink(linkMatch);
                const refNote = {
                    type: types_1.DendronASTTypes.REF_LINK_V2,
                    data: {
                        link,
                    },
                    value,
                };
                return eat(match[0])(refNote);
            }
            else {
                const link = utils_1.LinkUtils.parseNoteRef(linkMatch);
                // If the link is same file [[#header]], it's implicitly to the same file it's located in
                if (link.from?.fname === "") {
                    link.from.fname = utilsv5_1.MDUtilsV5.getProcData(proc).fname;
                }
                const { value } = utils_1.LinkUtils.parseLink(linkMatch);
                const refNote = {
                    type: types_1.DendronASTTypes.REF_LINK_V2,
                    data: {
                        link,
                    },
                    value,
                };
                return eat(match[0])(refNote);
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
function attachCompiler(proc, _opts) {
    const Compiler = proc.Compiler;
    const visitors = Compiler.prototype.visitors;
    const { dest } = utilsv5_1.MDUtilsV5.getProcData(proc);
    if (visitors) {
        visitors.refLinkV2 = (node) => {
            const ndata = node.data;
            // converting to itself (used for doctor commands. preserve existing format)
            if (dest === types_1.DendronASTDest.MD_DENDRON) {
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
function convertNoteRefToHAST(opts) {
    const errors = [];
    const { link, proc, compilerOpts, procOpts } = opts;
    const procData = utilsv5_1.MDUtilsV5.getProcData(proc);
    const { noteRefLvl: refLvl } = procData;
    /**
     * Takes a note ref and processes it into HAST
     * @param ref DNoteLoc (note reference) to process
     * @param note actual note at the reference
     * @param fname fname (either from the actual note ref, or inferred.)
     * @returns process note references
     */
    function processRef(ref, note, fname) {
        try {
            if (shouldApplyPublishRules &&
                !SiteUtils_1.SiteUtils.canPublish({
                    note,
                    config: config,
                    wsRoot,
                    vaults,
                })) {
                // TODO: in the future, add 403 pages
                return (0, mdast_builder_1.paragraph)();
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
                if (useId === undefined &&
                    utilsv5_1.MDUtilsV5.isV5Active(proc) &&
                    dest === types_1.DendronASTDest.HTML) {
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
                if (dest === types_1.DendronASTDest.HTML) {
                    if (!utilsv5_1.MDUtilsV5.isV5Active(proc)) {
                        suffix = ".html";
                    }
                    if (note.custom?.permalink === "/") {
                        href = "";
                        suffix = "";
                    }
                    // check if we need to check publishign rules
                    if (utilsv5_1.MDUtilsV5.isV5Active(proc) &&
                        !utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(proc)) {
                        isPublished = true;
                    }
                    else {
                        isPublished = SiteUtils_1.SiteUtils.isPublished({
                            note,
                            config: config,
                            wsRoot,
                            vaults,
                        });
                    }
                }
                const linkString = isPublished
                    ? `"${wikiLinkOpts?.prefix || ""}${href}${suffix}"`
                    : undefined;
                const prettyHAST = renderPrettyHAST({
                    content: noteRefMDAST,
                    title,
                    link: linkString,
                });
                // publishing
                if (utilsv5_1.MDUtilsV5.getProcOpts(proc).flavor === common_all_1.ProcFlavor.PUBLISHING &&
                    !procData.insideNoteRef &&
                    config.dev?.enableExperimentalIFrameNoteRef === true) {
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
            }
            else {
                return (0, mdast_builder_1.paragraph)(noteRefMDAST);
            }
        }
        catch (err) {
            const msg = `Error rendering note reference for ${note?.fname}`;
            return __1.MdastUtils.genMDErrorMsg(msg);
        }
    }
    // prevent infinite nesting.
    if (refLvl >= MAX_REF_LVL) {
        return {
            error: new common_all_1.DendronError({ message: "too many nested note refs" }),
            data: [__1.MdastUtils.genMDErrorMsg("too many nested note refs")],
        };
    }
    // figure out configs that change how we process the note reference
    const { dest, config, vault: vaultFromProc, vaults, wsRoot, noteCacheForRenderDict, } = procData;
    const shouldApplyPublishRules = utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(proc);
    const { wikiLinkOpts } = compilerOpts;
    const prettyRefs = shouldRenderPretty({ proc });
    const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
    const duplicateNoteConfig = publishingConfig.duplicateNoteBehavior;
    // process note references.
    // let noteRefs: DNoteLoc[] = [];
    const vault = procData.vault;
    const noteRefs = gatherNoteRefs({
        link,
        vault,
        noteDicts: noteCacheForRenderDict,
    });
    if (link.from.fname.endsWith("*")) {
        if (noteRefs.length === 0) {
            const msg = `Error rendering note reference. There are no matches for \`${link.from.fname}\`.`;
            return { error: undefined, data: [__1.MdastUtils.genMDErrorMsg(msg)] };
        }
        const processedRefs = noteRefs.map((ref) => {
            const fname = ref.fname;
            let note;
            try {
                const noteIds = noteCacheForRenderDict?.notesByFname[fname];
                if (!noteIds) {
                    throw new common_all_1.DendronError({
                        message: `Unable to find note with fname ${fname} and vault ${vault.fsPath} for note reference`,
                    });
                }
                const noteCandidates = noteIds
                    .map((id) => noteCacheForRenderDict.notesById[id])
                    .filter((props) => common_all_1.VaultUtils.isEqualV2(props.vault, vault));
                if (noteCandidates.length !== 1) {
                    throw new common_all_1.DendronError({
                        message: `Unable to find note with fname ${fname} and vault ${vault.fsPath} for note reference`,
                    });
                }
                note = noteCandidates[0];
            }
            catch (err) {
                const msg = `error getting note..}`;
                return __1.MdastUtils.genMDMsg(msg);
            }
            return processRef(ref, note, fname);
        });
        return { error: undefined, data: processedRefs };
    }
    else {
        // single reference case.
        let note;
        // const { vaultName: vname } = link.data;
        const { fname } = link.from;
        let data;
        if (noteCacheForRenderDict) {
            data = common_all_1.NoteDictsUtils.findByFname({
                fname,
                noteDicts: noteCacheForRenderDict,
            });
            // data = NoteDictsUtils.findByFname(fname, noteCacheForRenderDict, vault);
        }
        if (!data || data.length === 0) {
            return {
                error: undefined,
                data: [
                    __1.MdastUtils.genMDErrorMsg(`No note with name ${fname} found in cache during parsing.`),
                ],
            };
        }
        if (data.length === 1) {
            note = data[0];
        }
        else if (data.length > 1) {
            // applying publish rules but no behavior defined for duplicate notes
            if (shouldApplyPublishRules && lodash_1.default.isUndefined(duplicateNoteConfig)) {
                return {
                    error: undefined,
                    data: [
                        __1.MdastUtils.genMDErrorMsg(`Error rendering note reference. There are multiple notes with the name ${link.from.fname}. Please specify the vault prefix.`),
                    ],
                };
            }
            // apply publish rules and do duplicate
            if (shouldApplyPublishRules && !lodash_1.default.isUndefined(duplicateNoteConfig)) {
                const maybeNote = SiteUtils_1.SiteUtils.handleDup({
                    dupBehavior: duplicateNoteConfig,
                    config,
                    vaults,
                    wsRoot,
                    fname: link.from.fname,
                    noteCandidates: data,
                    noteDict: noteCacheForRenderDict,
                });
                if (!maybeNote) {
                    return {
                        error: undefined,
                        data: [
                            __1.MdastUtils.genMDErrorMsg(`Error rendering note reference for ${link.from.fname}`),
                        ],
                    };
                }
                note = maybeNote;
            }
            else {
                // no need to apply publish rules, try to pick the one that is in same vault
                const _note = lodash_1.default.find(data, (note) => {
                    return common_all_1.VaultUtils.isEqual(note.vault, vaultFromProc, wsRoot);
                });
                if (_note) {
                    note = _note;
                }
                else {
                    note = data[0];
                }
            }
        }
        else {
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
function removeListItems({ nodes, remove, }) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < nodes.length; i++) {
        const list = nodes[i];
        const listItem = nodes[i + 1];
        if (list.ancestor.type !== types_1.DendronASTTypes.LIST)
            continue;
        if (lodash_1.default.isUndefined(listItem)) {
            console.error("Found a list that has a list anchor in it, but no list items");
            continue; // Should never happen, but let's try to render at least the whole list if it does
        }
        if (remove === "after-index") {
            list.ancestor.children = list.ancestor.children.slice(undefined, listItem.index + 1);
        }
        else {
            // keep === after-index
            list.ancestor.children = list.ancestor.children.slice(listItem.index, undefined);
        }
    }
}
/** For references like `#^item:#^item`, only include a single list item and not it's children. */
function removeExceptSingleItem(nodes) {
    let closestListItem;
    // Find the list item closest to the anchor
    lodash_1.default.forEach(nodes, ({ ancestor }) => {
        if (ancestor.type === types_1.DendronASTTypes.LIST_ITEM) {
            closestListItem = ancestor;
        }
    });
    if (lodash_1.default.isUndefined(closestListItem))
        return;
    // If this list item has any nested lists, remove them to get rid of the children
    closestListItem.children = closestListItem.children.filter((node) => !(node.type === types_1.DendronASTTypes.LIST));
}
/** If there are nested lists with a single item in them, replaces the outer single-item lists with the first multi-item list. */
function removeSingleItemNestedLists(nodes) {
    let outermost;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < nodes.length; i++) {
        const list = nodes[i];
        if (list.ancestor.type !== types_1.DendronASTTypes.LIST)
            continue;
        // Find the outermost list
        if (lodash_1.default.isUndefined(outermost)) {
            outermost = list;
            // If the outermost list has multiple children, we have nothing to do
            if (outermost.ancestor.children.length > 1)
                return;
            continue;
        }
        else {
            // Found the nested list which will replace the outermost one
            outermost.ancestor.children = list.ancestor.children;
            // The nested list is the new outermost now
            outermost = list;
            // If we found a list with multiple children, stop because we want to keep it
            if (outermost.ancestor.children.length > 1)
                return;
        }
    }
}
function prepareNoteRefIndices({ anchorStart, anchorEnd, bodyAST, makeErrorData, }) {
    const genErrorMsg = (anchorName, anchorType) => {
        return `${anchorType} anchor ${anchorName} not found`;
    };
    // TODO: can i just strip frontmatter when reading?
    let start = {
        type: "none",
        index: bodyAST.children[0]?.type === "yaml" ? 1 : 0,
    };
    let end = null;
    if (anchorStart) {
        start = findAnchor({
            nodes: bodyAST.children,
            match: anchorStart,
        });
        if (start?.type === "block-end") {
            return {
                data: makeErrorData("the '^end' anchor cannot be used as the starting anchor"),
                start: null,
                end: null,
                error: null,
            };
        }
        if (lodash_1.default.isNull(start)) {
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
        if (anchorEnd === "*" && lodash_1.default.isNull(end)) {
            end = {
                type: "header",
                index: nodes.length,
                anchorType: "header",
            };
        }
        if (lodash_1.default.isNull(end)) {
            return {
                data: makeErrorData(genErrorMsg(anchorEnd, "End")),
                start: null,
                end: null,
                error: null,
            };
        }
        end.index += start.index;
    }
    else if (start.type === "block") {
        // If no end is specified and the start is a block anchor referencing a block, the end is implicitly the end of the referenced block.
        end = { type: "block", index: start.index };
    }
    else if (start.type === "list") {
        // If no end is specified and the start is a block anchor in a list, the end is the list element referenced by the start.
        end = { ...start };
    }
    if (!anchorEnd &&
        // smart header ref
        (start.type === "header" ||
            // smart block
            start.type === "block-begin") &&
        start.node) {
        // if block-begin, accept header of any depth
        const startHeaderDepth = start.type === "header" ? start.node.depth : 99;
        // anchor end is next header that is smaller or equal
        const nodes = remark_1.RemarkUtils.extractHeaderBlock(bodyAST, startHeaderDepth, start.index, 
        // stop at first header
        start.type === "block-begin");
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
    if (end &&
        start &&
        end.type === "list" &&
        start.type === "list" &&
        anchorStart === anchorEnd) {
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
function convertNoteRefToMDAST(opts) {
    const { proc, refLvl, link, note } = opts;
    let noteRefProc;
    const { config, noteCacheForRenderDict } = utilsv5_1.MDUtilsV5.getProcData(proc);
    // Create a new proc to parse the reference; set the fname accordingly.
    // NOTE: a new proc is created here instead of using the proc() copy
    // constructor, as that is an expensive op since it deep clones the entire
    // engine state in proc.data
    noteRefProc = utilsv5_1.MDUtilsV5.procRemarkFull({
        ...utilsv5_1.MDUtilsV5.getProcData(proc),
        insideNoteRef: true,
        fname: note.fname,
        vault: note.vault,
        noteCacheForRenderDict,
        config,
    }, utilsv5_1.MDUtilsV5.getProcOpts(proc));
    noteRefProc = noteRefProc.data("fm", utilsv5_1.MDUtilsV5.getFM({ note }));
    utilsv5_1.MDUtilsV5.setNoteRefLvl(noteRefProc, refLvl);
    const bodyAST = noteRefProc.parse(note.body);
    // Make sure to get all footnote definitions, including ones not within the range, in case they are used inside the range
    const footnotes = remark_1.RemarkUtils.extractFootnoteDefs(bodyAST);
    const { anchorStart, anchorEnd, anchorStartOffset } = lodash_1.default.defaults(link.data, {
        anchorStartOffset: 0,
    });
    const { start, end, data, error } = prepareNoteRefIndices({
        anchorStart,
        anchorEnd,
        bodyAST,
        makeErrorData: (msg) => {
            return __1.MdastUtils.genMDMsg(msg);
        },
    });
    if (data)
        return { data, error };
    // slice of interested range
    try {
        const out = (0, mdast_builder_1.root)(bodyAST.children.slice((start ? start.index : 0) + anchorStartOffset, end ? end.index + 1 : undefined));
        // Add all footnote definitions back. We might be adding duplicates if the definition was already in range, but rendering handles this correctly.
        // We also might be adding definitions that weren't used in this range, but rendering will simply ignore those.
        out.children.push(...footnotes);
        const data = noteRefProc.runSync(out);
        return {
            error: null,
            data,
        };
    }
    catch (err) {
        return {
            error: new common_all_1.DendronError({
                message: "error processing note ref",
                payload: err,
            }),
            data: __1.MdastUtils.genMDMsg("error processing ref"),
        };
    }
}
/** Searches for anchors, then returns the index for the top-level ancestor.
 *
 * @param nodes The list of nodes to search through.
 * @param match The block anchor string, like "header-anchor" or "^block-anchor"
 * @returns The index of the top-level ancestor node in the list where the anchor was found, or -1 if not found.
 */
function findAnchor({ nodes, match, }) {
    if ((0, common_all_1.isBlockAnchor)(match)) {
        const anchorId = match.slice(1);
        if (isBeginBlockAnchorId(anchorId)) {
            return findBeginBlockAnchor({ nodes });
        }
        if (isEndBlockAnchorId(anchorId)) {
            return findEndBlockAnchor({ nodes });
        }
        return findBlockAnchor({ nodes, match: anchorId });
    }
    else {
        return __1.MdastUtils.findHeader({ nodes, match, slugger: (0, common_all_1.getSlugger)() });
    }
}
/**
 * Search for start of document and traverse until first header
 */
function findBeginBlockAnchor({ nodes }) {
    // TODO: error if no first node found
    const firstNode = nodes[0];
    return {
        type: "block-begin",
        index: 0,
        node: firstNode,
    };
}
/**
 * Search for end of document;
 */
function findEndBlockAnchor({ nodes }) {
    // TODO: error if no first node found
    const lastNode = lodash_1.default.last(nodes);
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
function findBlockAnchor({ nodes, match, }) {
    // Find the anchor in the nodes
    let foundIndex;
    let foundAncestors = [];
    __1.MdastUtils.visitParentsIndices({
        nodes,
        test: types_1.DendronASTTypes.BLOCK_ANCHOR,
        visitor: ({ node, index, ancestors }) => {
            // @ts-ignore
            if (node.id === match) {
                // found anchor!
                foundIndex = ancestors.length > 0 ? ancestors[0].index : index;
                foundAncestors = ancestors;
                return false; // stop traversal
            }
            return true; // continue traversal
        },
    });
    if (lodash_1.default.isUndefined(foundIndex))
        return null;
    if (!lodash_1.default.isEmpty(foundAncestors)) {
        if (foundAncestors[0].ancestor.children.length === 1 &&
            foundAncestors[0].ancestor.children[0].type ===
                types_1.DendronASTTypes.BLOCK_ANCHOR) {
            // If located by itself after a block, then the block anchor refers to the previous block
            return { type: "block", index: foundIndex - 1 };
        }
        if (foundAncestors[0].ancestor.type === types_1.DendronASTTypes.LIST) {
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
function getTitle(opts) {
    const { config, note, loc, shouldApplyPublishRules } = opts;
    const { alias, fname } = loc;
    const enableNoteTitleForLink = common_all_1.ConfigUtils.getEnableNoteTitleForLink(config, shouldApplyPublishRules);
    return enableNoteTitleForLink ? note.title : alias || fname || "no title";
}
const genRefAsIFrame = ({ link, noteId, content, title, config, prettyHAST, }) => {
    const refId = (0, utilsv5_1.getRefId)({ id: noteId, link });
    // cache it for later generation?
    utilsv5_1.MDUtilsV5.cacheRefId({
        refId: { id: noteId, link },
        mdast: content,
        prettyHAST,
    });
    const assetsPrefix = common_all_1.ConfigUtils.getPublishing(config).assetsPrefix ?? "";
    return (0, mdast_builder_1.paragraph)((0, mdast_builder_1.html)(`<iframe class="noteref-iframe" src="${assetsPrefix}/refs/${refId}" title="Reference to the note called ${title}">Your browser does not support iframes.</iframe>`));
};
/**
 *  Replace /notes/ with / and /asset-prefix1234/notes/ with /
 * ... unless /notes/notes
 */
function fixLinkIfRoot(link) {
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
function renderPrettyHAST(opts) {
    const { content, title } = opts;
    let { link } = opts;
    link = fixLinkIfRoot(link);
    const linkLine = lodash_1.default.isUndefined(link)
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
    return (0, mdast_builder_1.paragraph)([(0, mdast_builder_1.html)(top)].concat([content]).concat([(0, mdast_builder_1.html)(bottom)]));
}
//# sourceMappingURL=noteRefsV2.js.map