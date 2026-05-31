import { DVault, IDendronError, NoteDicts } from "@dendronhq/common-all";
import { URI } from "vscode-uri";
export declare class NoteParserV2 {
    private wsRoot;
    constructor(wsRoot: URI);
    /**
     * Construct in-memory
     *
     * @param allPaths
     * @param vault
     * @returns
     */
    parseFiles(allPaths: string[], vault: DVault): Promise<{
        noteDicts: NoteDicts;
        errors: IDendronError[];
    }>;
    /**
     * Given a fpath, convert to NoteProp
     * Update parent/children metadata if parents = true
     *
     * @returns List of all notes changed. If a note has no direct parents, stub notes are added instead
     */
    private parseNoteProps;
    /**
     * Given a fpath, attempt to convert raw file contents into a NoteProp
     *
     * Look up metadata from cache. If contenthash hasn't changed, use metadata from cache.
     * Otherwise, reconstruct metadata from scratch
     *
     * @returns NoteProp associated with fpath
     */
    private file2NoteWithCache;
}
