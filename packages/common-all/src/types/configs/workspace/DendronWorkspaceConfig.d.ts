import { JournalConfig } from "./journal";
import { ScratchConfig } from "./scratch";
import { DendronGraphConfig } from "./graph";
import { SeedSite } from "../../seed";
import { DHookDict } from "../../hooks";
import { VaultSyncMode } from "../base";
import { TaskConfig } from "./task";
import { DVault } from "../../DVault";
import { DendronWorkspaceEntry } from "../../DendronWorkspaceEntry";
/**
 * Namespace for configurations that affect the workspace
 */
export type DendronWorkspaceConfig = {
    dendronVersion?: string;
    workspaces?: {
        [key: string]: DendronWorkspaceEntry | undefined;
    };
    seeds?: {
        [key: string]: DendronSeedEntry | undefined;
    };
    vaults: DVault[];
    hooks?: DHookDict;
    journal: JournalConfig;
    scratch: ScratchConfig;
    task: TaskConfig;
    graph: DendronGraphConfig;
    disableTelemetry?: boolean;
    enableAutoCreateOnDefinition: boolean;
    enableXVaultWikiLink: boolean;
    enableRemoteVaultInit: boolean;
    workspaceVaultSyncMode: VaultSyncMode;
    enableAutoFoldFrontmatter: boolean;
    enableUserTags: boolean;
    enableHashTags: boolean;
    enableFullHierarchyNoteTitle: boolean;
    maxPreviewsCached: number;
    maxNoteLength: number;
    enableEditorDecorations: boolean;
    feedback?: boolean;
    apiEndpoint?: string;
    metadataStore?: "sqlite" | "json";
    enablePersistentHistory?: boolean;
    mainVault?: string;
    enablePerfMode?: boolean;
};
export type DendronSeedEntry = {
    branch?: string;
    site?: SeedSite;
};
/**
 * Generates default {@link DendronWorkspaceConfig}
 * @returns DendronWorkspaceConfig
 */
export declare function genDefaultWorkspaceConfig(): DendronWorkspaceConfig;
