import { NotePropsByIdDict, NotePropsMeta } from "@dendronhq/common-all";
export declare class HierarchyUtils {
    /**
     * Get children of current note
     * @param opts.skipLevels: how many levels to skip for child
     * @returns
     */
    static getChildren: (opts: {
        skipLevels: number;
        note: NotePropsMeta;
        notes: NotePropsByIdDict;
    }) => import("@dendronhq/common-all").NoteProps[];
}
