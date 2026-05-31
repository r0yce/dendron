import { DefaultMap, DEngineClient, DVault, DWorkspaceV2, WorkspaceSettings, WorkspaceType } from "@dendronhq/common-all";
import { IWorkspaceService } from "@dendronhq/engine-server";
import { CommentController, CommentThread, Disposable, ExtensionContext, FileSystemWatcher, WorkspaceConfiguration } from "vscode";
import { ILookupControllerV3Factory } from "../components/lookup/LookupControllerV3Interface";
import { INoteLookupProviderFactory, ISchemaLookupProviderFactory } from "../components/lookup/LookupProviderV3Interface";
import { IDendronExtension } from "../dendronExtensionInterface";
import { FileWatcher } from "../fileWatcher";
import { EngineAPIService } from "../services/EngineAPIService";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { NoteTraitService } from "../services/NoteTraitService";
import { ISchemaSyncService } from "../services/SchemaSyncServiceInterface";
import { IWSUtilsV2 } from "../WSUtilsV2Interface";
/**
 * Mock version of IDendronExtension for testing purposes. If you require additional
 * functionality for your tests, either add it here, or extend this class for
 * your own testing scenario
 */
export declare class MockDendronExtension implements IDendronExtension {
    private _engine;
    private _context;
    private _wsRoot;
    private _vaults;
    noteRefCommentController: CommentController;
    constructor({ engine, wsRoot, context, vaults, }: {
        engine?: DEngineClient;
        wsRoot?: string;
        context?: ExtensionContext;
        vaults?: DVault[];
    });
    get podsDir(): string;
    get traitRegistrar(): NoteTraitService;
    serverProcess?: undefined;
    setEngine(_svc: EngineAPIService): void;
    fileWatcher?: FileWatcher | undefined;
    workspaceImpl?: DWorkspaceV2 | undefined;
    port?: number | undefined;
    get context(): ExtensionContext;
    serverWatcher?: FileSystemWatcher | undefined;
    get type(): WorkspaceType;
    getCommentThreadsState(): {
        inlineNoteRefs: DefaultMap<string, Map<string, CommentThread>>;
    };
    get wsUtils(): IWSUtilsV2;
    get schemaSyncService(): ISchemaSyncService;
    get workspaceService(): IWorkspaceService | undefined;
    get lookupControllerFactory(): ILookupControllerV3Factory;
    get noteLookupProviderFactory(): INoteLookupProviderFactory;
    get schemaLookupProviderFactory(): ISchemaLookupProviderFactory;
    activateWatchers(): Promise<void>;
    deactivate(): Promise<void>;
    /**
     * Note: No-Op
     * @param _cb
     * @returns
     */
    pauseWatchers<T = void>(cb: () => Promise<T>): Promise<T>;
    getClientAPIRootUrl(): Promise<string>;
    getDWorkspace(): DWorkspaceV2;
    getWorkspaceImplOrThrow(): DWorkspaceV2;
    getWorkspaceSettings(): Promise<WorkspaceSettings | undefined>;
    getWorkspaceSettingsSync(): WorkspaceSettings | undefined;
    getDendronWorkspaceSettingsSync(): Partial<{
        "dendron.dailyJournalDomain": string;
        "dendron.defaultJournalName": string;
        "dendron.defaultJournalDateFormat": string;
        "dendron.defaultJournalAddBehavior": string;
        "dendron.defaultScratchName": string;
        "dendron.defaultScratchDateFormat": string;
        "dendron.defaultScratchAddBehavior": string;
        "dendron.copyNoteUrlRoot": string;
        "dendron.linkSelectAutoTitleBehavior": string;
        "dendron.defaultLookupCreateBehavior": string;
        "dendron.defaultTimestampDecorationFormat": string;
        "dendron.rootDir": string;
        "dendron.dendronDir": string;
        "dendron.logLevel": string;
        "dendron.trace.server": string;
        "dendron.serverPort": string;
    }> | undefined;
    getWorkspaceSettingOrDefault(): void;
    setupViews(_context: ExtensionContext): Promise<void>;
    addDisposable(_disposable: Disposable): void;
    /**
     * Note: trustedWorkspace is omitted
     * @returns
     */
    getEngine(): IEngineAPIService;
    isActive(): boolean;
    isActiveAndIsDendronNote(_fpath: string): Promise<boolean>;
    getWorkspaceConfig(): WorkspaceConfiguration;
}
