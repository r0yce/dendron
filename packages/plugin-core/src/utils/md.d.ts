import { DLink, DLinkType, DNoteAnchorBasic, DVault, NoteProps, NotePropsMeta } from "@dendronhq/common-all";
import { sort as sortPaths } from "cross-path-sort";
import vscode, { Location, TextDocument } from "vscode";
export type RefT = {
    label: string;
    /** If undefined, then the file this reference is located in is the ref */
    ref?: string | undefined;
    anchorStart?: DNoteAnchorBasic | undefined;
    anchorEnd?: DNoteAnchorBasic | undefined;
    vaultName?: string | undefined;
};
export type FoundRefT = {
    location: Location;
    matchText: string;
    isCandidate?: boolean | undefined;
    isFrontmatterTag?: boolean | undefined;
    note: NotePropsMeta;
};
export declare const refPattern = "(\\[\\[)([^\\[\\]]+?)(\\]\\])";
export declare const mdImageLinkPattern = "(\\[)([^\\[\\]]*)(\\]\\()([^\\[\\]]+?)(\\))";
export declare const REGEX_FENCED_CODE_BLOCK: RegExp;
export { sortPaths };
export declare const otherExts: string[];
export declare const imageExts: string[];
export declare const isUncPath: (path: string) => boolean;
export declare const containsOtherKnownExts: (pathParam: string) => boolean;
export declare class MarkdownUtils {
    static hasLegacyPreview(): boolean;
    static showLegacyPreview(): Thenable<unknown>;
}
export declare const isInFencedCodeBlock: (documentOrContent: TextDocument | string, lineNum: number) => boolean;
export declare const getURLAt: (editor: vscode.TextEditor | undefined) => string;
export declare const positionToOffset: (content: string, position: {
    line: number;
    column: number;
}) => number;
export declare const lineBreakOffsetsByLineIndex: (value: string) => number[];
export declare const isInCodeSpan: (documentOrContent: TextDocument | string, lineNum: number, offset: number) => boolean;
export type getReferenceAtPositionResp = {
    range: vscode.Range;
    ref: string;
    label: string;
    anchorStart?: DNoteAnchorBasic | undefined;
    anchorEnd?: DNoteAnchorBasic | undefined;
    refType?: DLinkType | undefined;
    vaultName?: string | undefined;
    /** The full text inside the ref, e.g. for [[alias|foo.bar#anchor]] this is alias|foo.bar#anchor */
    refText: string;
};
export declare function getReferenceAtPosition({ document, position, wsRoot, vaults, opts, }: {
    document: vscode.TextDocument;
    position: vscode.Position;
    wsRoot: string;
    vaults: DVault[];
    opts?: {
        partial?: boolean;
        allowInCodeBlocks: boolean;
    };
}): Promise<getReferenceAtPositionResp | null>;
export declare const parseRef: (rawRef: string) => RefT;
export declare const parseAnchor: (anchorValue?: string) => DNoteAnchorBasic | undefined;
export declare const containsUnknownExt: (pathParam: string) => boolean;
export declare const isLongRef: (path: string) => boolean;
export declare const containsNonMdExt: (ref: string) => boolean;
export declare const noteLinks2Locations: (note: NoteProps) => {
    location: Location;
    matchText: string;
    link: DLink;
}[];
export declare function findReferencesById(opts: {
    id: string;
    isLinkCandidateEnabled?: boolean | undefined;
}): Promise<FoundRefT[] | undefined>;
/**
 *  ^find-references
 * @param fname
 * @param excludePaths
 * @returns
 */
export declare const findReferences: (fname: string) => Promise<FoundRefT[]>;
export declare const containsMarkdownExt: (pathParam: string) => boolean;
export declare const trimLeadingSlash: (value: string) => string;
export declare const trimTrailingSlash: (value: string) => string;
export declare const trimSlashes: (value: string) => string;
export declare const normalizeSlashes: (value: string) => string;
export declare const fsPathToRef: ({ path: fsPath, keepExt, basePath, }: {
    path: string;
    keepExt?: boolean;
    basePath?: string;
}) => string | null;
export declare const containsImageExt: (pathParam: string) => boolean;
/**
 * This returns the line number of the '---' that concludes the frontmatter
 * section of a note. The line numbers are 1 indexed in the document. If the
 * frontmatter ending marker is not found, this returns undefined.
 * @param input
 * @returns
 */
export declare function getOneIndexedFrontmatterEndingLineNumber(input: string): number | undefined;
/**
 * Given a {@link FoundRefT} and a list of anchor names,
 * check if ref contains an anchor name to update.
 * @param ref
 * @param anchorNamesToUpdate
 * @returns
 */
export declare function hasAnchorsToUpdate(ref: FoundRefT, anchorNamesToUpdate: string[]): boolean;
