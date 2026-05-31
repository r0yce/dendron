import { DEngineClient, DVault, NoteProps, WorkspaceOpts } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import { JSONSchemaType } from "ajv";
import { Item } from "klaw";
import { URI } from "vscode-uri";
import { GDocUtilMethods, NotionUtilMethods, PodKind, GithubIssueUtilMethods, ConflictHandler } from "./types";
export declare enum PROMPT {
    USERPROMPT = "userPrompt"
}
export type PodOpts<T> = {
    engine: DEngineClient;
    config: T;
    onPrompt?: (arg0?: PROMPT) => Promise<any | undefined>;
    utilityMethods?: GDocUtilMethods | NotionUtilMethods | GithubIssueUtilMethods | ConflictHandler;
} & WorkspaceOpts;
export type PublishPodExecuteOpts<T extends PublishPodConfig = any> = PodOpts<T>;
export type PublishPodPlantOpts<T extends PublishPodConfig = any> = PublishPodExecuteOpts<T> & {
    note: NoteProps;
};
export type PublishPodConfig = {
    /**
     *  Name of file to publish
     */
    fname: string;
    /**
     * Name of vault
     */
    vaultName: string;
    /**
     * Where to write output to
     */
    dest: string | "stdout";
};
export declare abstract class PublishPod<T extends PublishPodConfig = PublishPodConfig> {
    static kind: PodKind;
    L: DLogger;
    constructor();
    abstract get config(): JSONSchemaType<T>;
    execute(opts: PublishPodExecuteOpts<T>): Promise<string>;
    abstract plant(opts: PublishPodPlantOpts<T>): Promise<string>;
}
export type ImportPodConfig = {
    /**
     * Where to import from
     */
    src: string;
    /**
     * Name of vault
     */
    vaultName: string;
    concatenate?: boolean;
    destName?: string;
    frontmatter?: any;
    fnameAsId?: boolean;
};
export type ImportPodExecuteOpts<T extends ImportPodConfig = ImportPodConfig> = PodOpts<T>;
export type ImportPodPlantOpts<T extends ImportPodConfig = ImportPodConfig> = Omit<ImportPodExecuteOpts<T>, "src"> & {
    src: URI;
    vault: DVault;
};
export declare abstract class ImportPod<T extends ImportPodConfig = ImportPodConfig> {
    L: DLogger;
    static kind: PodKind;
    abstract get config(): JSONSchemaType<T>;
    constructor();
    execute(opts: ImportPodExecuteOpts<T>): Promise<{
        importedNotes: NoteProps[];
        errors?: Item[];
    }>;
    abstract plant(opts: ImportPodPlantOpts<T>): Promise<{
        importedNotes: NoteProps[];
        errors?: Item[];
    }>;
}
export type PodVaultConfig = {
    include?: string[];
    exclude?: string[];
};
export type ExportPodConfig = {
    /**
     * Where to export to
     */
    dest: string;
    includeBody?: boolean;
    includeStubs?: boolean;
    ignore?: string[];
    vaults?: PodVaultConfig;
};
export type ExportPodExecuteOpts<T extends ExportPodConfig = ExportPodConfig> = PodOpts<T>;
export type ExportPodPlantOpts<T extends ExportPodConfig = ExportPodConfig> = Omit<ExportPodExecuteOpts<T>, "dest"> & {
    dest: URI;
    vaults: DVault[];
    notes: NoteProps[];
    wsRoot: string;
};
export declare abstract class ExportPod<T extends ExportPodConfig = ExportPodConfig, TData = any> {
    L: DLogger;
    static kind: PodKind;
    abstract get config(): JSONSchemaType<T>;
    constructor();
    /**
     * Checks for some pre-sets
     * - if not `includeBody`, then fetch notes without body
     * - if not `includeStubs`, then ignore stub nodes
     */
    prepareNotesForExport({ config, notes, }: {
        config: ExportPodConfig;
        notes: NoteProps[];
    }): NoteProps[];
    execute(opts: ExportPodExecuteOpts<T>): Promise<{
        notes: NoteProps[];
        data?: TData;
    }>;
    abstract plant(opts: ExportPodPlantOpts<T>): Promise<{
        notes: NoteProps[];
        data?: TData;
    }>;
}
