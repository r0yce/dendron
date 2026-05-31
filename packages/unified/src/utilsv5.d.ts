import { DNoteRefLink, DVault, DendronConfig, NoteDicts, NotePropsMeta, OptionalExceptFor, ProcFlavor } from "@dendronhq/common-all";
import remark from "remark";
import { Processor } from "unified";
import { BacklinkOpts } from "./remark/backlinksHover";
import { DendronPubOpts } from "./remark/dendronPub";
import { WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTDest, UnistNode } from "./types";
import { Parent } from "unist";
export { ProcFlavor };
/**
 * What mode a processor should run in
 */
export declare enum ProcMode {
    /**
     * Expect no properties from {@link ProcDataFullV5} when running the processor
     */
    NO_DATA = "NO_DATA",
    /**
     * Expect all properties from {@link ProcDataFullV5} when running the processor
     */
    FULL = "all data",
    /**
     * Running processor in import mode. Notes don't exist. Used for import pods like {@link MarkdownPod}
     * where notes don't exist in the engine prior to import.
     */
    IMPORT = "IMPORT"
}
/**
 * Options for how processor should function
 */
export type ProcOptsV5 = {
    /**
     * Determines what information is passed in to `Proc`
     */
    mode: ProcMode;
    /**
     * Don't attach compiler if `parseOnly`
     */
    parseOnly?: boolean;
    /**
     * Are we using specific variant of processor
     */
    flavor?: ProcFlavor;
};
/**
 * Data to initialize the processor
 */
export type ProcDataFullOptsV5 = {
    vault: DVault;
    fname: string;
    dest: DendronASTDest;
    config: DendronConfig;
    vaults?: DVault[];
    /**
     * Check to see if we are in a note reference.
     */
    insideNoteRef?: boolean;
    /**
     * frontmatter variables exposed for substitution
     */
    fm?: any;
    wikiLinksOpts?: WikiLinksOpts;
    publishOpts?: DendronPubOpts;
    backlinkHoverOpts?: BacklinkOpts;
    wsRoot?: string;
    noteToRender: NotePropsMeta;
    noteCacheForRenderDict?: NoteDicts;
};
/**
 * Data from the processor
 */
export type ProcDataFullV5 = {
    vault: DVault;
    fname: string;
    dest: DendronASTDest;
    wsRoot: string;
    vaults: DVault[];
    config: DendronConfig;
    insideNoteRef?: boolean;
    fm?: any;
    /**
     * Keep track of current note ref level
     */
    noteRefLvl: number;
    noteToRender: NotePropsMeta;
    noteCacheForRenderDict?: NoteDicts;
};
export type NoteRefId = {
    id: string;
    link: DNoteRefLink;
};
export type SerializedNoteRef = {
    node: UnistNode;
    refId: NoteRefId;
    prettyHAST: any;
};
type RefCache = Record<string, SerializedNoteRef>;
export declare class MDUtilsV5 {
    static getRefsRoot: (wsRoot: string) => string;
    /**
     * Write ref
     * @param param1
     */
    static cacheRefId({ refId, mdast, prettyHAST, }: {
        refId: NoteRefId;
        mdast: Parent;
        prettyHAST: any;
    }): void;
    static clearRefCache(): void;
    static getRefCache(): RefCache;
    static getProcOpts(proc: Processor): ProcOptsV5;
    static getProcData(proc: Processor): ProcDataFullV5;
    static setNoteRefLvl(proc: Processor, lvl: number): Processor<import("unified").Settings>;
    static setProcData(proc: Processor, opts: Partial<ProcDataFullV5>): Processor<import("unified").Settings>;
    static setProcOpts(proc: Processor, opts: ProcOptsV5): Processor<import("unified").Settings>;
    static isV5Active(proc: Processor): boolean;
    static shouldApplyPublishingRules(proc: Processor): boolean;
    static getFM(opts: {
        note: NotePropsMeta;
    }): any;
    /**
     * Used for processing a Dendron markdown note
     */
    static _procRemark(opts: ProcOptsV5, data: OptionalExceptFor<ProcDataFullOptsV5, "config">): Processor<remark.PartialRemarkOptions>;
    static _procRehype(opts: ProcOptsV5, data: Omit<ProcDataFullOptsV5, "dest">): Processor<remark.PartialRemarkOptions>;
    static procRemarkFull(data: ProcDataFullOptsV5, opts?: {
        mode?: ProcMode;
        flavor?: ProcFlavor;
    }): Processor<remark.PartialRemarkOptions>;
    /**
     * Parse Dendron Markdown Note. No compiler is attached.
     * @param opts
     * @param data
     * @returns
     */
    static procRemarkParse(opts: ProcOptsV5, data: OptionalExceptFor<ProcDataFullOptsV5, "config">): Processor<remark.PartialRemarkOptions>;
    /**
     * Equivalent to running {@link procRemarkParse({mode: ProcMode.NO_DATA})}
     *
     * Warning! When using a no-data parser, any user configuration will not be
     * available. Avoid using it unless you are sure that the user configuration
     * has no effect on what you are doing.
     */
    static procRemarkParseNoData(opts: Omit<ProcOptsV5, "mode" | "parseOnly">, data: Partial<ProcDataFullOptsV5> & {
        dest: DendronASTDest;
    }): Processor<remark.PartialRemarkOptions>;
    /**
     * Equivalent to running {@link procRemarkParse({mode: ProcMode.FULL})}
     */
    static procRemarkParseFull(opts: Omit<ProcOptsV5, "mode" | "parseOnly">, data: ProcDataFullOptsV5): Processor<remark.PartialRemarkOptions>;
    static procRehypeFull(data: Omit<ProcDataFullOptsV5, "dest">, opts?: {
        flavor?: ProcFlavor;
    }): Processor<remark.PartialRemarkOptions>;
}
export declare const getRefId: ({ link, id }: {
    link: DNoteRefLink;
    id: string;
}) => string;
