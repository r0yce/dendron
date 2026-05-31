import { DWorkspaceV2, WorkspaceSettings, WorkspaceType, DefaultMap } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { ILookupControllerV3Factory } from "./components/lookup/LookupControllerV3Interface";
import { INoteLookupProviderFactory, ISchemaLookupProviderFactory } from "./components/lookup/LookupProviderV3Interface";
import { DendronWorkspaceSettings, IDendronExtension } from "./dendronExtensionInterface";
import BacklinksTreeDataProvider from "./features/BacklinksTreeDataProvider";
import { FileWatcher } from "./fileWatcher";
import { EngineAPIService } from "./services/EngineAPIService";
import { NoteTraitService } from "./services/NoteTraitService";
import { ISchemaSyncService } from "./services/SchemaSyncServiceInterface";
import { WindowWatcher } from "./windowWatcher";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
export type ServerConfiguration = {
    serverPort: string;
};
export declare function whenGlobalState(key: string, cb?: () => boolean): boolean;
/**
 * @deprecated: If need static access use ExtensionProvider.getDWorkspace().
 * Or preferably pass IDendronExtension to constructors of your classes. */
export declare function getDWorkspace(): DWorkspaceV2;
/**
 * @deprecated: If need static access use ExtensionProvider.getExtension().
 * Or preferably pass IDendronExtension to constructors of your classes.
 * */
export declare function getExtension(): DendronExtension;
/**
 * @deprecated: If need static access use ExtensionProvider.getEngine().
 * Or preferably pass IDendronExtension to constructors of your classes.*/
export declare function getEngine(): EngineAPIService;
export declare function resolveRelToWSRoot(fpath: string): string;
/** Given file uri that is within a vault within the current workspace returns the vault. */
export declare function getVaultFromUri(fileUri: Uri): import("@dendronhq/common-all").DVault;
export declare const NO_WORKSPACE_IMPLEMENTATION = "no workspace implementation";
export declare class DendronExtension implements IDendronExtension {
    static DENDRON_WORKSPACE_FILE: string;
    static _SERVER_CONFIGURATION: Partial<ServerConfiguration>;
    private _engine?;
    private _disposableStore;
    private _traitRegistrar;
    private L;
    backlinksDataProvider: BacklinksTreeDataProvider | undefined;
    fileWatcher?: FileWatcher;
    port?: number;
    workspaceService?: WorkspaceService;
    schemaSyncService: ISchemaSyncService;
    lookupControllerFactory: ILookupControllerV3Factory;
    noteLookupProviderFactory: INoteLookupProviderFactory;
    schemaLookupProviderFactory: ISchemaLookupProviderFactory;
    context: vscode.ExtensionContext;
    windowWatcher?: WindowWatcher;
    serverWatcher?: vscode.FileSystemWatcher;
    type: WorkspaceType;
    workspaceImpl?: DWorkspaceV2;
    wsUtils: IWSUtilsV2;
    noteRefCommentController: vscode.CommentController;
    private _inlineNoteRefs;
    static context(): vscode.ExtensionContext;
    static instanceV2(): DendronExtension;
    static serverConfiguration(): ServerConfiguration;
    /**
     * @deprecated: For static access, use ExtensionProvider.getWorkspaceConfig().
     * Or preferably pass IDendronExtension to constructors of your classes.
     *
     * Global Workspace configuration
     */
    static configuration(section?: string | undefined): vscode.WorkspaceConfiguration;
    get traitRegistrar(): NoteTraitService;
    pauseWatchers<T = void>(cb: () => Promise<T>): Promise<T>;
    getClientAPIRootUrl(): Promise<string>;
    /**
     * Workspace settings file. Warning, this doesn't exist in all workspaces!
     *
     * Warning! This function will throw when used in a Native Workspace. Make
     * sure to use it in a try...catch block unless you're sure you are running in
     * a Code Workspace.
     */
    static workspaceFile(): vscode.Uri;
    /** Get the workspace settings file, unless it's a native workspace where we may not have one. */
    static tryWorkspaceFile(): vscode.Uri | undefined;
    static workspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined;
    static workspaceRoots(): Promise<string[]>;
    /** Checks if the current workspace open in VSCode is a Dendron workspace or not. */
    static isDendronWorkspace(): Promise<boolean | undefined>;
    /**
     * @deprecated: For static access, use ExtensionProvider.isActive().
     * Or preferably pass IDendronExtension to constructors of your classes.
     *
     * Checks if a Dendron workspace is currently active.
     */
    static isActive(_context?: vscode.ExtensionContext): boolean;
    isActiveAndIsDendronNote(fpath: string): Promise<boolean>;
    /**
     * When in dev mode, version is equivalent to `package.json` that is checked out locally
     * Otherwise, get from published extension `package.json`
     */
    static version(): string;
    static resetConfig(globalState: vscode.Memento): Promise<void[]>;
    static getOrCreate(context: vscode.ExtensionContext, opts?: {
        skipSetup?: boolean;
    }): Promise<DendronExtension>;
    constructor(context: vscode.ExtensionContext, opts?: {
        skipSetup?: boolean;
    });
    getDWorkspace(): DWorkspaceV2;
    getWorkspaceImplOrThrow(): DWorkspaceV2;
    getCommentThreadsState(): {
        inlineNoteRefs: DefaultMap<string, Map<string, vscode.CommentThread>>;
    };
    /**
     * @deprecated Use {@link VSCodeUtils.getWorkspaceConfig} instead.
     */
    getWorkspaceConfig(section?: string | undefined): vscode.WorkspaceConfiguration;
    isActive(): boolean;
    /** For Native workspaces (without .code-workspace file) this will return undefined. */
    getWorkspaceSettings(): Promise<WorkspaceSettings | undefined>;
    getWorkspaceSettingsSync(): WorkspaceSettings | undefined;
    getDendronWorkspaceSettingsSync(): DendronWorkspaceSettings | undefined;
    getWorkspaceSettingOrDefault({ wsConfigKey, dendronConfigKey, }: {
        wsConfigKey: keyof DendronWorkspaceSettings;
        dendronConfigKey: string;
    }): any;
    get podsDir(): string;
    /**
     * The first workspace folder
     */
    get rootWorkspace(): vscode.WorkspaceFolder;
    getEngine(): EngineAPIService;
    setEngine(engine: EngineAPIService): void;
    setupViews(context: vscode.ExtensionContext): Promise<void>;
    private setupTipOfTheDayView;
    private setupBacklinkTreeView;
    private setupGraphPanel;
    addDisposable(disposable: vscode.Disposable): void;
    /**
     * - get workspace config and workspace folder
     * - activate workspacespace watchers
     */
    activateWatchers(): Promise<void>;
    deactivate(): Promise<void>;
}
