import { DEngineInitPayload, NoteProps, NotePropsByIdDict, DendronConfig, SchemaModuleDict } from "@dendronhq/common-all";
import { PayloadAction } from "@reduxjs/toolkit";
import { EngineSliceState } from "../../types";
/**
 * Equivalent to engine.init
 */
export declare const initNotes: import("@reduxjs/toolkit").AsyncThunk<import("@dendronhq/common-all").DEngineInitResp, {
    url: string;
    ws: string;
}, {}>;
/**
 * Syncs the Dendron config from the engine
 */
export declare const syncConfig: import("@reduxjs/toolkit").AsyncThunk<import("@dendronhq/common-all").RespV3ErrorResp | import("@dendronhq/common-all").RespV3SuccessResp<DendronConfig>, {
    url: string;
    ws: string;
}, {}>;
export declare const syncNote: import("@reduxjs/toolkit").AsyncThunk<import("@dendronhq/common-all").RespV3ErrorResp | import("@dendronhq/common-all").RespV3SuccessResp<import("@dendronhq/common-all").QueryNotesResp>, {
    url: string;
    ws: string;
    note: NoteProps;
}, {}>;
export declare const renderNote: import("@reduxjs/toolkit").AsyncThunk<import("@dendronhq/common-all").RespV3ErrorResp | import("@dendronhq/common-all").RespV3SuccessResp<string>, {
    url: string;
    ws: string;
    id: string;
    note?: NoteProps;
}, {}>;
export type InitNoteOpts = Parameters<typeof initNotes>[0];
type InitializedState = EngineSliceState & {
    notesRendered: {
        [key: string]: string | undefined;
    };
};
export type EngineState = InitializedState;
export declare const engineSlice: import("@reduxjs/toolkit").Slice<InitializedState, {
    setFromInit: (state: import("immer/dist/internal").WritableDraft<InitializedState>, action: PayloadAction<DEngineInitPayload & {
        schemas: SchemaModuleDict;
    }>) => void;
    setConfig: (state: import("immer/dist/internal").WritableDraft<InitializedState>, action: PayloadAction<DendronConfig>) => void;
    setNotes: (state: import("immer/dist/internal").WritableDraft<InitializedState>, action: PayloadAction<NotePropsByIdDict>) => void;
    setError: (state: import("immer/dist/internal").WritableDraft<InitializedState>, action: PayloadAction<any>) => void;
    /**
     * Reset all state
     */
    tearDown: (state: import("immer/dist/internal").WritableDraft<InitializedState>) => void;
    setRenderNote: (state: import("immer/dist/internal").WritableDraft<InitializedState>, action: PayloadAction<{
        id: string;
        body: string;
    }>) => void;
    updateNote: (state: import("immer/dist/internal").WritableDraft<InitializedState>, action: PayloadAction<NoteProps>) => void;
}, "engine">;
export declare const setNotes: import("@reduxjs/toolkit").ActionCreatorWithPayload<NotePropsByIdDict, string>, setError: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, string>, setFromInit: import("@reduxjs/toolkit").ActionCreatorWithPayload<DEngineInitPayload & {
    schemas: SchemaModuleDict;
}, string>, setConfig: import("@reduxjs/toolkit").ActionCreatorWithPayload<DendronConfig, string>, setRenderNote: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    body: string;
}, string>, updateNote: import("@reduxjs/toolkit").ActionCreatorWithPayload<NoteProps, string>, tearDown: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>;
export declare const reducer: import("redux").Reducer<InitializedState>;
export {};
