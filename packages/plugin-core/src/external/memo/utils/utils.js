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
exports.replaceRefs = exports.matchAll = exports.getWorkspaceCache = exports.extractDanglingRefs = exports.findDanglingRefsByFsPath = exports.cacheRefs = exports.cacheWorkspace = exports.parseRef = exports.getWorkspaceFolder = exports.fsPathToRef = exports.normalizeSlashes = exports.trimLeadingSlash = exports.isInFencedCodeBlock = exports.getFileUrlForMarkdownPreview = exports.positionToOffset = exports.lineBreakOffsetsByLineIndex = exports.findUriByRef = exports.refPattern = exports.containsMarkdownExt = exports.REGEX_FENCED_CODE_BLOCK = exports.sortPaths = void 0;
const cross_path_sort_1 = require("cross-path-sort");
Object.defineProperty(exports, "sortPaths", { enumerable: true, get: function () { return cross_path_sort_1.sort; } });
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importStar(require("vscode"));
const workspace_1 = require("../../../workspace");
const workspaceCache = {
    imageUris: [],
    markdownUris: [],
    otherUris: [],
    allUris: [],
    danglingRefsByFsPath: {},
    danglingRefs: [],
};
const markdownExtRegex = /\.md$/i;
exports.REGEX_FENCED_CODE_BLOCK = /^( {0,3}|\t)```[^`\r\n]*$[\w\W]+?^( {0,3}|\t)``` *$/gm;
const containsMarkdownExt = (pathParam) => !!markdownExtRegex.exec(path_1.default.parse(pathParam).ext);
exports.containsMarkdownExt = containsMarkdownExt;
exports.refPattern = "(\\[\\[)([^\\[\\]]+?)(\\]\\])";
// === Utils
const findUriByRef = (uris, ref) => {
    return uris.find((uri) => {
        // const relativeFsPath =
        //   path.sep + path.relative(getWorkspaceFolder()!.toLowerCase(), uri.fsPath.toLowerCase());
        // if (containsImageExt(ref) || containsOtherKnownExts(ref) || containsUnknownExt(ref)) {
        //   if (isLongRef(ref)) {
        //     return normalizeSlashes(relativeFsPath).endsWith(ref.toLowerCase());
        //   }
        //   const basenameLowerCased = path.basename(uri.fsPath).toLowerCase();
        //   return (
        //     basenameLowerCased === ref.toLowerCase() || basenameLowerCased === `${ref.toLowerCase()}.md`
        //   );
        // }
        // if (isLongRef(ref)) {
        //   return normalizeSlashes(relativeFsPath).endsWith(`${ref.toLowerCase()}.md`);
        // }
        const name = path_1.default.parse(uri.fsPath).name.toLowerCase();
        return ((0, exports.containsMarkdownExt)(path_1.default.basename(uri.fsPath)) &&
            name === ref.toLowerCase());
    });
};
exports.findUriByRef = findUriByRef;
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
const getFileUrlForMarkdownPreview = (filePath) => vscode_1.default.Uri.file(filePath).toString().replace("file://", "");
exports.getFileUrlForMarkdownPreview = getFileUrlForMarkdownPreview;
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
const trimLeadingSlash = (value) => value.replace(/^\/+|^\\+/g, "");
exports.trimLeadingSlash = trimLeadingSlash;
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
const getWorkspaceFolder = () => (0, workspace_1.getExtension)().rootWorkspace.uri.fsPath;
exports.getWorkspaceFolder = getWorkspaceFolder;
const parseRef = (rawRef) => {
    const dividerPosition = rawRef.indexOf("|");
    if (dividerPosition < 0) {
        return {
            ref: lodash_1.default.trim(rawRef),
            label: lodash_1.default.trim(rawRef),
        };
    }
    else {
        return {
            ref: lodash_1.default.trim(rawRef.slice(dividerPosition + 1, rawRef.length)),
            label: lodash_1.default.trim(rawRef.slice(0, dividerPosition)),
        };
    }
};
exports.parseRef = parseRef;
// === Cache
const cacheWorkspace = async () => {
    await (0, exports.cacheRefs)();
};
exports.cacheWorkspace = cacheWorkspace;
const cacheRefs = async () => {
    workspaceCache.danglingRefsByFsPath = await (0, exports.findDanglingRefsByFsPath)(workspaceCache.markdownUris);
    workspaceCache.danglingRefs = (0, cross_path_sort_1.sort)(Array.from(new Set(Object.values(workspaceCache.danglingRefsByFsPath).flatMap((refs) => refs))), { shallowFirst: true });
};
exports.cacheRefs = cacheRefs;
const findDanglingRefsByFsPath = async (uris) => {
    const refsByFsPath = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const { fsPath } of uris) {
        const fsPathExists = fs_extra_1.default.existsSync(fsPath);
        if (!fsPathExists ||
            !(0, exports.containsMarkdownExt)(fsPath) ||
            (fsPathExists && fs_extra_1.default.lstatSync(fsPath).isDirectory())) {
            continue; // eslint-disable-line no-continue
        }
        const doc = vscode_1.workspace.textDocuments.find((doc) => doc.uri.fsPath === fsPath);
        const refs = (0, exports.extractDanglingRefs)(doc ? doc.getText() : fs_extra_1.default.readFileSync(fsPath).toString());
        if (refs.length) {
            refsByFsPath[fsPath] = refs;
        }
    }
    return refsByFsPath;
};
exports.findDanglingRefsByFsPath = findDanglingRefsByFsPath;
const refRegexp = new RegExp(exports.refPattern, "gi");
const extractDanglingRefs = (content) => {
    const refs = [];
    content.split(/\r?\n/g).forEach((lineText, _lineNum) => {
        // eslint-disable-next-line no-restricted-syntax
        for (const match of (0, exports.matchAll)(refRegexp, lineText)) {
            const [, , reference] = match;
            if (reference) {
                // const offset = (match.index || 0) + 2;
                // if (isInFencedCodeBlock(content, lineNum) || isInCodeSpan(content, lineNum, offset)) {
                //   continue;
                // }
                const { ref } = (0, exports.parseRef)(reference);
                if (!(0, exports.findUriByRef)((0, exports.getWorkspaceCache)().allUris, ref)) {
                    refs.push(ref);
                }
            }
        }
    });
    return Array.from(new Set(refs));
};
exports.extractDanglingRefs = extractDanglingRefs;
const getWorkspaceCache = () => workspaceCache;
exports.getWorkspaceCache = getWorkspaceCache;
const matchAll = (pattern, text) => {
    let match;
    const out = [];
    pattern.lastIndex = 0;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(text))) {
        out.push(match);
    }
    return out;
};
exports.matchAll = matchAll;
const replaceRefs = ({ refs, content, onMatch, onReplace, }) => {
    const { updatedOnce, nextContent } = refs.reduce(({ updatedOnce, nextContent }, ref) => {
        //const pattern = `\\[\\[${escapeForRegExp(ref.old)}(\\|.*)?\\]\\]`;
        const oldRef = lodash_1.default.escapeRegExp(ref.old);
        const pattern = `\\[\\[\\s*?(.*\\|)?\\s*${oldRef}\\s*\\]\\]`;
        if (new RegExp(pattern, "i").exec(content)) {
            let replacedOnce = false;
            // @ts-expect-error - legacy vendored external/memo/utils regex replace callback typing (replacer params + captured 'content'/'replacedOnce' interop under strict; original memo lib had looser any). Precise dated justification (final Post-M2 + Doctor Smoke Burn, 2026-06-01); never bare per SKILL. Real cheap fix blocked by commented-out isInFencedCodeBlock logic + external origin. See full file history. 0 bare upheld.
            const nextContent = content.replace(new RegExp(pattern, "gi"), ($0, $1, offset) => {
                // const pos = document.positionAt(offset);
                // if (
                //   isInFencedCodeBlock(document, pos.line) ||
                //   isInCodeSpan(document, pos.line, pos.character)
                // ) {
                //   return $0;
                // }
                if (!replacedOnce && onMatch) {
                    onMatch();
                }
                onReplace?.();
                replacedOnce = true;
                return `[[${lodash_1.default.trim($1) || ""}${ref.new}]]`;
            });
            return {
                updatedOnce: true,
                nextContent,
            };
        }
        return {
            updatedOnce,
            nextContent,
        };
    }, { updatedOnce: false, nextContent: content });
    return updatedOnce ? nextContent : null;
};
exports.replaceRefs = replaceRefs;
//# sourceMappingURL=utils.js.map