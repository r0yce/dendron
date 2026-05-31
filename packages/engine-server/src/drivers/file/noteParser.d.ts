import { DEngineClient, DStore, DVault, IDendronError, NoteChangeEntry, NoteDicts, NoteProps, NotePropsByIdDict, NotesCacheEntryMap, DendronConfig, SchemaModuleDict } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import { ParserBase } from "./parseBase";
import { NotesFileSystemCache } from "../../cache/notesFileSystemCache";
export type FileMeta = {
    prefix: string;
    fpath: string;
};
export type FileMetaDict = {
    [key: string]: FileMeta[];
};
export declare class NoteParser extends ParserBase {
    opts: {
        store: DStore;
        cache: NotesFileSystemCache;
        engine: DEngineClient;
        logger: DLogger;
    };
    cache: NotesFileSystemCache;
    private engine;
    constructor(opts: {
        store: DStore;
        cache: NotesFileSystemCache;
        engine: DEngineClient;
        logger: DLogger;
    });
    parseFiles(allPaths: string[], vault: DVault, schemas: SchemaModuleDict, opts?: {
        useSQLiteMetadataStore?: boolean;
    }): Promise<{
        notesById: NotePropsByIdDict;
        cacheUpdates: NotesCacheEntryMap;
        errors: IDendronError[];
    }>;
    /**
     *
     * @param opts
     * @returns List of all notes added. If a note has no direct parents, stub notes are added instead
     */
    parseNoteProps(opts: {
        fileMeta: FileMeta;
        noteDicts?: NoteDicts;
        parents?: NoteProps[];
        addParent: boolean;
        createStubs?: boolean;
        vault: DVault;
        config: DendronConfig;
        errors: IDendronError[];
    }): Promise<{
        changeEntries: NoteChangeEntry[];
        noteHash: string;
        matchHash: boolean;
    }>;
    private file2NoteWithCache;
}
