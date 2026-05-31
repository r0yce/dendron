import { DendronError, DNoteRefLink } from "@dendronhq/common-all";
import { Heading } from "mdast";
import Unified, { Plugin } from "unified";
import { Node, Parent } from "unist";
import { DendronASTNode } from "../types";
import { ParentWithIndex } from "../utils";
import { WikiLinksOpts } from "./wikiLinks";
type PluginOpts = CompilerOpts;
type CompilerOpts = {
    prettyRefs?: boolean;
    wikiLinkOpts?: WikiLinksOpts;
};
type ConvertNoteRefOpts = {
    link: DNoteRefLink;
    proc: Unified.Processor;
    compilerOpts: CompilerOpts;
};
export declare class NoteRefUtils {
    static dnodeRefLink2String(link: DNoteRefLink): string;
}
export declare function isBeginBlockAnchorId(anchorId: string): anchorId is "begin";
export declare function isEndBlockAnchorId(anchorId: string): anchorId is "end";
declare const plugin: Plugin;
/**
 * This exists because {@link dendronPub} converts note refs using the AST
 */
export declare function convertNoteRefToHAST(opts: ConvertNoteRefOpts & {
    procOpts: any;
}): {
    error: DendronError | undefined;
    data: Parent[] | undefined;
};
export declare function prepareNoteRefIndices<T>({ anchorStart, anchorEnd, bodyAST, makeErrorData, }: {
    anchorStart?: string;
    anchorEnd?: string;
    bodyAST: DendronASTNode;
    makeErrorData: (msg: string) => T;
}): {
    start: FindAnchorResult;
    end: FindAnchorResult;
    data: T | null;
    error: any;
};
type FindAnchorResult = {
    type: "block";
    index: number;
    anchorType?: "block";
    node?: Node;
} | {
    type: "header";
    index: number;
    anchorType?: "header";
    node?: Heading;
} | {
    type: "block-begin";
    index: number;
    node: Node;
} | {
    type: "block-end";
    index: number;
    node: Node;
} | {
    type: "list";
    index: number;
    ancestors: ParentWithIndex[];
    anchorType?: "block";
} | {
    type: "none";
    index: number;
} | null;
export { plugin as noteRefsV2 };
export { PluginOpts as NoteRefsOptsV2 };
