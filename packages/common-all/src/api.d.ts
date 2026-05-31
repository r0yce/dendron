import { AxiosInstance } from "axios";
import { BulkGetNoteMetaResp, BulkGetNoteResp, BulkWriteNotesOpts, DNodeProps, EngineDeleteOpts, EngineInfoResp, EngineWriteOptsV2, FindNotesMetaResp, GetNoteMetaResp, GetNoteResp, RenameNoteOpts, SchemaModuleProps, WriteNoteResp } from ".";
import { ThemeTarget, ThemeType } from "./constants";
import { DendronCompositeError, DendronError } from "./error";
import { BulkWriteNotesResp, DeleteNoteResp, DeleteSchemaResp, DEngineInitResp, EngineSchemaWriteOpts, FindNotesResp, GetDecorationsResp, GetNoteBlocksResp, GetSchemaResp, QueryNotesResp, QuerySchemaResp, RenameNoteResp, RenderNoteOpts, RenderNoteResp, RespV3, VSRange, WriteSchemaResp, DendronConfig } from "./types";
import { DVault } from "./types/DVault";
import { FindNoteOpts } from "./types/FindNoteOpts";
export type APIRequest<T> = {
    ws: string;
} & T;
export declare function createNoOpLogger(): {
    level: string;
    debug: (_msg: any) => void;
    info: (_msg: any) => void;
    error: (_msg: any) => void;
};
interface IRequestArgs {
    headers: any;
}
export interface IAPIPayload {
    data: undefined | any | any[];
    error: undefined | DendronError | DendronCompositeError;
}
interface IAPIOpts {
    endpoint: string;
    apiPath: string;
    _request: AxiosInstance;
    logger: any;
    statusHandlers: any;
    onAuth: (opts: IRequestArgs) => Promise<any>;
    onBuildHeaders: (opts: IRequestArgs) => Promise<any>;
    onError: (opts: {
        err: DendronError;
        body: any;
        resp: any;
        headers: any;
        qs: any;
        path: string;
        method: string;
    }) => any;
}
type IAPIConstructor = {
    endpoint: string;
    apiPath: string;
} & Partial<IAPIOpts>;
interface IDoRequestArgs {
    path: string;
    auth?: boolean;
    qs?: any;
    body?: any;
    method?: "get" | "post";
    json?: boolean;
}
export type WorkspaceInitRequest = {
    uri: string;
    config: {
        vaults: DVault[];
    };
};
export type WorkspaceSyncRequest = WorkspaceRequest;
export type WorkspaceRequest = {
    ws: string;
};
export type EngineGetNoteRequest = {
    id: string;
} & WorkspaceRequest;
export type EngineBulkGetNoteRequest = {
    ids: string[];
} & WorkspaceRequest;
export type EngineRenameNoteRequest = RenameNoteOpts & {
    ws: string;
};
export type EngineWriteRequest = {
    node: DNodeProps;
    opts?: EngineWriteOptsV2;
} & {
    ws: string;
};
export type EngineDeleteRequest = {
    id: string;
    opts?: EngineDeleteOpts;
} & {
    ws: string;
};
export type EngineBulkAddRequest = {
    opts: BulkWriteNotesOpts;
} & {
    ws: string;
};
export type NoteQueryRequest = {
    qs: string;
    vault?: DVault;
} & Partial<WorkspaceRequest>;
export type GetNoteBlocksRequest = {
    id: string;
    filterByAnchorType?: "header" | "block";
} & WorkspaceRequest;
export type GetDecorationsRequest = {
    id: string;
    ranges: {
        range: VSRange;
        text: string;
    }[];
    text: string;
} & Partial<WorkspaceRequest>;
export type SchemaDeleteRequest = {
    id: string;
    opts?: EngineDeleteOpts;
} & Partial<WorkspaceRequest>;
export type SchemaReadRequest = {
    id: string;
} & Partial<WorkspaceRequest>;
export type SchemaQueryRequest = {
    qs: string;
} & Partial<WorkspaceRequest>;
export type SchemaWriteRequest = {
    schema: SchemaModuleProps;
    opts?: EngineSchemaWriteOpts;
} & WorkspaceRequest;
export type AssetGetRequest = {
    fpath: string;
} & WorkspaceRequest;
export type AssetGetThemeRequest = {
    themeTarget: ThemeTarget;
    themeType: ThemeType;
} & WorkspaceRequest;
export declare class APIUtils {
    /** Generate a localhost url to this API.
     *
     * Warning! In VSCode, the generated URL won't work if the user has a remote
     * workspace. You'll need to use `vscode.env.asExternalUri` to make it remote.
     */
    static getLocalEndpoint(port: number): string;
}
declare abstract class API {
    opts: IAPIOpts;
    constructor(opts: IAPIConstructor);
    _log(msg: any, lvl?: "info" | "debug" | "error" | "fatal"): void;
    _createPayload(data: any): {
        data: any;
    };
    _doRequest({ auth, qs, path, body, method, json, }: IDoRequestArgs): Promise<import("axios").AxiosResponse<any, any, {}>>;
    _makeRequest<T extends IAPIPayload>(args: IDoRequestArgs, payloadData?: T["data"]): Promise<T>;
    _makeRequestRaw(args: IDoRequestArgs): Promise<any>;
}
export declare class DendronAPI extends API {
    static getOrCreate(opts: IAPIConstructor): DendronAPI;
    static instance(): DendronAPI;
    assetGet(req: AssetGetRequest): Promise<DendronError | Buffer>;
    assetGetTheme(req: AssetGetThemeRequest): Promise<DendronError | Buffer>;
    configGet(req: WorkspaceRequest): Promise<RespV3<DendronConfig>>;
    workspaceInit(req: WorkspaceInitRequest): Promise<DEngineInitResp>;
    workspaceSync(req: WorkspaceSyncRequest): Promise<DEngineInitResp>;
    engineBulkAdd(req: EngineBulkAddRequest): Promise<BulkWriteNotesResp>;
    engineDelete(req: EngineDeleteRequest): Promise<DeleteNoteResp>;
    engineInfo(): Promise<EngineInfoResp>;
    engineRenameNote(req: EngineRenameNoteRequest): Promise<RenameNoteResp>;
    engineWrite(req: EngineWriteRequest): Promise<WriteNoteResp>;
    noteGet(req: EngineGetNoteRequest): Promise<GetNoteResp>;
    noteGetMeta(req: EngineGetNoteRequest): Promise<GetNoteMetaResp>;
    noteBulkGet(req: EngineBulkGetNoteRequest): Promise<BulkGetNoteResp>;
    noteBulkGetMeta(req: EngineBulkGetNoteRequest): Promise<BulkGetNoteMetaResp>;
    noteFind(req: APIRequest<FindNoteOpts>): Promise<RespV3<FindNotesResp>>;
    noteFindMeta(req: APIRequest<FindNoteOpts>): Promise<RespV3<FindNotesMetaResp>>;
    noteQuery(req: NoteQueryRequest): Promise<RespV3<QueryNotesResp>>;
    noteRender(req: APIRequest<RenderNoteOpts>): Promise<RenderNoteResp>;
    getNoteBlocks(req: GetNoteBlocksRequest): Promise<GetNoteBlocksResp>;
    getDecorations(req: GetDecorationsRequest): Promise<GetDecorationsResp>;
    schemaDelete(req: SchemaDeleteRequest): Promise<DeleteSchemaResp>;
    schemaRead(req: SchemaReadRequest): Promise<GetSchemaResp>;
    schemaQuery(req: SchemaQueryRequest): Promise<QuerySchemaResp>;
    schemaWrite(req: SchemaWriteRequest): Promise<WriteSchemaResp>;
}
export declare const DendronApiV2: typeof DendronAPI;
export {};
