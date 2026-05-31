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
exports.DendronExtension = exports.NO_WORKSPACE_IMPLEMENTATION = void 0;
exports.whenGlobalState = whenGlobalState;
exports.getDWorkspace = getDWorkspace;
exports.getExtension = getExtension;
exports.getEngine = getEngine;
exports.resolveRelToWSRoot = resolveRelToWSRoot;
exports.getVaultFromUri = getVaultFromUri;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const pods_core_1 = require("@dendronhq/pods-core");
const Sentry = __importStar(require("@sentry/node"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const LookupControllerV3Factory_1 = require("./components/lookup/LookupControllerV3Factory");
const LookupProviderV3Factory_1 = require("./components/lookup/LookupProviderV3Factory");
const PreviewViewFactory_1 = require("./components/views/PreviewViewFactory");
const constants_1 = require("./constants");
const ExtensionProvider_1 = require("./ExtensionProvider");
const BacklinksTreeDataProvider_1 = __importDefault(require("./features/BacklinksTreeDataProvider"));
const TipOfTheDayWebview_1 = __importDefault(require("./features/TipOfTheDayWebview"));
const fileWatcher_1 = require("./fileWatcher");
const logger_1 = require("./logger");
const CommandRegistrar_1 = require("./services/CommandRegistrar");
const NoteTraitManager_1 = require("./services/NoteTraitManager");
const SchemaSyncService_1 = require("./services/SchemaSyncService");
const AllFeatureShowcases_1 = require("./showcase/AllFeatureShowcases");
const IFeatureShowcaseMessage_1 = require("./showcase/IFeatureShowcaseMessage");
const utils_1 = require("./utils");
const analytics_1 = require("./utils/analytics");
const versionProvider_1 = require("./versionProvider");
const CalendarView_1 = require("./views/CalendarView");
const GraphPanel_1 = require("./views/GraphPanel");
const SampleView_1 = require("./views/SampleView");
const vsCodeUtils_1 = require("./vsCodeUtils");
const windowWatcher_1 = require("./windowWatcher");
const WorkspaceWatcher_1 = require("./WorkspaceWatcher");
const WSUtilsV2_1 = require("./WSUtilsV2");
let _DendronWorkspace;
function whenGlobalState(key, cb) {
    cb =
        cb ||
            function alwaysTrue() {
                return true;
            };
    // @ts-ignore
    const out = getExtension().getGlobalState(key);
    if (!(out === false || lodash_1.default.isUndefined(out))) {
        return cb();
    }
    return false;
}
/**
 * @deprecated: If need static access use ExtensionProvider.getDWorkspace().
 * Or preferably pass IDendronExtension to constructors of your classes. */
function getDWorkspace() {
    const ws = getExtension();
    return ws.getWorkspaceImplOrThrow();
}
/**
 * @deprecated: If need static access use ExtensionProvider.getExtension().
 * Or preferably pass IDendronExtension to constructors of your classes.
 * */
function getExtension() {
    return DendronExtension.instanceV2();
}
/**
 * @deprecated: If need static access use ExtensionProvider.getEngine().
 * Or preferably pass IDendronExtension to constructors of your classes.*/
function getEngine() {
    return getExtension().getEngine();
}
function resolveRelToWSRoot(fpath) {
    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    return (0, common_server_1.resolvePath)(fpath, wsRoot);
}
/** Given file uri that is within a vault within the current workspace returns the vault. */
function getVaultFromUri(fileUri) {
    return WSUtilsV2_1.WSUtilsV2.instance().getVaultFromUri(fileUri);
}
exports.NO_WORKSPACE_IMPLEMENTATION = "no workspace implementation";
// --- Main
class DendronExtension {
    static DENDRON_WORKSPACE_FILE = "dendron.code-workspace";
    static _SERVER_CONFIGURATION;
    _engine;
    _disposableStore;
    _traitRegistrar;
    L;
    backlinksDataProvider;
    fileWatcher;
    port;
    workspaceService;
    schemaSyncService;
    lookupControllerFactory;
    noteLookupProviderFactory;
    schemaLookupProviderFactory;
    context;
    windowWatcher;
    serverWatcher;
    type;
    workspaceImpl;
    wsUtils;
    noteRefCommentController;
    _inlineNoteRefs = new common_all_1.DefaultMap(() => new Map());
    static context() {
        return getExtension().context;
    }
    static instanceV2() {
        if (!_DendronWorkspace) {
            throw Error("Dendronworkspace not initialized");
        }
        return _DendronWorkspace;
    }
    static serverConfiguration() {
        if (!DendronExtension._SERVER_CONFIGURATION) {
            DendronExtension._SERVER_CONFIGURATION = {};
        }
        return DendronExtension._SERVER_CONFIGURATION;
    }
    /**
     * @deprecated: For static access, use ExtensionProvider.getWorkspaceConfig().
     * Or preferably pass IDendronExtension to constructors of your classes.
     *
     * Global Workspace configuration
     */
    static configuration(section) {
        // the reason this is static is so we can stub it for tests
        return vscode.workspace.getConfiguration(section);
    }
    get traitRegistrar() {
        // Lazy initialize the traits service - only set up note traits after
        // workspaceImpl has been set, so that the wsRoot path is known for locating
        // the note trait definition location.
        if (!this._traitRegistrar) {
            const { wsRoot } = this.getDWorkspace();
            this._traitRegistrar = new NoteTraitManager_1.NoteTraitManager(wsRoot, new CommandRegistrar_1.CommandRegistrar(this));
            this.context.subscriptions.push(this._traitRegistrar);
        }
        return this._traitRegistrar;
    }
    async pauseWatchers(cb) {
        const ctx = "pauseWatchers";
        if (this.fileWatcher) {
            this.fileWatcher.pause = true;
        }
        try {
            const out = await cb();
            return out;
        }
        catch (err) {
            logger_1.Logger.error({ ctx, error: err });
            throw err;
        }
        finally {
            if (this.fileWatcher) {
                this.fileWatcher.pause = false;
            }
        }
    }
    async getClientAPIRootUrl() {
        const port = this.port;
        if (!port) {
            throw common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.ENGINE_NOT_SET,
            });
        }
        // asExternalUri forwards the port when working remotely
        const externalUri = await vscode.env.asExternalUri(vscode.Uri.parse(common_all_1.APIUtils.getLocalEndpoint(port)));
        const uri = externalUri.toString();
        return uri;
    }
    /**
     * Workspace settings file. Warning, this doesn't exist in all workspaces!
     *
     * Warning! This function will throw when used in a Native Workspace. Make
     * sure to use it in a try...catch block unless you're sure you are running in
     * a Code Workspace.
     */
    static workspaceFile() {
        if (!vscode.workspace.workspaceFile) {
            throw Error("no workspace file");
        }
        return vscode.workspace.workspaceFile;
    }
    /** Get the workspace settings file, unless it's a native workspace where we may not have one. */
    static tryWorkspaceFile() {
        return vscode.workspace.workspaceFile;
    }
    static workspaceFolders() {
        return vscode.workspace.workspaceFolders;
    }
    static async workspaceRoots() {
        try {
            return [path_1.default.dirname(this.workspaceFile().fsPath)];
        }
        catch {
            const workspaceFolders = this.workspaceFolders();
            if (workspaceFolders)
                return engine_server_1.WorkspaceUtils.findWSRootsInWorkspaceFolders(workspaceFolders);
        }
        return [];
    }
    /** Checks if the current workspace open in VSCode is a Dendron workspace or not. */
    static async isDendronWorkspace() {
        // we do a try catch because `DendronWorkspace.workspaceFile` throws an error if workspace file doesn't exist
        try {
            // code workspace takes precedence, if code workspace, return
            if (vscode.workspace.workspaceFile &&
                path_1.default.basename(DendronExtension.workspaceFile().fsPath) ===
                    this.DENDRON_WORKSPACE_FILE)
                return true;
            const workspaceFolders = DendronExtension.workspaceFolders();
            if (workspaceFolders) {
                return !lodash_1.default.isEmpty(await engine_server_1.WorkspaceUtils.findWSRootsInWorkspaceFolders(workspaceFolders));
            }
            return false;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * @deprecated: For static access, use ExtensionProvider.isActive().
     * Or preferably pass IDendronExtension to constructors of your classes.
     *
     * Checks if a Dendron workspace is currently active.
     */
    static isActive(_context) {
        const ctx = "DendronExtension.isActive";
        try {
            //
            const { wsRoot } = getDWorkspace();
            if (fs_extra_1.default.existsSync(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))) {
                return true;
            }
        }
        catch (err) {
            // If no workspace implementation is available, then workspace is not active
            if (err?.payload === exports.NO_WORKSPACE_IMPLEMENTATION)
                return false;
            // Otherwise, that's an unexpected error and we should capture that
            const error = err instanceof common_all_1.DendronError
                ? err
                : new common_all_1.DendronError({ message: ctx, payload: err });
            Sentry.captureException(error);
            logger_1.Logger.error({ ctx, msg: "Failed to check WS active", error });
            return false;
        }
        return false;
    }
    async isActiveAndIsDendronNote(fpath) {
        if (!this.isActive()) {
            return false;
        }
        const { wsRoot, vaults } = this.getDWorkspace();
        return engine_server_1.WorkspaceUtils.isDendronNote({
            wsRoot,
            vaults,
            fpath,
        });
    }
    /**
     * When in dev mode, version is equivalent to `package.json` that is checked out locally
     * Otherwise, get from published extension `package.json`
     */
    static version() {
        return versionProvider_1.VersionProvider.version();
    }
    static async resetConfig(globalState) {
        // eslint-disable-next-line  no-return-await
        return await Promise.all(lodash_1.default.keys(constants_1.GLOBAL_STATE).map((k) => {
            const _key = constants_1.GLOBAL_STATE[k];
            return globalState.update(_key, undefined);
        }));
    }
    static async getOrCreate(context, opts) {
        if (!_DendronWorkspace) {
            _DendronWorkspace = new DendronExtension(context, opts);
            _DendronWorkspace.type = await engine_server_1.WorkspaceUtils.getWorkspaceType({
                workspaceFile: vscode.workspace.workspaceFile ?? undefined /* TODO: vscode.Uri vs URI + exactOptional at getWorkspaceType boundary; Batch 5+ final; 4-axis */,
                workspaceFolders: vscode.workspace.workspaceFolders ?? undefined /* TODO: exactOptional + WorkspaceFolderCode subtype interop at getWorkspaceType call; Batch 5+ final wave; see Monorepo 4-axis */,
            });
            ExtensionProvider_1.ExtensionProvider.register(_DendronWorkspace);
        }
        return _DendronWorkspace;
    }
    constructor(context, opts) {
        opts = lodash_1.default.defaults(opts, { skipSetup: false });
        this.context = context;
        // set the default
        this.type = common_all_1.WorkspaceType.CODE;
        _DendronWorkspace = this;
        this.L = logger_1.Logger;
        this._disposableStore = new utils_1.DisposableStore();
        this.setupViews(context);
        this.wsUtils = new WSUtilsV2_1.WSUtilsV2(this);
        this.schemaSyncService = new SchemaSyncService_1.SchemaSyncService(this);
        this.lookupControllerFactory = new LookupControllerV3Factory_1.LookupControllerV3Factory(this);
        this.noteLookupProviderFactory = new LookupProviderV3Factory_1.NoteLookupProviderFactory(this);
        this.schemaLookupProviderFactory = new LookupProviderV3Factory_1.SchemaLookupProviderFactory(this);
        this.noteRefCommentController = vscode.comments.createCommentController("noteRefs", "Show note refs");
        const ctx = "DendronExtension";
        this.L.info({ ctx, msg: "initialized" });
    }
    getDWorkspace() {
        return this.getWorkspaceImplOrThrow();
    }
    getWorkspaceImplOrThrow() {
        if (lodash_1.default.isUndefined(this.workspaceImpl)) {
            throw new common_all_1.DendronError({
                message: "no native workspace",
                payload: exports.NO_WORKSPACE_IMPLEMENTATION,
            });
        }
        return this.workspaceImpl;
    }
    getCommentThreadsState() {
        return {
            inlineNoteRefs: this._inlineNoteRefs,
        };
    }
    /**
     * @deprecated Use {@link VSCodeUtils.getWorkspaceConfig} instead.
     */
    getWorkspaceConfig(section) {
        return vsCodeUtils_1.VSCodeUtils.getWorkspaceConfig(section);
    }
    isActive() {
        return DendronExtension.isActive();
    }
    /** For Native workspaces (without .code-workspace file) this will return undefined. */
    async getWorkspaceSettings() {
        const ctx = "DendronExtension.getWorkspaceSettings";
        const workspaceFile = DendronExtension.tryWorkspaceFile();
        if (!workspaceFile)
            return undefined;
        const resp = await engine_server_1.WorkspaceUtils.getCodeWorkspaceSettings(path_1.default.dirname(workspaceFile.fsPath));
        if (resp.error) {
            logger_1.Logger.warn({ ctx, err: resp.error });
            return undefined;
        }
        else {
            return resp.data;
        }
    }
    getWorkspaceSettingsSync() {
        const ctx = "DendronExtension.getWorkspaceSettingsSync";
        const workspaceFile = DendronExtension.tryWorkspaceFile();
        if (!workspaceFile)
            return undefined;
        const resp = engine_server_1.WorkspaceUtils.getCodeWorkspaceSettingsSync(path_1.default.dirname(workspaceFile.fsPath));
        if (resp.error) {
            logger_1.Logger.warn({ ctx, err: resp.error });
            return undefined;
        }
        else {
            return resp.data;
        }
    }
    getDendronWorkspaceSettingsSync() {
        const settings = this.getWorkspaceSettingsSync()?.settings;
        return settings;
    }
    getWorkspaceSettingOrDefault({ wsConfigKey, dendronConfigKey, }) {
        const config = getDWorkspace().config;
        // user already using new value
        if (lodash_1.default.get(config, dendronConfigKey)) {
            return lodash_1.default.get(config, dendronConfigKey);
        }
        // migrate value from workspace setting. if not exist, migrate from new default
        const out = lodash_1.default.get(this.getDendronWorkspaceSettingsSync(), wsConfigKey, lodash_1.default.get(common_all_1.ConfigUtils.genDefaultConfig(), dendronConfigKey));
        // this should not happen
        if (lodash_1.default.isUndefined(out)) {
            throw new common_all_1.DendronError({
                message: `no config key found. workspace: ${wsConfigKey}, dendron.yml: ${dendronConfigKey}`,
            });
        }
        return out;
    }
    get podsDir() {
        const rootDir = getDWorkspace().wsRoot;
        if (!rootDir) {
            throw new Error(`rootdir not set when get podsDir`);
        }
        const podsPath = pods_core_1.PodUtils.getPodDir({ wsRoot: rootDir });
        fs_extra_1.default.ensureDirSync(podsPath);
        return podsPath;
    }
    /**
     * The first workspace folder
     */
    get rootWorkspace() {
        const wsFolders = DendronExtension.workspaceFolders();
        if (lodash_1.default.isEmpty(wsFolders) || lodash_1.default.isUndefined(wsFolders)) {
            throw Error("no ws folders");
        }
        return wsFolders[0];
    }
    getEngine() {
        if (!this._engine) {
            throw Error("engine not set");
        }
        return this._engine;
    }
    setEngine(engine) {
        this._engine = engine;
        this.getWorkspaceImplOrThrow().engine = engine;
    }
    async setupViews(context) {
        const ctx = "setupViews";
        engine_server_1.HistoryService.instance().subscribe("extension", async (event) => {
            if (event.action === "initialized") {
                logger_1.Logger.info({ ctx, msg: "init:treeViewV2" });
                const sampleView = new SampleView_1.SampleView();
                context.subscriptions.push(vscode.window.registerWebviewViewProvider(SampleView_1.SampleView.viewType, sampleView));
                const calendarView = new CalendarView_1.CalendarView(this);
                context.subscriptions.push(vscode.window.registerWebviewViewProvider(CalendarView_1.CalendarView.viewType, calendarView));
                // backlinks
                const backlinkTreeView = this.setupBacklinkTreeView();
                // Tip of the Day
                const tipOfDayView = this.setupTipOfTheDayView();
                // Graph panel (side)
                const graphPanel = this.setupGraphPanel();
                context.subscriptions.push(backlinkTreeView);
                context.subscriptions.push(tipOfDayView);
                context.subscriptions.push(graphPanel);
            }
        });
    }
    setupTipOfTheDayView() {
        const featureShowcaseWebview = new TipOfTheDayWebview_1.default(lodash_1.default.filter(AllFeatureShowcases_1.ALL_FEATURE_SHOWCASES, (message) => message.shouldShow(IFeatureShowcaseMessage_1.DisplayLocation.TipOfTheDayView)));
        return vscode.window.registerWebviewViewProvider(common_all_1.DendronTreeViewKey.TIP_OF_THE_DAY, featureShowcaseWebview);
    }
    setupBacklinkTreeView() {
        const ctx = "setupBacklinkTreeView";
        logger_1.Logger.info({ ctx, msg: "init:backlinks" });
        const config = this.getDWorkspace().config;
        const backlinksTreeDataProvider = new BacklinksTreeDataProvider_1.default(this.getEngine(), config);
        const backlinkTreeView = vscode.window.createTreeView(common_all_1.DendronTreeViewKey.BACKLINKS, {
            treeDataProvider: backlinksTreeDataProvider,
            showCollapseAll: true,
        });
        backlinkTreeView.onDidExpandElement(() => {
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
                type: "ExpandElement",
            });
        });
        backlinkTreeView.onDidChangeVisibility((e) => {
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
                type: "VisibilityChanged",
                state: e.visible ? "Visible" : "Collapsed",
            });
        });
        this.backlinksDataProvider = backlinksTreeDataProvider;
        this.context.subscriptions.push(backlinksTreeDataProvider);
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.BACKLINK_SORT_BY_LAST_UPDATED.key, (0, analytics_1.sentryReportingCallback)(() => {
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
                type: "SortOrderChanged",
                state: "SortByLastUpdated",
            });
            backlinksTreeDataProvider.sortOrder =
                common_all_1.BacklinkPanelSortOrder.LastUpdated;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.BACKLINK_SORT_BY_PATH_NAMES.key, (0, analytics_1.sentryReportingCallback)(() => {
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
                type: "SortOrderChanged",
                state: "SortByPathName",
            });
            backlinksTreeDataProvider.sortOrder = common_all_1.BacklinkPanelSortOrder.PathNames;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.BACKLINK_SORT_BY_LAST_UPDATED_CHECKED.key, (0, analytics_1.sentryReportingCallback)(() => {
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
                type: "SortOrderChanged",
                state: "SortByLastUpdated",
            });
            backlinksTreeDataProvider.sortOrder =
                common_all_1.BacklinkPanelSortOrder.LastUpdated;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.BACKLINK_SORT_BY_PATH_NAMES_CHECKED.key, (0, analytics_1.sentryReportingCallback)(() => {
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
                type: "SortOrderChanged",
                state: "SortByPathName",
            });
            backlinksTreeDataProvider.sortOrder = common_all_1.BacklinkPanelSortOrder.PathNames;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.BACKLINK_EXPAND_ALL.key, (0, analytics_1.sentryReportingCallback)(async () => {
            function expand(backlink) {
                backlinkTreeView.reveal(backlink, {
                    expand: true,
                    focus: false,
                    select: false,
                });
            }
            const children = await backlinksTreeDataProvider.getChildren();
            children?.forEach((backlink) => {
                expand(backlink);
            });
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GOTO_BACKLINK.key, (uri, options, isCandidate) => {
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
                type: "BacklinkClicked",
                state: isCandidate === true ? "Candidate" : "Link",
            });
            vscode.commands.executeCommand("vscode.open", uri, options);
        });
        return backlinkTreeView;
    }
    setupGraphPanel() {
        const graphPanel = new GraphPanel_1.GraphPanel(this);
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_INCREASE_DEPTH.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.increaseGraphDepth();
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_DECREASE_DEPTH.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.decreaseGraphDepth();
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_SHOW_BACKLINKS_CHECKED.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.showBacklinks = false;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_SHOW_BACKLINKS.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.showBacklinks = true;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_SHOW_OUTWARD_LINKS_CHECKED.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.showOutwardLinks = false;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_SHOW_OUTWARD_LINKS.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.showOutwardLinks = true;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_SHOW_HIERARCHY_CHECKED.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.showHierarchy = false;
        }));
        vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GRAPH_PANEL_SHOW_HIERARCHY.key, (0, analytics_1.sentryReportingCallback)(() => {
            graphPanel.showHierarchy = true;
        }));
        return vscode.window.registerWebviewViewProvider(GraphPanel_1.GraphPanel.viewType, graphPanel);
    }
    addDisposable(disposable) {
        // handle all disposables
        this._disposableStore.add(disposable);
    }
    // === Workspace
    /**
     * - get workspace config and workspace folder
     * - activate workspacespace watchers
     */
    async activateWatchers() {
        const ctx = "activateWorkspace";
        const stage = (0, common_all_1.getStage)();
        this.L.info({ ctx, stage, msg: "enter" });
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        if (!wsRoot) {
            throw new Error(`rootDir not set when activating Watcher`);
        }
        const windowWatcher = new windowWatcher_1.WindowWatcher({
            extension: this,
            previewProxy: PreviewViewFactory_1.PreviewPanelFactory.create(this),
        });
        windowWatcher.activate();
        for (const editor of vscode.window.visibleTextEditors) {
            windowWatcher.triggerUpdateDecorations(editor);
        }
        this.windowWatcher = windowWatcher;
        const workspaceWatcher = new WorkspaceWatcher_1.WorkspaceWatcher({
            schemaSyncService: this.schemaSyncService,
            extension: this,
            windowWatcher,
        });
        workspaceWatcher.activate(this.context);
        const wsFolders = DendronExtension.workspaceFolders();
        if (lodash_1.default.isUndefined(wsFolders) || lodash_1.default.isEmpty(wsFolders)) {
            this.L.info({
                ctx,
                msg: "no folders set for workspace",
            });
        }
        const fileWatcher = new fileWatcher_1.FileWatcher({
            workspaceOpts: {
                wsRoot,
                vaults,
            },
        });
        fileWatcher.activate(ExtensionProvider_1.ExtensionProvider.getExtension().context);
        this.fileWatcher = fileWatcher;
    }
    async deactivate() {
        const ctx = "deactivateWorkspace";
        this.L.info({ ctx });
        this._disposableStore.dispose();
    }
}
exports.DendronExtension = DendronExtension;
//# sourceMappingURL=workspace.js.map