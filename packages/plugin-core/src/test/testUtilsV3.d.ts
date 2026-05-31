import { DEngine, DEngineClient, Disposable, DVault, DendronConfig, NoteChangeEntry, VaultRemoteSource, WorkspaceOpts, WorkspaceSettings, WorkspaceType } from "@dendronhq/common-all";
import { CreateEngineFunction, EngineOpt, PreSetupCmdHookFunction, PreSetupHookFunction } from "@dendronhq/common-test-utils";
import { DendronEngineClient } from "@dendronhq/engine-server";
import { ModConfigCb, TestSetupWorkspaceOpts } from "@dendronhq/engine-test-utils";
import { CancellationToken, ExtensionContext, Uri, WorkspaceFolder } from "vscode";
import { SetupWorkspaceOpts } from "../commands/SetupWorkspace";
import { VaultAddCommand } from "../commands/VaultAddCommand";
import { SetupCodeConfigurationV2 } from "./testUtilsv2";
export declare const DENDRON_REMOTE = "https://github.com/dendronhq/dendron-site-vault.git";
export declare const DENDRON_REMOTE_VAULT: {
    fsPath: string;
    remote: {
        type: "git";
        url: string;
    };
};
export type OnInitHook = (opts: WorkspaceOpts & EngineOpt) => Promise<void>;
type PostSetupWorkspaceHook = (opts: WorkspaceOpts) => Promise<void>;
type SetupWorkspaceType = {
    /** The type of workspace to create for the test, Native (w/o dendron.code-worksace) or Code (w/ dendron.code-workspace) */
    workspaceType?: WorkspaceType;
    /** If true, create a self contained vault as the workspace.
     *
     * Setting this option will also override the VSCode setting `dendron.enableSelfContainedVaultWorkspace`.
     *
     * TODO: This option is temporary until self contained vaults become the default, at which point this should be removed and all tests should default to self contained.
     */
    selfContained?: boolean;
};
export type SetupLegacyWorkspaceOpts = SetupCodeConfigurationV2 & SetupWorkspaceType & {
    ctx?: ExtensionContext;
    preSetupHook?: PreSetupCmdHookFunction;
    postSetupHook?: PostSetupWorkspaceHook;
    setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
    modConfigCb?: ModConfigCb;
    noSetInstallStatus?: boolean;
};
export type SetupLegacyWorkspaceMultiOpts = SetupCodeConfigurationV2 & SetupWorkspaceType & {
    ctx?: ExtensionContext;
    /**
     * Runs before the workspace is initialized
     */
    preSetupHook?: PreSetupHookFunction;
    /**
     * Runs after the workspace is initialized
     */
    postSetupHook?: PostSetupWorkspaceHook;
    /**
     * By default, create workspace and vaults in a random temporary dir.
     */
    setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
    /**
     * Overrid default Dendron settings (https://dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f48.html)
     */
    wsSettingsOverride?: Partial<WorkspaceSettings>;
} & TestSetupWorkspaceOpts;
export declare class EditorUtils {
    static getURIForActiveEditor(): Promise<Uri>;
}
export declare const getConfig: (opts: {
    wsRoot: string;
}) => DendronConfig;
export declare const withConfig: (func: (config: DendronConfig) => DendronConfig, opts: {
    wsRoot: string;
}) => DendronConfig;
export declare const writeConfig: (opts: {
    config: DendronConfig;
    wsRoot: string;
}) => void;
export declare function setupWorkspace(): Promise<void>;
export declare function setupLegacyWorkspace(opts: SetupLegacyWorkspaceOpts): Promise<WorkspaceOpts>;
export declare function setupLegacyWorkspaceMulti(opts: SetupLegacyWorkspaceMultiOpts): Promise<{
    wsRoot: string;
    vaults: DVault[];
    workspaceFile: Uri | undefined;
    workspaceFolders: readonly WorkspaceFolder[] | undefined;
}>;
/**
 * @deprecated please use {@link describeSingleWS} instead
 */
export declare function runLegacySingleWorkspaceTest(opts: SetupLegacyWorkspaceOpts & {
    onInit: OnInitHook;
}): Promise<void>;
/**
 * @deprecated please use {@link describeMultiWS} instead
 */
export declare function runLegacyMultiWorkspaceTest(opts: SetupLegacyWorkspaceMultiOpts & {
    onInit: OnInitHook;
    skipMigrations?: boolean;
}): Promise<void>;
export declare function addDebugServerOverride(): {
    configOverride: {
        "dendron.serverPort": string;
    };
};
/**
 * @deprecated. If using {@link describeSingleWS} or {@link describeMultiWS}, this call is no longer necessary
 *
 * If you need before or after hooks, you can use `before()` and `after()` to set them up.
 * Timeout and `noSetInstallStatus` can be set on the options for the test harnesses.
 *
 * @param _this
 * @param opts.noSetInstallStatus: by default, we set install status to NO_CHANGE. use this when you need to test this logic
 */
export declare function setupBeforeAfter(_this: any, opts?: {
    beforeHook?: (ctx: ExtensionContext) => any;
    afterHook?: any;
    noSetInstallStatus?: boolean;
    noSetTimeout?: boolean;
}): ExtensionContext;
export declare function stubSetupWorkspace({ wsRoot }: {
    wsRoot: string;
}): void;
type EngineOverride = {
    [P in keyof DEngine]: (opts: WorkspaceOpts) => DEngine[P];
};
export declare const createEngineFactory: (overrides?: Partial<EngineOverride>) => CreateEngineFunction;
export declare const stubVaultInput: (opts: {
    cmd?: VaultAddCommand;
    sourceType: VaultRemoteSource;
    sourcePath: string;
    sourcePathRemote?: string;
    sourceName?: string;
}) => void;
export declare function runTestButSkipForWindows(): Mocha.PendingSuiteFunction;
export declare function runSuiteButSkipForWindows(): Mocha.PendingSuiteFunction;
/**
 * Use to run tests with a multi-vault workspace. Used in the same way as
 * regular `describe`. For example:
 * ```ts
 * describeMultiWS(
 *   "WHEN workspace type is not specified",
 *   {
 *     preSetupHook: ENGINE_HOOKS.setupBasic,
 *   },
 *   () => {
 *     test("THEN initializes correctly", (done) => {
 *       const { engine, _wsRoot, _vaults } = getDWorkspace();
 *       const testNote = await engine.getNote("foo").data!;
 *       expect(testNote).toBeTruthy();
 *       done();
 *     });
 *   }
 * );
 * ```
 * @param title
 * @param opts
 * @param fn - the test() functions to execute. NOTE: This function CANNOT be
 * async, or else the test may not fail reliably when your expect or assert
 * conditions are not met. ^eq30h1lt0zat
 */
export declare function describeMultiWS(title: string, opts: SetupLegacyWorkspaceMultiOpts & {
    /**
     * Run after we stub vscode mock workspace, but before the workspace is created
     */
    beforeHook?: (opts: {
        ctx: ExtensionContext;
    }) => Promise<void>;
    /**
     * Run after the workspace is crated, but before dendron is activated
     */
    preActivateHook?: (opts: {
        ctx: ExtensionContext;
        wsRoot: string;
        vaults: DVault[];
    }) => Promise<void>;
    /**
     * @deprecated Please use an `after()` hook instead
     */
    afterHook?: (opts: {
        ctx: ExtensionContext;
    }) => Promise<void>;
    /**
     * Custom timeout for test in milleseconds
     * You will need to set this when stepping through mocha tests using breakpoints
     * otherwise the test will timeout during debugging
     * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
     */
    timeout?: number;
    noSetInstallStatus?: boolean;
    skipMigrations?: boolean;
}, fn: (ctx: ExtensionContext) => void): void;
export declare namespace describeMultiWS {
    var only: (title: string, opts: SetupCodeConfigurationV2 & SetupWorkspaceType & {
        ctx?: ExtensionContext;
        /**
         * Runs before the workspace is initialized
         */
        preSetupHook?: PreSetupHookFunction;
        /**
         * Runs after the workspace is initialized
         */
        postSetupHook?: PostSetupWorkspaceHook;
        /**
         * By default, create workspace and vaults in a random temporary dir.
         */
        setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
        /**
         * Overrid default Dendron settings (https://dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f48.html)
         */
        wsSettingsOverride?: Partial<WorkspaceSettings>;
    } & TestSetupWorkspaceOpts & {
        /**
         * Run after we stub vscode mock workspace, but before the workspace is created
         */
        beforeHook?: (opts: {
            ctx: ExtensionContext;
        }) => Promise<void>;
        /**
         * Run after the workspace is crated, but before dendron is activated
         */
        preActivateHook?: (opts: {
            ctx: ExtensionContext;
            wsRoot: string;
            vaults: DVault[];
        }) => Promise<void>;
        /**
         * @deprecated Please use an `after()` hook instead
         */
        afterHook?: (opts: {
            ctx: ExtensionContext;
        }) => Promise<void>;
        /**
         * Custom timeout for test in milleseconds
         * You will need to set this when stepping through mocha tests using breakpoints
         * otherwise the test will timeout during debugging
         * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
         */
        timeout?: number;
        noSetInstallStatus?: boolean;
        skipMigrations?: boolean;
    }, fn: (ctx: ExtensionContext) => void) => void;
    var skip: (title: string, opts: SetupCodeConfigurationV2 & SetupWorkspaceType & {
        ctx?: ExtensionContext;
        /**
         * Runs before the workspace is initialized
         */
        preSetupHook?: PreSetupHookFunction;
        /**
         * Runs after the workspace is initialized
         */
        postSetupHook?: PostSetupWorkspaceHook;
        /**
         * By default, create workspace and vaults in a random temporary dir.
         */
        setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
        /**
         * Overrid default Dendron settings (https://dendron.so/notes/eea2b078-1acc-4071-a14e-18299fc28f48.html)
         */
        wsSettingsOverride?: Partial<WorkspaceSettings>;
    } & TestSetupWorkspaceOpts & {
        /**
         * Run after we stub vscode mock workspace, but before the workspace is created
         */
        beforeHook?: (opts: {
            ctx: ExtensionContext;
        }) => Promise<void>;
        /**
         * Run after the workspace is crated, but before dendron is activated
         */
        preActivateHook?: (opts: {
            ctx: ExtensionContext;
            wsRoot: string;
            vaults: DVault[];
        }) => Promise<void>;
        /**
         * @deprecated Please use an `after()` hook instead
         */
        afterHook?: (opts: {
            ctx: ExtensionContext;
        }) => Promise<void>;
        /**
         * Custom timeout for test in milleseconds
         * You will need to set this when stepping through mocha tests using breakpoints
         * otherwise the test will timeout during debugging
         * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
         */
        timeout?: number;
        noSetInstallStatus?: boolean;
        skipMigrations?: boolean;
    }, fn: (ctx: ExtensionContext) => void) => void;
}
/**
 * Use to run tests with a single-vault workspace. Used in the same way as
 * regular `describe`.
 * @param title
 * @param opts
 * @param fn - the test() functions to execute. NOTE: This function CANNOT be
 * async, or else the test may not fail reliably when your expect or assert
 * conditions are not met.
 */
export declare function describeSingleWS(title: string, opts: SetupLegacyWorkspaceOpts & {
    /**
     * Custom timeout for test in milleseconds
     * You will need to set this when stepping through mocha tests using breakpoints
     * otherwise the test will timeout during debugging
     * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
     */
    timeout?: number;
    perflogs?: {
        [key: string]: number;
    };
}, fn: (ctx: ExtensionContext) => void): void;
export declare namespace describeSingleWS {
    var only: (title: string, opts: SetupCodeConfigurationV2 & SetupWorkspaceType & {
        ctx?: ExtensionContext;
        preSetupHook?: PreSetupCmdHookFunction;
        postSetupHook?: PostSetupWorkspaceHook;
        setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
        modConfigCb?: ModConfigCb;
        noSetInstallStatus?: boolean;
    } & {
        /**
         * Custom timeout for test in milleseconds
         * You will need to set this when stepping through mocha tests using breakpoints
         * otherwise the test will timeout during debugging
         * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
         */
        timeout?: number;
        perflogs?: {
            [key: string]: number;
        };
    }, fn: (ctx: ExtensionContext) => void) => void;
    var skip: (title: string, opts: SetupCodeConfigurationV2 & SetupWorkspaceType & {
        ctx?: ExtensionContext;
        preSetupHook?: PreSetupCmdHookFunction;
        postSetupHook?: PostSetupWorkspaceHook;
        setupWsOverride?: Omit<Partial<SetupWorkspaceOpts>, "workspaceType">;
        modConfigCb?: ModConfigCb;
        noSetInstallStatus?: boolean;
    } & {
        /**
         * Custom timeout for test in milleseconds
         * You will need to set this when stepping through mocha tests using breakpoints
         * otherwise the test will timeout during debugging
         * See [[Breakpoints|dendron://dendron.docs/pkg.plugin-core.qa.debug#breakpoints]] for more details
         */
        timeout?: number;
        perflogs?: {
            [key: string]: number;
        };
    }, fn: (ctx: ExtensionContext) => void) => void;
}
export declare function stubCancellationToken(): CancellationToken;
export declare function setupWorkspaceStubs(opts: {
    ctx: ExtensionContext;
    noSetInstallStatus?: boolean;
}): ExtensionContext;
export declare function cleanupWorkspaceStubs(ctx: ExtensionContext): void;
/**
 * Use this to test engine state changes through engine events. This can be used in
 * situations where the engine state changes asynchorously from test logic (such as from vscode event callbacks)
 *
 * @param callback to handle engine state events
 * @returns Disposable
 */
export declare function subscribeToEngineStateChange(callback: (noteChangeEntries: NoteChangeEntry[]) => void): Disposable;
export declare function toDendronEngineClient(engine: DEngineClient): DendronEngineClient;
export declare function createWorkspaceWithGit(dir: string, opts?: Partial<SetupWorkspaceOpts>): Promise<void>;
export declare function createSelfContainedVaultWithGit(dir: string): Promise<void>;
export declare function createVaultWithGit(dir: string): Promise<void>;
export declare function waitInMilliseconds(milliseconds: number): Promise<void>;
export {};
