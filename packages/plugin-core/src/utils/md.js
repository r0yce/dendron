"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsImageExt = exports.fsPathToRef = exports.normalizeSlashes = exports.trimSlashes = exports.trimTrailingSlash = exports.trimLeadingSlash = exports.containsMarkdownExt = exports.findReferences = exports.noteLinks2Locations = exports.containsNonMdExt = exports.isLongRef = exports.containsUnknownExt = exports.parseAnchor = exports.parseRef = exports.isInCodeSpan = exports.lineBreakOffsetsByLineIndex = exports.positionToOffset = exports.getURLAt = exports.isInFencedCodeBlock = exports.MarkdownUtils = exports.containsOtherKnownExts = exports.isUncPath = exports.imageExts = exports.otherExts = exports.sortPaths = exports.REGEX_FENCED_CODE_BLOCK = exports.mdImageLinkPattern = exports.refPattern = void 0;
exports.getReferenceAtPosition = getReferenceAtPosition;
exports.findReferencesById = findReferencesById;
exports.getOneIndexedFrontmatterEndingLineNumber = getOneIndexedFrontmatterEndingLineNumber;
exports.hasAnchorsToUpdate = hasAnchorsToUpdate;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
const cross_path_sort_1 = require("cross-path-sort");
Object.defineProperty(exports, "sortPaths", { enumerable: true, get: function () { return cross_path_sort_1.sort; } });
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const markdownExtRegex = /\.md$/i;
exports.refPattern = "(\\[\\[)([^\\[\\]]+?)(\\]\\])";
exports.mdImageLinkPattern = "(\\[)([^\\[\\]]*)(\\]\\()([^\\[\\]]+?)(\\))";
const partialRefPattern = "(\\[\\[)([^\\[\\]]+)";
exports.REGEX_FENCED_CODE_BLOCK = /^( {0,3}|\t)```[^`\r\n]*$[\w\W]+?^( {0,3}|\t)``` *$/gm;
const REGEX_CODE_SPAN = /`[^`]*?`/gm;
// export const RE_WIKI_LINK_ALIAS = "([^\\[\\]]+?\\|)?";
// const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
//   const isDocsAutocomplete = linePrefix.match(/\[\[\w*$/);
const uncPathRegex = /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/; // eslint-disable-line no-useless-escape
exports.otherExts = [
    "doc",
    "docx",
    "rtf",
    "txt",
    "odt",
    "xls",
    "xlsx",
    "ppt",
    "pptm",
    "pptx",
    "pdf",
    "pages",
    "mp4",
    "mov",
    "wmv",
    "flv",
    "avi",
    "mkv",
    "mp3",
    "webm",
    "wav",
    "m4a",
    "ogg",
    "3gp",
    "flac",
];
exports.imageExts = ["png", "jpg", "jpeg", "svg", "gif", "webp"];
const imageExtsRegex = new RegExp(`[.](${exports.imageExts.join("|")})$`, "i");
const isUncPath = (path) => uncPathRegex.test(path);
exports.isUncPath = isUncPath;
const otherExtsRegex = new RegExp(`[.](${exports.otherExts.join("|")})$`, "i");
const containsOtherKnownExts = (pathParam) => !!otherExtsRegex.exec(path_1.default.parse(pathParam).ext);
exports.containsOtherKnownExts = containsOtherKnownExts;
class MarkdownUtils {
    static hasLegacyPreview() {
        return !lodash_1.default.isUndefined(vscode_1.extensions.getExtension("dendron.dendron-markdown-preview-enhanced"));
    }
    static showLegacyPreview() {
        return vscode_1.commands.executeCommand("markdown-preview-enhanced.openPreview");
    }
}
exports.MarkdownUtils = MarkdownUtils;
const isInFencedCodeBlock = (documentOrContent, lineNum) => {
    const content = typeof documentOrContent === "string"
        ? documentOrContent
        : documentOrContent.getText();
    const textBefore = content
        .slice(0, (0, exports.positionToOffset)(content, { line: lineNum, column: 0 }))
        .replace(exports.REGEX_FENCED_CODE_BLOCK, "")
        .replace(/<!--[\W\w]+?-->/g, "");
    // So far `textBefore` should contain no valid fenced code block or comment
    return /^( {0,3}|\t)```[^`\r\n]*$[\w\W]*$/gm.test(textBefore);
};
exports.isInFencedCodeBlock = isInFencedCodeBlock;
const getURLAt = (editor) => {
    if (editor) {
        const docText = editor.document.getText();
        const offsetStart = editor.document.offsetAt(editor.selection.start);
        const offsetEnd = editor.document.offsetAt(editor.selection.end);
        const selectedText = docText.substring(offsetStart, offsetEnd);
        const selectUri = true;
        const validUriChars = "A-Za-z0-9-._~:/?#@!$&'*+,;%=\\\\";
        const invalidUriChars = ["[^", validUriChars, "]"].join("");
        const regex = new RegExp(invalidUriChars);
        if (selectedText !== "" && regex.test(selectedText)) {
            return "";
        }
        const leftSplit = docText.substring(0, offsetStart).split(regex);
        const leftText = leftSplit[leftSplit.length - 1];
        const selectStart = offsetStart - leftText.length;
        const rightSplit = docText.substring(offsetEnd, docText.length);
        const rightText = rightSplit.substring(0, regex.exec(rightSplit)?.index);
        const selectEnd = offsetEnd + rightText.length;
        if (selectEnd && selectStart) {
            if (selectStart >= 0 &&
                selectStart < selectEnd &&
                selectEnd <= docText.length) {
                if (selectUri) {
                    editor.selection = new vscode_1.Selection(editor.document.positionAt(selectStart), editor.document.positionAt(selectEnd));
                    editor.revealRange(editor.selection);
                }
                return [leftText, selectedText, rightText].join("");
            }
        }
    }
    return "";
};
exports.getURLAt = getURLAt;
const positionToOffset = (content, position) => {
    if (position.line < 0) {
        throw new Error("Illegal argument: line must be non-negative");
    }
    if (position.column < 0) {
        throw new Error("Illegal argument: column must be non-negative");
    }
    const lineBreakOffsetsByIndex = (0, exports.lineBreakOffsetsByLineIndex)(content);
    if (lineBreakOffsetsByIndex[position.line] !== undefined) {
        return ((lineBreakOffsetsByIndex[position.line - 1] || 0) + position.column || 0);
    }
    return 0;
};
exports.positionToOffset = positionToOffset;
const lineBreakOffsetsByLineIndex = (value) => {
    const result = [];
    let index = value.indexOf("\n");
    while (index !== -1) {
        result.push(index + 1);
        index = value.indexOf("\n", index + 1);
    }
    result.push(value.length + 1);
    return result;
};
exports.lineBreakOffsetsByLineIndex = lineBreakOffsetsByLineIndex;
const isInCodeSpan = (documentOrContent, lineNum, offset) => {
    const content = typeof documentOrContent === "string"
        ? documentOrContent
        : documentOrContent.getText();
    const textBefore = content
        .slice(0, (0, exports.positionToOffset)(content, { line: lineNum, column: offset }))
        .replace(REGEX_CODE_SPAN, "")
        .trim();
    return /`[^`]*$/gm.test(textBefore);
};
exports.isInCodeSpan = isInCodeSpan;
async function getReferenceAtPosition({ document, position, wsRoot, vaults, opts, }) {
    let refType;
    if (opts?.allowInCodeBlocks !== true &&
        ((0, exports.isInFencedCodeBlock)(document, position.line) ||
            (0, exports.isInCodeSpan)(document, position.line, position.character))) {
        return null;
    }
    // check if image
    const rangeForImage = document.getWordRangeAtPosition(position, new RegExp(exports.mdImageLinkPattern));
    if (rangeForImage) {
        const docText = document.getText(rangeForImage);
        const maybeImage = lodash_1.default.trim(docText.match("\\((.*)\\)")[0], "()");
        if ((0, exports.containsImageExt)(maybeImage)) {
            return null;
        }
    }
    // this should be a wikilink or reference
    const re = opts?.partial ? partialRefPattern : exports.refPattern;
    const rangeWithLink = document.getWordRangeAtPosition(position, new RegExp(re));
    // didn't find a ref
    // check if it is a user tag, a regular tag, or a frontmatter tag
    if (!rangeWithLink) {
        const { enableUserTags, enableHashTags } = common_all_1.ConfigUtils.getWorkspace(ExtensionProvider_1.ExtensionProvider.getDWorkspace().config);
        if (enableHashTags) {
            // if not, it could be a hashtag
            const rangeForHashTag = document.getWordRangeAtPosition(position, unified_1.HASHTAG_REGEX_BASIC);
            if (rangeForHashTag) {
                const docText = document.getText(rangeForHashTag);
                const match = docText.match(unified_1.HASHTAG_REGEX_LOOSE);
                if (lodash_1.default.isNull(match))
                    return null;
                return {
                    range: rangeForHashTag,
                    label: match[0],
                    ref: `${common_all_1.TAGS_HIERARCHY}${match.groups.tagContents}`,
                    refText: docText,
                    refType: "hashtag",
                };
            }
        }
        if (enableUserTags) {
            // if not, it could be a user tag
            const rangeForUserTag = document.getWordRangeAtPosition(position, unified_1.USERTAG_REGEX_LOOSE);
            if (rangeForUserTag) {
                const docText = document.getText(rangeForUserTag);
                const match = docText.match(unified_1.USERTAG_REGEX_LOOSE);
                if (lodash_1.default.isNull(match))
                    return null;
                return {
                    range: rangeForUserTag,
                    label: match[0],
                    ref: `${common_all_1.USERS_HIERARCHY}${match.groups.userTagContents}`,
                    refText: docText,
                    refType: "usertag",
                };
            }
        }
        // if not, it could be a frontmatter tag
        // only parse if this is a dendron note
        if (!(await engine_server_1.WorkspaceUtils.isDendronNote({
            wsRoot,
            vaults,
            fpath: document.uri.fsPath,
        }))) {
            return null;
        }
        const maybeTags = unified_1.RemarkUtils.extractFMTags(document.getText());
        if (!lodash_1.default.isEmpty(maybeTags)) {
            for (const tag of maybeTags) {
                // Offset 1 for the starting `---` line of frontmatter
                const tagPos = vsCodeUtils_1.VSCodeUtils.position2VSCodeRange(tag.position, {
                    line: 1,
                });
                if (tagPos.start.line <= position.line &&
                    position.line <= tagPos.end.line &&
                    tagPos.start.character <= position.character &&
                    position.character <= tagPos.end.character) {
                    tag.value = lodash_1.default.trim(tag.value);
                    return {
                        range: tagPos,
                        label: tag.value,
                        ref: `${common_all_1.TAGS_HIERARCHY}${tag.value}`,
                        refText: tag.value,
                        refType: "fmtag",
                    };
                }
            }
        }
        // it's not a wikilink, reference, or a hashtag. Nothing to do here.
        return null;
    }
    const docText = document.getText(rangeWithLink);
    const refText = docText
        .replace("![[", "")
        .replace("[[", "")
        .replace("]]", "");
    // don't incldue surrounding fluff for definition
    const { ref, label, anchorStart, anchorEnd, vaultName } = (0, exports.parseRef)(refText);
    const startChar = rangeWithLink.start.character;
    // because
    const prefixRange = new vscode_1.Range(new vscode_1.Position(rangeWithLink.start.line, Math.max(0, startChar - 1)), new vscode_1.Position(rangeWithLink.start.line, startChar + 2));
    const prefix = document.getText(prefixRange);
    if (prefix.indexOf("![[") >= 0) {
        refType = "refv2";
    }
    else if (prefix.indexOf("[[") >= 0) {
        refType = "wiki";
    }
    return {
        // If ref is missing, it's implicitly the current file
        ref: ref || common_all_1.NoteUtils.uri2Fname(document.uri),
        label,
        range: rangeWithLink,
        anchorStart,
        anchorEnd,
        refType,
        vaultName,
        refText,
    };
}
const parseRef = (rawRef) => {
    const parsed = unified_1.LinkUtils.parseNoteRef(rawRef);
    if (lodash_1.default.isNull(parsed))
        throw new Error(`Unable to parse reference ${rawRef}`);
    const { fname, alias } = parsed.from;
    const { anchorStart, anchorEnd, vaultName } = parsed.data;
    return {
        label: alias || "",
        ref: fname,
        anchorStart: (0, exports.parseAnchor)(anchorStart),
        anchorEnd: (0, exports.parseAnchor)(anchorEnd),
        vaultName,
    };
};
exports.parseRef = parseRef;
const parseAnchor = (anchorValue) => {
    // If undefined or empty string
    if (!anchorValue)
        return undefined;
    if ((0, common_all_1.isBlockAnchor)(anchorValue)) {
        return { type: "block", value: anchorValue.slice(1) };
    }
    else if ((0, common_all_1.isLineAnchor)(anchorValue)) {
        const value = anchorValue.slice(1);
        return {
            type: "line",
            value,
            line: lodash_1.default.toInteger(value),
        };
    }
    else {
        return { type: "header", value: anchorValue };
    }
};
exports.parseAnchor = parseAnchor;
const containsUnknownExt = (pathParam) => path_1.default.parse(pathParam).ext !== "" &&
    !(0, exports.containsMarkdownExt)(pathParam) &&
    !(0, exports.containsImageExt)(pathParam) &&
    !(0, exports.containsOtherKnownExts)(pathParam);
exports.containsUnknownExt = containsUnknownExt;
const isLongRef = (path) => path.split("/").length > 1;
exports.isLongRef = isLongRef;
const containsNonMdExt = (ref) => {
    return ((0, exports.containsImageExt)(ref) ||
        (0, exports.containsOtherKnownExts)(ref) ||
        (0, exports.containsUnknownExt)(ref));
};
exports.containsNonMdExt = containsNonMdExt;
const noteLinks2Locations = (note) => {
    const refs = [];
    const linksMatch = note.links.filter((l) => l.type !== "backlink");
    const fsPath = common_all_1.NoteUtils.getFullPath({
        note,
        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
    });
    const fileContent = fs_1.default.readFileSync(fsPath).toString();
    const fmOffset = getFrontmatterEndingOffsetPosition(fileContent) ?? 0;
    linksMatch.forEach((link) => {
        const startOffset = link.position?.start.offset || 0;
        const lines = fileContent.slice(0, fmOffset + startOffset).split("\n");
        const lineNum = lines.length;
        refs.push({
            location: new vscode_1.default.Location(vscode_1.default.Uri.file(fsPath), new vscode_1.default.Range(new vscode_1.default.Position(lineNum, 0), new vscode_1.default.Position(lineNum + 1, 0))),
            matchText: lines.slice(-1)[0] || "",
            link,
        });
    });
    return refs;
};
exports.noteLinks2Locations = noteLinks2Locations;
async function findReferencesById(opts) {
    const { id, isLinkCandidateEnabled } = opts;
    const refs = [];
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const note = (await engine.getNoteMeta(id)).data;
    if (!note) {
        return;
    }
    let notesWithRefs;
    if (isLinkCandidateEnabled) {
        const engineNotes = await engine.findNotesMeta({ excludeStub: true });
        notesWithRefs = common_all_1.NoteUtils.getNotesWithLinkTo({
            note,
            notes: engineNotes,
        });
    }
    else {
        const notesRefIds = lodash_1.default.uniq(note.links
            .filter((link) => link.type === "backlink")
            .map((link) => link.from.id)
            .filter(common_all_1.isNotUndefined));
        notesWithRefs = (await engine.bulkGetNotesMeta(notesRefIds)).data;
    }
    lodash_1.default.forEach(notesWithRefs, (noteWithRef) => {
        const linksMatch = noteWithRef.links.filter((l) => l.to?.fname?.toLowerCase() === note.fname.toLowerCase());
        const fsPath = common_all_1.NoteUtils.getFullPath({
            note: noteWithRef,
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        if (!fs_1.default.existsSync(fsPath)) {
            return;
        }
        const fileContent = fs_1.default.readFileSync(fsPath).toString();
        const fmOffset = getFrontmatterEndingOffsetPosition(fileContent) ?? 0;
        linksMatch.forEach((link) => {
            const endOffset = link.position?.end.offset;
            let lines;
            if (endOffset) {
                lines = fileContent.slice(0, fmOffset + endOffset + 1).split("\n");
            }
            else {
                const fmLine = getOneIndexedFrontmatterEndingLineNumber(fileContent) || 0;
                const allLines = fileContent.split("\n");
                const index = link.position?.end.line ?? allLines.length;
                lines = allLines.slice(0, index + fmLine);
            }
            const lineNum = lines.length;
            let range;
            switch (link.type) {
                case "frontmatterTag":
                    // -2 in lineNum so that it targets the end of the frontmatter
                    range = new vscode_1.default.Range(new vscode_1.default.Position(lineNum - 2, (link.position?.start.column || 1) - 1), new vscode_1.default.Position(lineNum - 2, (link.position?.end.column || 1) - 1));
                    break;
                default:
                    range = new vscode_1.default.Range(new vscode_1.default.Position(lineNum - 1, (link.position?.start.column || 1) - 1), new vscode_1.default.Position(lineNum - 1, (link.position?.end.column || 1) - 1));
            }
            const location = new vscode_1.default.Location(vscode_1.default.Uri.file(fsPath), range);
            const foundRef = {
                location,
                matchText: lines.slice(-1)[0] || "",
                note: noteWithRef,
            };
            if (link.type === "linkCandidate") {
                foundRef.isCandidate = true;
            }
            else if (link.type === "frontmatterTag") {
                foundRef.isFrontmatterTag = true;
            }
            refs.push(foundRef);
        });
    });
    return refs;
}
/**
 *  ^find-references
 * @param fname
 * @param excludePaths
 * @returns
 */
const findReferences = async (fname) => {
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    // clean for anchor
    const notes = await engine.findNotesMeta({ fname });
    const all = Promise.all(notes.map((noteProps) => findReferencesById({ id: noteProps.id })));
    return all.then((results) => {
        const arrays = lodash_1.default.compact(results);
        return lodash_1.default.concat(...arrays);
    });
};
exports.findReferences = findReferences;
const containsMarkdownExt = (pathParam) => !!markdownExtRegex.exec(path_1.default.parse(pathParam).ext);
exports.containsMarkdownExt = containsMarkdownExt;
const trimLeadingSlash = (value) => value.replace(/^\/+|^\\+/g, "");
exports.trimLeadingSlash = trimLeadingSlash;
const trimTrailingSlash = (value) => value.replace(/\/+$|\\+$/g, "");
exports.trimTrailingSlash = trimTrailingSlash;
const trimSlashes = (value) => (0, exports.trimLeadingSlash)((0, exports.trimTrailingSlash)(value));
exports.trimSlashes = trimSlashes;
const normalizeSlashes = (value) => value.replace(/\\/gi, "/");
exports.normalizeSlashes = normalizeSlashes;
const fsPathToRef = ({ path: fsPath, keepExt, basePath, }) => {
    const ref = basePath && fsPath.startsWith(basePath)
        ? (0, exports.normalizeSlashes)(fsPath.replace(basePath, ""))
        : path_1.default.basename(fsPath);
    if (keepExt) {
        return (0, exports.trimLeadingSlash)(ref);
    }
    return (0, exports.trimLeadingSlash)(ref.includes(".") ? ref.slice(0, ref.lastIndexOf(".")) : ref);
};
exports.fsPathToRef = fsPathToRef;
const containsImageExt = (pathParam) => !!imageExtsRegex.exec(path_1.default.parse(pathParam).ext);
exports.containsImageExt = containsImageExt;
/**
 * This returns the offset of the first character AFTER the ending frontmatter
 *  --- line. This function assumes there won't be a `\n---\n` key inside the
 *  frontmatter. Offset is 0 indexed.
 * @param input
 * @returns
 */
function getFrontmatterEndingOffsetPosition(input) {
    const frontMatterEndingStringPattern = "\n---";
    const offset = input.indexOf(frontMatterEndingStringPattern);
    if (offset < 0) {
        return undefined;
    }
    return offset + frontMatterEndingStringPattern.length;
}
/**
 * This returns the line number of the '---' that concludes the frontmatter
 * section of a note. The line numbers are 1 indexed in the document. If the
 * frontmatter ending marker is not found, this returns undefined.
 * @param input
 * @returns
 */
function getOneIndexedFrontmatterEndingLineNumber(input) {
    const offset = getFrontmatterEndingOffsetPosition(input);
    if (!offset) {
        return undefined;
    }
    return (lodash_1.default.countBy(input.slice(0, offset))["\n"] || 0) + 1;
}
/**
 * Given a {@link FoundRefT} and a list of anchor names,
 * check if ref contains an anchor name to update.
 * @param ref
 * @param anchorNamesToUpdate
 * @returns
 */
function hasAnchorsToUpdate(ref, anchorNamesToUpdate) {
    const matchText = ref.matchText;
    const wikiLinkRegEx = /\[\[(?<text>.+?)\]\]/;
    const wikiLinkMatch = wikiLinkRegEx.exec(matchText);
    if (wikiLinkMatch && wikiLinkMatch.groups?.text) {
        let processed = wikiLinkMatch.groups.text;
        if (processed.includes("|")) {
            const [_alias, link] = processed.split("|");
            processed = link || processed;
        }
        if (processed.includes("#")) {
            const [_fname, anchor] = processed.split("#");
            const a = anchor; // guarded by includes("#")
            if (a.startsWith("^")) {
                return anchorNamesToUpdate.includes(a.substring(1));
            }
            return anchorNamesToUpdate.includes(a);
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
//# sourceMappingURL=md.js.map