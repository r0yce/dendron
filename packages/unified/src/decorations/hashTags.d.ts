import { DendronConfig, NoteProps, Position, ReducedDEngine } from "@dendronhq/common-all";
import { HashTag } from "../types";
import { Decorator } from "./utils";
import { DecorationWikilink } from "./wikilinks";
export type DecorationHashTag = DecorationWikilink & {
    color?: string;
};
export declare function isDecorationHashTag(decoration: DecorationWikilink): decoration is DecorationHashTag;
export declare const decorateHashTag: Decorator<HashTag, DecorationHashTag>;
export declare function decorateTag({ fname, engine, position, lineOffset, config, note, }: {
    fname: string;
    engine: ReducedDEngine;
    position: Position;
    lineOffset?: number;
    config: DendronConfig;
    note?: NoteProps;
}): Promise<{
    errors: import("@dendronhq/common-all").IDendronError[];
    decorations: DecorationHashTag[];
}>;
