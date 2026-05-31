"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceActivator = void 0;
exports.trackTopLevelRepoFound = trackTopLevelRepoFound;
require("reflect-metadata");
const Sentry = __importStar(require("@sentry/node"));
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const EngineAPIService_1 = require("../services/EngineAPIService");
const stateService_1 = require("../services/stateService");
const TextDocumentServiceFactory_1 = require("../services/TextDocumentServiceFactory");
const analytics_1 = require("../utils/analytics");
const ExtensionUtils_1 = require("../utils/ExtensionUtils");
const StartupUtils_1 = require("../utils/StartupUtils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const WSUtils_1 = require("../WSUtils");
const codeWorkspace_1 = require("./codeWorkspace");
const nativeWorkspace_1 = require("./nativeWorkspace");
const WorkspaceInitFactory_1 = require("./WorkspaceInitFactory");
const CreateNoteCommand_1 = require("../commands/CreateNoteCommand");
const inject_1 = require("../di/inject");
const NativeTreeView_1 = require("../views/common/treeview/NativeTreeView");
const spark_md5_1 = __importDefault(require("spark-md5"));
function _setupTreeViewCommands(treeView, existingCommands) {
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_LABEL_BY_TITLE.key)) {
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_LABEL_BY_TITLE.key, (0, analytics_1.sentryReportingCallback)(() => {
            treeView.updateLabelType({
                labelType: common_all_1.TreeViewItemLabelTypeEnum.title,
            });
        }));
    }
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_LABEL_BY_FILENAME.key)) {
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_LABEL_BY_FILENAME.key, (0, analytics_1.sentryReportingCallback)(() => {
            treeView.updateLabelType({
                labelType: common_all_1.TreeViewItemLabelTypeEnum.filename,
            });
        }));
    }
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key)) {
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key, (0, analytics_1.sentryReportingCallback)(async (opts) => {
            await new CreateNoteCommand_1.CreateNoteCommand().run(opts);
        }));
    }
    /**
     * This is a little flaky right now, but it works most of the time.
     * Leaving this for dev / debug purposes.
     * Enablement is set to be DendronContext.DEV_MODE
     *
     * TODO: fix tree item register issue and flip the dev mode flag.
     */
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_EXPAND_ALL.key)) {
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_EXPAND_ALL.key, (0, analytics_1.sentryReportingCallback)(async () => {
            await treeView.expandAll();
        }));
    }
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key)) {
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key, (0, analytics_1.sentryReportingCallback)(async (id) => {
            await treeView.expandTreeItem(id);
        }));
    }
}
function trackTopLevelRepoFound(opts) {
    const { wsService } = opts;
    return wsService.getTopLevelRemoteUrl().then((remoteUrl) => {
        if (remoteUrl !== undefined) {
            const [protocol, provider, ...path] = common_server_1.GitUtils.parseGitUrl(remoteUrl);
            const payload = {
                protocol: (protocol || "").replace(":", ""),
                provider,
                path: spark_md5_1.default.hash(`${path[0]}/${path[1]}.git`),
            };
            analytics_1.AnalyticsUtils.track(common_all_1.GitEvents.TopLevelRepoFound, payload);
            return payload;
        }
        return undefined;
    });
}
function analyzeWorkspace({ wsService }) {
    // Track contributors to repositories, but do so in the background so
    // initialization isn't delayed.
    const startGetAllReposNumContributors = process.hrtime();
    wsService
        .getAllReposNumContributors()
        .then((numContributors) => {
        analytics_1.AnalyticsUtils.track(common_all_1.GitEvents.ContributorsFound, {
            maxNumContributors: lodash_1.default.max(numContributors),
            duration: (0, common_server_1.getDurationMilliseconds)(startGetAllReposNumContributors),
        });
    })
        .catch((err) => {
        Sentry.captureException(err);
    });
    trackTopLevelRepoFound({ wsService });
}
async function getOrPromptWSRoot(workspaceFolders) {
    if (!workspaceFolders) {
        logger_1.Logger.error({ msg: "No dendron.yml found in any workspace folder" });
        return undefined;
    }
    if (workspaceFolders.length === 1) {
        return workspaceFolders[0];
    }
    else {
        const selectedRoot = await vsCodeUtils_1.VSCodeUtils.showQuickPick(workspaceFolders.map((folder) => {
            return {
                label: folder,
            };
        }), {
            ignoreFocusOut: true,
            canPickMany: false,
            title: "Select Dendron workspace to load",
        });
        if (!selectedRoot) {
            await vscode.window.showInformationMessage("You skipped loading any Dendron workspace, Dendron is not active. You can run the 'Developer: Reload Window' command to reactivate Dendron.");
            logger_1.Logger.info({
                msg: "User skipped loading a Dendron workspace",
                workspaceFolders,
            });
            return null;
        }
        return selectedRoot.label;
    }
}
/**
 * Get version of Dendron when workspace was last activated
 */
async function getAndCleanPreviousWSVersion({ wsService, stateService, ext, }) {
    let previousWorkspaceVersionFromWSService = wsService.getMeta().version;
    // Fix a temporary issue where CLI was writing an invalid version number
    // to .dendron.ws:
    if (previousWorkspaceVersionFromWSService === "dendron-cli") {
        previousWorkspaceVersionFromWSService = "0.91.0";
    }
    if (ext.type === common_all_1.WorkspaceType.NATIVE) {
        return previousWorkspaceVersionFromWSService;
    }
    // Code workspace specific code
    // Migration code: we used to store verion history in state vs metadata
    const previousWorkspaceVersionFromState = stateService.getWorkspaceVersion();
    if (!semver_1.default.valid(previousWorkspaceVersionFromWSService) ||
        semver_1.default.gt(previousWorkspaceVersionFromState, previousWorkspaceVersionFromWSService)) {
        previousWorkspaceVersionFromWSService = previousWorkspaceVersionFromState;
        wsService.writeMeta({ version: previousWorkspaceVersionFromState });
    }
    return previousWorkspaceVersionFromWSService;
}
async function checkNoDuplicateVaultNames(vaults) {
    // check for vaults with same name
    const uniqueVaults = new Set();
    const duplicates = new Set();
    vaults.forEach((vault) => {
        const vaultName = common_all_1.VaultUtils.getName(vault);
        if (uniqueVaults.has(vaultName))
            duplicates.add(vaultName);
        uniqueVaults.add(vaultName);
    });
    if (duplicates.size > 0) {
        const txt = "Fix it";
        const duplicateVaultNames = Array.from(duplicates).join(", ");
        await vscode.window
            .showErrorMessage(`Following vault names have duplicates: ${duplicateVaultNames} See https://dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe.html#multiple-vaults-with-the-same-name to fix`, txt)
            .then((resp) => {
            if (resp === txt) {
                vscode.commands.executeCommand("vscode.open", vscode.Uri.parse("https://dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe.html#multiple-vaults-with-the-same-name"));
            }
        });
        return false;
    }
    return true;
}
async function initTreeView({ context }) {
    const existingCommands = await vscode.commands.getCommands();
    const treeView = inject_1.container.resolve(NativeTreeView_1.NativeTreeView);
    treeView.show();
    _setupTreeViewCommands(treeView, existingCommands);
    context.subscriptions.push(treeView);
}
async function postReloadWorkspace({ wsService, }) {
    const ctx = "postReloadWorkspace";
    if (!wsService) {
        const errorMsg = "No workspace service found.";
        logger_1.Logger.error({
            msg: errorMsg,
            error: new common_all_1.DendronError({ message: errorMsg }),
        });
        return;
    }
    const wsMeta = wsService.getMeta();
    const previousWsVersion = wsMeta.version;
    // stats
    // NOTE: this is legacy to upgrade .code-workspace specific settings
    // we are moving everything to dendron.yml
    // see [[2021 06 Deprecate Workspace Settings|proj.2021-06-deprecate-workspace-settings]]
    if (previousWsVersion === common_all_1.CONSTANTS.DENDRON_INIT_VERSION) {
        logger_1.Logger.info({ ctx, msg: "no previous global version" });
        vscode.commands
            .executeCommand(constants_1.DENDRON_COMMANDS.UPGRADE_SETTINGS.key)
            .then((changes) => {
            logger_1.Logger.info({ ctx, msg: "postUpgrade: new wsVersion", changes });
        });
        wsService.writeMeta({ version: workspace_1.DendronExtension.version() });
    }
    else {
        const newVersion = workspace_1.DendronExtension.version();
        if (semver_1.default.lt(previousWsVersion, newVersion)) {
            let changes;
            logger_1.Logger.info({ ctx, msg: "preUpgrade: new wsVersion" });
            try {
                changes = await vscode.commands.executeCommand(constants_1.DENDRON_COMMANDS.UPGRADE_SETTINGS.key);
                logger_1.Logger.info({
                    ctx,
                    msg: "postUpgrade: new wsVersion",
                    changes,
                    previousWsVersion,
                    newVersion,
                });
                wsService.writeMeta({ version: workspace_1.DendronExtension.version() });
            }
            catch (err) {
                logger_1.Logger.error({
                    msg: "error upgrading",
                    error: new common_all_1.DendronError({ message: JSON.stringify(err) }),
                });
                return;
            }
            engine_server_1.HistoryService.instance().add({
                source: "extension",
                action: "upgraded",
                data: { changes },
            });
        }
        else {
            logger_1.Logger.info({ ctx, msg: "same wsVersion" });
        }
    }
    logger_1.Logger.info({ ctx, msg: "exit" });
}
async function reloadWorkspace({ ext, wsService, }) {
    const ctx = "reloadWorkspace";
    const ws = ext.getDWorkspace();
    const maybeEngine = await WSUtils_1.WSUtils.reloadWorkspace();
    if (!maybeEngine) {
        return maybeEngine;
    }
    logger_1.Logger.info({ ctx, msg: "post-ws.reloadWorkspace" });
    // Run any initialization code necessary for this workspace invocation.
    const initializer = WorkspaceInitFactory_1.WorkspaceInitFactory.create();
    if (initializer?.onWorkspaceOpen) {
        initializer.onWorkspaceOpen({ ws });
    }
    vscode.window.showInformationMessage("Dendron is active");
    logger_1.Logger.info({ ctx, msg: "exit" });
    await postReloadWorkspace({ wsService });
    engine_server_1.HistoryService.instance().add({
        source: "extension",
        action: "initialized",
    });
    return maybeEngine;
}
function togglePluginActiveContext(enabled) {
    const ctx = "togglePluginActiveContext";
    logger_1.Logger.info({ ctx, state: `togglePluginActiveContext: ${enabled}` });
    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.PLUGIN_ACTIVE, enabled);
    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.HAS_CUSTOM_MARKDOWN_VIEW, enabled);
}
function updateEngineAPI(port, ext) {
    // set engine api ^9dr6chh7ah9v
    const svc = EngineAPIService_1.EngineAPIService.createEngine({
        port,
        enableWorkspaceTrust: vscode.workspace.isTrusted,
        vaults: ext.getDWorkspace().vaults,
        wsRoot: ext.getDWorkspace().wsRoot,
    });
    ext.setEngine(svc);
    ext.port = lodash_1.default.toInteger(port);
    return svc;
}
class WorkspaceActivator {
    /**
     * Initialize workspace. All logic that happens before the engine is initialized happens here
     * - create workspace class
     * - register traits
     * - run migrations if necessary
     */
    async init({ ext, context, wsRoot, opts, }) {
        const ctx = "WorkspaceActivator.init";
        // --- Setup workspace
        let workspace;
        if (ext.type === common_all_1.WorkspaceType.NATIVE) {
            workspace = await this.initNativeWorkspace({ ext, context, wsRoot });
            if (!workspace) {
                return {
                    error: common_all_1.ErrorFactory.createInvalidStateError({
                        message: "could not find native workspace",
                    }),
                };
            }
        }
        else {
            workspace = await this.initCodeWorkspace({ ext, context, wsRoot });
        }
        ext.workspaceImpl = workspace;
        // HACK: Only set up note traits after workspaceImpl has been set, so that
        // the wsRoot path is known for locating the note trait definition location.
        if (vscode.workspace.isTrusted) {
            ext.traitRegistrar.initialize();
        }
        else {
            logger_1.Logger.info({
                msg: "User specified note traits not initialized because workspace is not trusted.",
            });
        }
        // --- Initialization
        logger_1.Logger.info({ ctx: `${ctx}:postSetupTraits`, wsRoot });
        const currentVersion = workspace_1.DendronExtension.version();
        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
        const dendronConfig = workspace.config;
        const stateService = new stateService_1.StateService({
            globalState: context.globalState,
            workspaceState: context.workspaceState,
        });
        ext.workspaceService = wsService;
        // get previous workspace version and fixup
        const previousWorkspaceVersion = await getAndCleanPreviousWSVersion({
            wsService,
            stateService,
            ext,
        });
        // run migrations
        const maybeWsSettings = ext.type === common_all_1.WorkspaceType.CODE
            ? wsService.getCodeWorkspaceSettingsSync()
            : undefined;
        if (!opts?.skipMigrations) {
            await StartupUtils_1.StartupUtils.showManualUpgradeMessageIfNecessary({
                previousWorkspaceVersion,
                currentVersion,
            });
            await StartupUtils_1.StartupUtils.runMigrationsIfNecessary({
                wsService,
                currentVersion,
                previousWorkspaceVersion,
                maybeWsSettings: maybeWsSettings ?? undefined,
                dendronConfig,
            });
        }
        logger_1.Logger.info({ ctx: `${ctx}:postMigration`, wsRoot });
        // show interactive elements,
        if (!opts?.skipInteractiveElements) {
            // check for duplicate config keys and prompt for a fix.
            StartupUtils_1.StartupUtils.showDuplicateConfigEntryMessageIfNecessary({
                ext,
            });
        }
        // initialize vaults, clone remote vaults if needed
        const didClone = await wsService.initialize({
            onSyncVaultsProgress: () => {
                vscode.window.showInformationMessage("found empty remote vaults that need initializing");
            },
            onSyncVaultsEnd: () => {
                vscode.window.showInformationMessage("finish initializing remote vaults. reloading workspace");
                // TODO: remove
                setTimeout(vsCodeUtils_1.VSCodeUtils.reloadWindow, 200);
            },
        });
        if (didClone) {
            return {
                error: common_all_1.ErrorFactory.createInvalidStateError({
                    message: "could not initialize workspace",
                }),
            };
        }
        logger_1.Logger.info({ ctx: `${ctx}:postWsServiceInitialize`, wsRoot });
        // check for vaults with duplicates
        const respNoDupVault = await checkNoDuplicateVaultNames(wsService.vaults);
        if (!respNoDupVault) {
            return {
                error: common_all_1.ErrorFactory.createInvalidStateError({
                    message: "found duplicate vaults",
                }),
            };
        }
        // write new workspace version
        wsService.writeMeta({ version: workspace_1.DendronExtension.version() });
        // setup engine
        const port = await this.verifyOrStartServerProcess({ ext, wsService });
        logger_1.Logger.info({ ctx: `${ctx}:verifyOrStartServerProcess`, port });
        const engine = updateEngineAPI(port, ext);
        logger_1.Logger.info({ ctx: `${ctx}:exit` });
        return { data: { workspace, engine, wsService } };
    }
    /**
     * Initialize engine and activate workspace watchers
     */
    async activate({ ext, context, wsService, wsRoot, opts, workspaceInitializer, }) {
        const ctx = "WorkspaceActivator:activate";
        // setup services
        context.subscriptions.push(TextDocumentServiceFactory_1.TextDocumentServiceFactory.create(ext));
        // Reload
        WSUtils_1.WSUtils.showActivateProgress();
        const start = process.hrtime();
        const reloadSuccess = await reloadWorkspace({ ext, wsService });
        const durationReloadWorkspace = (0, common_server_1.getDurationMilliseconds)(start);
        // NOTE: tracking is not awaited, don't block on this
        ExtensionUtils_1.ExtensionUtils.trackWorkspaceInit({
            durationReloadWorkspace,
            activatedSuccess: !!reloadSuccess,
            ext,
        }).catch((error) => {
            Sentry.captureException(error);
        });
        analyzeWorkspace({ wsService });
        if (!reloadSuccess) {
            engine_server_1.HistoryService.instance().add({
                source: "extension",
                action: "not_initialized",
            });
            return {
                error: common_all_1.ErrorFactory.createInvalidStateError({
                    message: `issue with init`,
                }),
            };
        }
        ExtensionUtils_1.ExtensionUtils.setWorkspaceContextOnActivate(wsService.config);
        engine_server_1.MetadataService.instance().setDendronWorkspaceActivated();
        logger_1.Logger.info({ ctx, msg: "fin startClient", durationReloadWorkspace });
        const stage = (0, common_all_1.getStage)();
        if (stage !== "test") {
            ext.activateWatchers();
            togglePluginActiveContext(true);
        }
        // Setup tree view
        // This needs to happen after activation because we need the engine.
        if (!opts?.skipTreeView) {
            await initTreeView({
                context,
            });
        }
        // Add the current workspace to the recent workspace list. The current
        // workspace is either the workspace file (Code Workspace) or the current
        // folder (Native Workspace)
        const workspace = workspace_1.DendronExtension.tryWorkspaceFile()?.fsPath || wsRoot;
        engine_server_1.MetadataService.instance().addToRecentWorkspaces(workspace);
        if (workspaceInitializer?.onWorkspaceActivate) {
            workspaceInitializer.onWorkspaceActivate({
                skipOpts: opts,
            });
        }
        else {
            const initializer = WorkspaceInitFactory_1.WorkspaceInitFactory.create();
            if (initializer && initializer.onWorkspaceActivate) {
                initializer.onWorkspaceActivate({
                    skipOpts: opts,
                });
            }
        }
        return { data: true };
    }
    async initCodeWorkspace({ context, wsRoot }) {
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(context);
        const ws = new codeWorkspace_1.DendronCodeWorkspace({
            wsRoot,
            logUri: context.logUri,
            assetUri,
        });
        return ws;
    }
    async initNativeWorkspace({ context, wsRoot }) {
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(context);
        const ws = new nativeWorkspace_1.DendronNativeWorkspace({
            wsRoot,
            logUri: context.logUri,
            assetUri,
        });
        return ws;
    }
    async getOrPromptWsRoot({ ext, }) {
        if (ext.type === common_all_1.WorkspaceType.NATIVE) {
            const workspaceFolders = await engine_server_1.WorkspaceUtils.findWSRootsInWorkspaceFolders(workspace_1.DendronExtension.workspaceFolders());
            if (!workspaceFolders) {
                return;
            }
            const resp = await getOrPromptWSRoot(workspaceFolders);
            if (!lodash_1.default.isString(resp)) {
                return;
            }
            return resp;
        }
        else {
            return path_1.default.dirname(workspace_1.DendronExtension.workspaceFile().fsPath);
        }
    }
    /**
     * Return true if we started a server process
     * @returns
     */
    async verifyOrStartServerProcess({ ext, wsService, }) {
        const context = ext.context;
        const start = process.hrtime();
        if (ext.port) {
            return ext.port;
        }
        const { port, subprocess } = await ExtensionUtils_1.ExtensionUtils.startServerProcess({
            context,
            start,
            wsService,
            onExit: (type) => {
                const txt = "Restart Dendron";
                vscode.window
                    .showErrorMessage("Dendron engine encountered an error", txt)
                    .then(async (resp) => {
                    if (resp === txt) {
                        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.ServerCrashed, {
                            code: type,
                        });
                        await ExtensionUtils_1.ExtensionUtils.activate();
                    }
                });
            },
        });
        ext.port = lodash_1.default.toInteger(port);
        ext.serverProcess = subprocess /* TODO: exactOptional + execa childprocess | undef interop on IDendronExtension.serverProcess (d.ts widened); Batch 5 debug launch sweep 2026-05-31 (per Strict-Fixer plan on _extension/activator/Partial opts + user mandate to 0 + full test + Clean Host smoke + merge); see 4-axis + prior M2 cast notes */;
        return ext.port;
    }
}
exports.WorkspaceActivator = WorkspaceActivator;
//# sourceMappingURL=workspaceActivator.js.map