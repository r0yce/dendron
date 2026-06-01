import { DEngineInitPayload, NotePropsByFnameDict, SchemaModuleDict } from "@dendronhq/common-all";
export declare enum LoadingStatus {
    IDLE = "idle",
    PENDING = "pending",
    FULFILLED = "fulfilled"
}
export type EngineSliceState = {
    error: any;
    loading: LoadingStatus;
    currentRequestId: string | undefined;
    noteFName: NotePropsByFnameDict;
} & Partial<DEngineInitPayload> & Pick<DEngineInitPayload, "notes" | "vaults"> & {
    schemas: SchemaModuleDict;
};
export declare function verifyEngineSliceState(opts: Partial<EngineSliceState>): opts is Required<EngineSliceState>;
export type WorkspaceProps = {
    url: string;
    ws: string;
    theme?: string;
    /**
     * workspace loaded through browser
     */
    browser?: boolean;
};
