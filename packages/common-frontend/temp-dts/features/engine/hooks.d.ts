import { TypedUseSelectorHook } from "react-redux";
import { EngineState, InitNoteOpts } from "./slice";
import { RootState } from "./store";
export declare const useEngineAppDispatch: () => import("redux").Dispatch<import("redux").AnyAction> & import("redux-thunk").ThunkDispatch<{
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
}, null, import("redux").AnyAction> & import("redux-thunk").ThunkDispatch<{
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
}, undefined, import("redux").AnyAction>;
export declare const useEngineAppSelector: TypedUseSelectorHook<RootState>;
/**
 * Check if engineState is initialized and initialize if not
 * @param engineState: current Engine State
 * @param opts.port?: workspace pot
 * @param opts.ws?: workspace root
 * @param opts.force?: always reinitialize
 */
export declare const useEngine: ({ engineState, opts, }: {
    engineState: EngineState;
    opts: Partial<InitNoteOpts> & {
        force?: boolean;
    };
}) => void;
/**
 * Reloads the Dendron Config
 * @param opts.port?: workspace pot
 * @param opts.ws?: workspace root
 */
export declare const useConfig: ({ opts, }: {
    opts: Partial<InitNoteOpts> & {
        force?: boolean;
    };
}) => void;
