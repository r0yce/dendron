declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    engine: {
        error: any;
        loading: import("../..").LoadingStatus;
        currentRequestId: string | undefined;
        noteFName: import("@dendronhq/common-all").NotePropsByFnameDict;
    } & Partial<import("@dendronhq/common-all").DEngineInitPayload> & Pick<import("@dendronhq/common-all").DEngineInitPayload, "notes" | "vaults"> & {
        schemas: import("@dendronhq/common-all").SchemaModuleDict;
    } & {
        notesRendered: {
            [key: string]: string | undefined;
        };
    };
}, import("redux").AnyAction, [import("redux-thunk").ThunkMiddleware<{
    engine: {
        error: any;
        loading: import("../..").LoadingStatus;
        currentRequestId: string | undefined;
        noteFName: import("@dendronhq/common-all").NotePropsByFnameDict;
    } & Partial<import("@dendronhq/common-all").DEngineInitPayload> & Pick<import("@dendronhq/common-all").DEngineInitPayload, "notes" | "vaults"> & {
        schemas: import("@dendronhq/common-all").SchemaModuleDict;
    } & {
        notesRendered: {
            [key: string]: string | undefined;
        };
    };
}, import("redux").AnyAction, null> | import("redux-thunk").ThunkMiddleware<{
    engine: {
        error: any;
        loading: import("../..").LoadingStatus;
        currentRequestId: string | undefined;
        noteFName: import("@dendronhq/common-all").NotePropsByFnameDict;
    } & Partial<import("@dendronhq/common-all").DEngineInitPayload> & Pick<import("@dendronhq/common-all").DEngineInitPayload, "notes" | "vaults"> & {
        schemas: import("@dendronhq/common-all").SchemaModuleDict;
    } & {
        notesRendered: {
            [key: string]: string | undefined;
        };
    };
}, import("redux").AnyAction>]>;
export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
