import { BulkGetNoteMetaResp, BulkGetNoteResp, BulkWriteNotesOpts, DeleteNoteResp, DeleteSchemaResp, DendronAPI, DEngineClient, DEngineInitResp, DHookDict, DVault, EngineDeleteOpts, EngineEventEmitter, EngineInfoResp, EngineSchemaWriteOpts, EngineWriteOptsV2, Event, FindNoteOpts, FuseEngine, GetDecorationsOpts, GetDecorationsResp, GetNoteBlocksOpts, GetNoteBlocksResp, GetNoteMetaResp, GetNoteResp, GetSchemaResp, NoteChangeEntry, NoteProps, NotePropsByFnameDict, NotePropsByIdDict, NotePropsMeta, QueryNotesOpts, QuerySchemaResp, RenameNoteOpts, RenameNoteResp, RenderNoteOpts, SchemaModuleProps, WriteNoteResp, WriteSchemaResp, QueryNotesResp } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import { HistoryService } from "./history";
type DendronEngineClientOpts = {
    vaults: DVault[];
    ws: string;
};
export declare class DendronEngineClient implements DEngineClient, EngineEventEmitter {
    private _onNoteChangedEmitter;
    private _config;
    notes: NotePropsByIdDict;
    noteFnames: NotePropsByFnameDict;
    wsRoot: string;
    ws: string;
    fuseEngine: FuseEngine;
    api: DendronAPI;
    vaults: DVault[];
    history?: HistoryService;
    logger: DLogger;
    hooks: DHookDict;
    static create({ port, vaults, ws, history, logger, }: {
        port: number | string;
        history?: HistoryService;
        logger?: DLogger;
    } & DendronEngineClientOpts): DendronEngineClient;
    static getPort({ wsRoot }: {
        wsRoot: string;
    }): number;
    constructor({ api, vaults, ws, history, logger, }: {
        api: DendronAPI;
        history?: HistoryService;
        logger?: DLogger;
    } & DendronEngineClientOpts);
    /**
     * Event that fires upon the changing of note state in the engine after a set
     * of NoteProps has been changed AND those changes have been reflected on the
     * engine side. Note creation, deletion, and updates are all fired from this
     * event.
     */
    get onEngineNoteStateChanged(): Event<NoteChangeEntry[]>;
    dispose(): void;
    /**
     * Load all nodes
     */
    init(): Promise<DEngineInitResp>;
    /**
     * See {@link DStore.getNote}
     */
    getNote(id: string): Promise<GetNoteResp>;
    getNoteMeta(id: string): Promise<GetNoteMetaResp>;
    /**
     * See {@link DEngine.bulkGetNotes}
     * TODO: remove this.notes
     */
    bulkGetNotes(ids: string[]): Promise<BulkGetNoteResp>;
    /**
     * See {@link DEngine.bulkGetNotesMeta}
     * TODO: remove this.notes
     */
    bulkGetNotesMeta(ids: string[]): Promise<BulkGetNoteMetaResp>;
    /**
     * See {@link DStore.findNotes}
     */
    findNotes(opts: FindNoteOpts): Promise<NoteProps[]>;
    /**
     * See {@link DStore.findNotesMeta}
     */
    findNotesMeta(opts: FindNoteOpts): Promise<NotePropsMeta[]>;
    bulkWriteNotes(opts: BulkWriteNotesOpts): Promise<import("@dendronhq/common-all").BulkWriteNotesResp>;
    deleteNote(id: string, opts?: EngineDeleteOpts): Promise<DeleteNoteResp>;
    deleteSchema(id: string, opts?: EngineDeleteOpts): Promise<DeleteSchemaResp>;
    info(): Promise<EngineInfoResp>;
    queryNotes(opts: QueryNotesOpts): Promise<QueryNotesResp>;
    renderNote(opts: RenderNoteOpts): Promise<import("@dendronhq/common-all").RenderNoteResp>;
    refreshNotesV2(notes: NoteChangeEntry[]): Promise<void>;
    /** Renames the note.
     *
     *  WARNING: When doing bulk operations. Do not invoke multiple requests to this
     *  command in parallel, wait for a single call to finish before requesting another call.
     *  Otherwise some race condition starts to cause intermittent failures.
     *  */
    renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp>;
    sync(): Promise<DEngineInitResp>;
    writeNote(note: NoteProps, opts?: EngineWriteOptsV2): Promise<WriteNoteResp>;
    getSchema(id: string): Promise<GetSchemaResp>;
    querySchema(qs: string): Promise<QuerySchemaResp>;
    writeSchema(schema: SchemaModuleProps, opts?: EngineSchemaWriteOpts): Promise<WriteSchemaResp>;
    getNoteBlocks({ id, filterByAnchorType, }: GetNoteBlocksOpts): Promise<GetNoteBlocksResp>;
    getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsResp>;
}
export {};
