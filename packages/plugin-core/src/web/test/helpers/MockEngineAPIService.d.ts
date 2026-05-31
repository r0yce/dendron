import { BulkGetNoteMetaResp, BulkGetNoteResp, BulkWriteNotesResp, BulkWriteNotesOpts, DeleteNoteResp, EngineDeleteOpts, EngineWriteOptsV2, FindNoteOpts, NoteProps, NotePropsMeta, QueryNotesOpts, QueryNotesResp, RenameNoteOpts, RenameNoteResp, RespV3, WriteNoteResp, type ReducedDEngine } from "@dendronhq/common-all";
export declare class MockEngineAPIService implements ReducedDEngine {
    private store;
    wsRoot: string;
    constructor();
    init(): Promise<void>;
    getNote(id: string): Promise<RespV3<NoteProps>>;
    getNoteMeta(id: string): Promise<RespV3<NotePropsMeta>>;
    bulkGetNotes(_ids: string[]): Promise<BulkGetNoteResp>;
    bulkGetNotesMeta(_ids: string[]): Promise<BulkGetNoteMetaResp>;
    findNotes(_opts: FindNoteOpts): Promise<NoteProps[]>;
    findNotesMeta(_opts: FindNoteOpts): Promise<NotePropsMeta[]>;
    bulkWriteNotes(_opts: BulkWriteNotesOpts): Promise<BulkWriteNotesResp>;
    writeNote(_note: NoteProps, _opts?: EngineWriteOptsV2 | undefined): Promise<WriteNoteResp>;
    deleteNote(_id: string, _opts?: EngineDeleteOpts | undefined): Promise<DeleteNoteResp>;
    renameNote(_opts: RenameNoteOpts): Promise<RenameNoteResp>;
    queryNotes(_opts: QueryNotesOpts): Promise<QueryNotesResp>;
}
