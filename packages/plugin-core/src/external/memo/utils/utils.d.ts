import { sort as sortPaths } from "cross-path-sort";
import vscode, { TextDocument } from "vscode";
import { RefT, WorkspaceCache } from "../types";
export { sortPaths };
export declare const REGEX_FENCED_CODE_BLOCK: RegExp;
export declare const containsMarkdownExt: (pathParam: string) => boolean;
export declare const refPattern = "(\\[\\[)([^\\[\\]]+?)(\\]\\])";
export declare const findUriByRef: (uris: vscode.Uri[], ref: string) => vscode.Uri | undefined;
export declare const lineBreakOffsetsByLineIndex: (value: string) => number[];
export declare const positionToOffset: (content: string, position: {
    line: number;
    column: number;
}) => number;
export declare const getFileUrlForMarkdownPreview: (filePath: string) => string;
export declare const isInFencedCodeBlock: (documentOrContent: TextDocument | string, lineNum: number) => boolean;
export declare const trimLeadingSlash: (value: string) => string;
export declare const normalizeSlashes: (value: string) => string;
export declare const fsPathToRef: ({ path: fsPath, keepExt, basePath, }: {
    path: string;
    keepExt?: boolean;
    basePath?: string;
}) => string | null;
export declare const getWorkspaceFolder: () => string | undefined;
export declare const parseRef: (rawRef: string) => RefT;
export declare const cacheWorkspace: () => Promise<void>;
export declare const cacheRefs: () => Promise<void>;
export declare const findDanglingRefsByFsPath: (uris: vscode.Uri[]) => Promise<{
    [key: string]: string[];
}>;
export declare const extractDanglingRefs: (content: string) => string[];
export declare const getWorkspaceCache: () => WorkspaceCache;
export declare const matchAll: (pattern: RegExp, text: string) => Array<RegExpMatchArray>;
export declare const replaceRefs: ({ refs, content, onMatch, onReplace, }: {
    refs: {
        old: string;
        new: string;
    }[];
    content: string;
    onMatch?: () => void;
    onReplace?: () => void;
}) => string | null;
