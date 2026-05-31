import { BulkGetNoteMetaResp, BulkGetNoteResp, BulkWriteNotesOpts, BulkWriteNotesResp, DeleteNoteResp, DEngineClient, DEngineInitResp, DHookDict, DVault, EngineDeleteOpts, EngineEventEmitter, EngineInfoResp, EngineSchemaWriteOpts, EngineWriteOptsV2, Event, FindNoteOpts, GetDecorationsOpts, GetDecorationsResp, GetNoteBlocksOpts, GetNoteBlocksResp, GetNoteMetaResp, GetNoteResp, GetSchemaResp, NoteChangeEntry, NoteProps, NotePropsMeta, QueryNotesOpts, QueryNotesResp, QuerySchemaResp, RenameNoteOpts, RenameNoteResp, RenderNoteOpts, RenderNoteResp, SchemaModuleProps, WriteNoteResp, WriteSchemaResp } from "@dendronhq/common-all";
import { IEngineAPIService } from "./EngineAPIServiceInterface";
export declare class EngineAPIService implements DEngineClient, IEngineAPIService, EngineEventEmitter {
    private _internalEngine;
    private _engineEventEmitter;
    private _trustedWorkspace;
    static createEngine({ port, enableWorkspaceTrust, vaults, wsRoot, }: {
        port: number | string;
        enableWorkspaceTrust?: boolean | undefined;
        vaults: DVault[];
        wsRoot: string;
    }): EngineAPIService;
    constructor({ engineClient, engineEvents, }: {
        engineClient: DEngineClient;
        engineEvents: EngineEventEmitter;
    });
    get onEngineNoteStateChanged(): Event<NoteChangeEntry[]>;
    dispose(): void;
    get trustedWorkspace(): boolean;
    set trustedWorkspace(value: boolean);
    get wsRoot(): string;
    set wsRoot(arg: string);
    get vaults(): DVault[];
    set vaults(arg: DVault[]);
    get hooks(): DHookDict;
    set hooks(arg: DHookDict);
    get engineEventEmitter(): EngineEventEmitter;
    /**
     * See {@link IEngineAPIService.getNote}
     */
    getNote(id: string): Promise<GetNoteResp>;
    /**
     * See {@link IEngineAPIService.getNote}
     */
    getNoteMeta(id: string): Promise<GetNoteMetaResp>;
    /**
     * See {@link IEngineAPIService.bulkGetNotes}
     */
    bulkGetNotes(ids: string[]): Promise<BulkGetNoteResp>;
    /**
     * See {@link IEngineAPIService.bulkGetNotesMeta}
     */
    bulkGetNotesMeta(ids: string[]): Promise<BulkGetNoteMetaResp>;
    /**
     * See {@link IEngineAPIService.findNotes}
     */
    findNotes(opts: FindNoteOpts): Promise<NoteProps[]>;
    /**
     * See {@link IEngineAPIService.findNotesMeta}
     */
    findNotesMeta(opts: FindNoteOpts): Promise<NotePropsMeta[]>;
    bulkWriteNotes(opts: BulkWriteNotesOpts): Promise<BulkWriteNotesResp>;
    writeNote(note: NoteProps, opts?: EngineWriteOptsV2 | undefined): Promise<WriteNoteResp>;
    writeSchema(schema: SchemaModuleProps, opts?: EngineSchemaWriteOpts): Promise<WriteSchemaResp>;
    init(): Promise<DEngineInitResp>;
    deleteNote(id: string, opts?: EngineDeleteOpts | undefined): Promise<DeleteNoteResp>;
    deleteSchema(id: string, opts?: EngineDeleteOpts | undefined): Promise<DEngineInitResp>;
    info(): Promise<EngineInfoResp>;
    getSchema(qs: string): Promise<GetSchemaResp>;
    querySchema(qs: string): Promise<QuerySchemaResp>;
    queryNotes(opts: QueryNotesOpts): Promise<QueryNotesResp>;
    renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp>;
    renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp>;
    getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksResp>;
    getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsResp>;
    /**
     * Setup telemetry tracking on engine events to understand user engagement
     * levels
     */
    private setupEngineAnalyticsTracking;
}
