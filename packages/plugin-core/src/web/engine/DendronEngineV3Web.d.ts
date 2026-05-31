import { DeleteNoteResp, DVault, EngineDeleteOpts, EngineEventEmitter, EngineV3Base, EngineWriteOptsV2, Event, IFileStore, INoteStore, NoteChangeEntry, NoteProps, ReducedDEngine, RenameNoteResp, RespV2, WriteNoteResp } from "@dendronhq/common-all";
import { URI } from "vscode-uri";
export declare class DendronEngineV3Web extends EngineV3Base implements ReducedDEngine, EngineEventEmitter {
    private fileStore;
    private _onNoteChangedEmitter;
    private wsRootURI;
    constructor(wsRootURI: URI, vaults: DVault[], fileStore: IFileStore, // TODO: Engine shouldn't be aware of FileStore. Currently still needed because of Init Logic
    noteStore: INoteStore<string>);
    get onEngineNoteStateChanged(): Event<NoteChangeEntry[]>;
    dispose(): void;
    /**
     * Does not throw error but returns it
     */
    init(): Promise<RespV2<any>>;
    renameNote(): Promise<RenameNoteResp>;
    writeNote(note: NoteProps, opts?: EngineWriteOptsV2): Promise<WriteNoteResp>;
    writeSchema(): Promise<void>;
    deleteNote(id: string, opts?: EngineDeleteOpts | undefined): Promise<DeleteNoteResp>;
    private initNotesNew;
    /**
     * Create and add backlinks from all notes with a link pointing to another note
     */
    private addBacklinks;
    /**
     * Recursively search through fname to find next available ancestor note.
     *
     * E.g, if fpath = "baz.foo.bar", search for "baz.foo", then "baz", then "root" until first valid note is found
     * @param fpath of note to find ancestor of
     * @param vault of ancestor note
     * @returns closest ancestor note
     */
    private findClosestAncestor;
}
