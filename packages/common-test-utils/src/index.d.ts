import { DVault, NoteOpts, NoteProps, NotePropsByIdDict, SchemaModuleOpts, SchemaModuleProps, SchemaProps, WorkspaceOpts, WorkspaceVault } from "@dendronhq/common-all";
import { PreSetupHookFunctionV4 } from "./types";
export * from "./fileUtils";
export * from "./noteUtils";
export * from "./presets";
export * from "./types";
export * from "./utils";
export * from "./utilsv2";
export declare function filterDotFiles(filenames: string[]): string[];
export declare function getLogFilePath(_name: string): string;
type InitVaultFunc = (vaultPath: string) => void;
export type SetupVaultOpts = {
    vaultDir?: string;
    initDirCb?: (vaultPath: string) => void;
    withAssets?: boolean;
    withGit?: boolean;
};
export type SetupWSOpts = {
    initDirCb?: (vaultPath: string) => void;
    withAssets?: boolean;
    withGit?: boolean;
    wsRoot?: string;
    vaultDir?: string;
};
type SetupVaultsOptsV3 = Omit<SetupVaultOpts, "initDirCb"> & {
    wsRoot: string;
    vaults?: DVault[];
    initVault1?: InitVaultFunc;
    initVault2?: InitVaultFunc;
};
type SetupWSOptsV3 = Omit<SetupVaultsOptsV3, "wsRoot"> & {
    wsRoot?: string;
};
/**
 * Relative vaults
 */
export type SetupVaultsOptsV4 = {
    preSetupHook?: PreSetupHookFunctionV4;
    vault: DVault;
};
export declare class EngineTestUtilsV4 {
    /**
     * Setup a workspace with three vaults
     * The third vault has a different path than name
     */
    static setupWS(opts?: {
        wsRoot?: string;
    } & {
        setupVaultsOpts?: SetupVaultsOptsV4[];
        singleVault?: boolean;
    }): Promise<WorkspaceOpts>;
    static setupVault(opts: SetupVaultsOptsV4 & {
        wsRoot: string;
    }): Promise<DVault>;
    /**
     * Check disk for note
     * @param opts
     * @returns
     */
    static checkVault(opts: WorkspaceVault & {
        match?: string[];
        nomatch?: string[];
    }): Promise<boolean>;
}
/**
 * Legacy Multi-vault setup
 */
export declare class EngineTestUtilsV3 {
    static setupWS(opts: SetupWSOptsV3): Promise<{
        wsRoot: string;
        vaults: {
            fsPath: string;
            name: string | undefined;
        }[] & DVault[];
    }>;
    static setupVaults(opts: SetupVaultsOptsV3): Promise<{
        fsPath: string;
        name: string | undefined;
    }[] & DVault[]>;
}
export declare class EngineTestUtilsV2 {
    static setupWS(opts: SetupWSOpts): Promise<{
        wsRoot: string;
        vaults: string[];
    }>;
    static setupVault(opts: SetupVaultOpts): Promise<string>;
}
export declare class NodeTestUtilsV2 {
    static createNoteProps: (opts: {
        rootName: string;
        vaultPath: string;
        props?: Partial<NoteProps>;
    }) => Promise<{
        foo: NoteProps;
        ch1: NoteProps;
    }>;
    static createNote: (opts: {
        withBody?: boolean;
        vaultDir: string;
        noteProps?: Omit<NoteOpts, "vault"> & {
            vault?: DVault;
        };
    }) => Promise<NoteProps>;
    static createNotes: (opts: {
        withBody?: boolean;
        vaultPath: string;
        noteProps?: (Omit<NoteOpts, "vault"> & {
            vault?: DVault;
        })[];
    }) => Promise<NotePropsByIdDict>;
    static createSchema: (opts: {
        vaultDir: string;
        fname: string;
        schemas: SchemaProps[];
    }) => Promise<SchemaModuleProps>;
    static createSchemas: (opts: {
        vaultPath: string;
        schemaMO?: [SchemaModuleOpts, string][];
    }) => Promise<void>;
    static createSchemaModuleOpts: (opts: {
        vaultDir: string;
        rootName: string;
        rootOpts?: Partial<SchemaProps>;
    }) => Promise<SchemaModuleOpts>;
    static normalizeNote({ note }: {
        note: NoteProps;
    }): Partial<NoteProps>;
    static normalizeNotes(notes: NoteProps[] | NotePropsByIdDict): Partial<NoteProps>[];
}
