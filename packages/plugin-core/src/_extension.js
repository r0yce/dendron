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
exports.activate = activate;
exports._activate = _activate;
exports.deactivate = deactivate;
require("reflect-metadata"); // This needs to be the topmost import for tsyringe to work
/**
 * TypeScript 5.5+ Upgrade Note:
 * Legacy decorators + tsyringe now require // @ts-expect-error on many @inject sites
 * due to stricter decorator signature checking.
 * This is a known temporary modernization cost. See docs/dev/09-TYPESCRIPT-UPGRADE-PLAN.md
 */
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const Sentry = __importStar(require("@sentry/node"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const commands_1 = require("./commands");
const ConfigureWithUICommand_1 = require("./commands/ConfigureWithUICommand");
const GoToSiblingCommand_1 = require("./commands/GoToSiblingCommand");
const ReloadIndex_1 = require("./commands/ReloadIndex");
const SeedAddCommand_1 = require("./commands/SeedAddCommand");
const SeedBrowseCommand_1 = require("./commands/SeedBrowseCommand");
const SeedRemoveCommand_1 = require("./commands/SeedRemoveCommand");
const ShowNoteGraph_1 = require("./commands/ShowNoteGraph");
const TogglePreview_1 = require("./commands/TogglePreview");
const TogglePreviewLock_1 = require("./commands/TogglePreviewLock");
const ShowSchemaGraph_1 = require("./commands/ShowSchemaGraph");
const ConfigureUIPanelFactory_1 = require("./components/views/ConfigureUIPanelFactory");
const NoteGraphViewFactory_1 = require("./components/views/NoteGraphViewFactory");
const PreviewViewFactory_1 = require("./components/views/PreviewViewFactory");
const SchemaGraphViewFactory_1 = require("./components/views/SchemaGraphViewFactory");
const constants_1 = require("./constants");
const codeActionProvider_1 = require("./features/codeActionProvider");
const completionProvider_1 = require("./features/completionProvider");
const DefinitionProvider_1 = __importDefault(require("./features/DefinitionProvider"));
const FrontmatterFoldingRangeProvider_1 = __importDefault(require("./features/FrontmatterFoldingRangeProvider"));
const HelpFeedbackTreeview_1 = __importDefault(require("./features/HelpFeedbackTreeview"));
const RecentWorkspacesTreeview_1 = __importDefault(require("./features/RecentWorkspacesTreeview"));
const ReferenceHoverProvider_1 = __importDefault(require("./features/ReferenceHoverProvider"));
const ReferenceProvider_1 = __importDefault(require("./features/ReferenceProvider"));
const RenameProvider_1 = __importDefault(require("./features/RenameProvider"));
const KeybindingUtils_1 = require("./KeybindingUtils");
const setupLocalExtContainer_1 = require("./injection-providers/setupLocalExtContainer");
const logger_1 = require("./logger");
const stateService_1 = require("./services/stateService");
const settings_1 = require("./settings");
const FeatureShowcaseToaster_1 = require("./showcase/FeatureShowcaseToaster");
const analytics_1 = require("./utils/analytics");
const ExtensionUtils_1 = require("./utils/ExtensionUtils");
const StartupPrompts_1 = require("./utils/StartupPrompts");
const StartupUtils_1 = require("./utils/StartupUtils");
const vsCodeUtils_1 = require("./vsCodeUtils");
const WelcomeUtils_1 = require("./WelcomeUtils");
const workspace_1 = require("./workspace");
const tutorialInitializer_1 = require("./workspace/tutorialInitializer");
const workspaceActivator_1 = require("./workspace/workspaceActivator");
const WSUtils_1 = require("./WSUtils");
const CreateScratchNoteKeybindingTip_1 = require("./showcase/CreateScratchNoteKeybindingTip");
const semver_1 = __importDefault(require("semver"));
const lodash_1 = __importDefault(require("lodash"));
const GotoNote_1 = require("./commands/GotoNote");
const common_all_2 = require("@dendronhq/common-all");
const dev_1 = require("./utils/dev");
const MARKDOWN_WORD_PATTERN = new RegExp("([\\w\\.]+)");
// === Main
// this method is called when your extension is activated
function activate(context) {
    const stage = (0, common_all_1.getStage)();
    // override default word pattern
    vscode.languages.setLanguageConfiguration("markdown", {
        wordPattern: MARKDOWN_WORD_PATTERN,
    });
    if (stage !== "test") {
        _activate(context).catch((err) => {
            logger_1.Logger.error({
                ctx: "activate",
                error: err,
            });
            engine_server_1.HistoryService.instance().add({
                action: "not_initialized",
                source: "extension",
                data: { err },
            });
        });
    }
    return context;
}
// Only exported for test purposes ^jtm6bf7utsxy
async function _activate(context, opts) {
    const startActivate = process.hrtime();
    const isDebug = vsCodeUtils_1.VSCodeUtils.isDevMode();
    const ctx = "_activate";
    const stage = (0, common_all_1.getStage)();
    // Performance instrumentation (go-to-work fork)
    const activationTimer = new common_all_2.ActivationTimer();
    activationTimer.mark("after:env-setup");
    // Telemetry / Segment unlock
    activationTimer.mark("before:telemetry-setup");
    const { workspaceFile, workspaceFolders } = vscode.workspace;
    const logLevel = process.env["LOG_LEVEL"];
    const { extensionPath, extensionUri, logUri } = context;
    const stateService = new stateService_1.StateService({
        globalState: context.globalState,
        workspaceState: context.workspaceState,
    });
    logger_1.Logger.info({
        ctx,
        stage,
        isDebug,
        logLevel,
        logPath: logUri.fsPath,
        extensionPath,
        extensionUri: extensionUri.fsPath,
        workspaceFile: workspaceFile?.fsPath,
        workspaceFolders: workspaceFolders?.map((fd) => fd.uri.fsPath),
    });
    // At this point, the segment client has not been created yet.
    // We need to check here if the uuid has been set for future references
    // because the Segment client constructor will go ahead and create one if it doesn't exist.
    activationTimer.mark("after:telemetry-setup");
    const maybeUUIDPath = path_1.default.join(os_1.default.homedir(), common_all_1.CONSTANTS.DENDRON_ID);
    const UUIDPathExists = await fs_extra_1.default.pathExists(maybeUUIDPath);
    // this is the first time we are accessing the segment client instance.
    // unlock Segment client.
    common_server_1.SegmentClient.unlock();
    // If telemetry is not disabled, we enable telemetry and error reporting ^rw8l1w51hnjz
    // - NOTE: we do this outside of the try/catch block in case we run into an error with initialization
    if (!common_server_1.SegmentClient.instance().hasOptedOut && (0, common_all_1.getStage)() === "prod") {
        (0, common_server_1.initializeSentry)({
            environment: (0, common_all_1.getStage)(),
            sessionId: analytics_1.AnalyticsUtils.getSessionId(),
            release: analytics_1.AnalyticsUtils.getVSCodeSentryRelease(),
        });
        // Temp: store the user's anonymous ID into global state so that we can link
        // local ext users to web ext users. If one already exists in global state,
        // then override that one with the segment client one.
        context.globalState.setKeysForSync([common_all_1.GLOBAL_STATE_KEYS.ANONYMOUS_ID]);
        const segmentAnonymousId = common_server_1.SegmentClient.instance().anonymousId;
        const globalStateId = context.globalState.get(common_all_1.GLOBAL_STATE_KEYS.ANONYMOUS_ID);
        if (globalStateId !== segmentAnonymousId) {
            if (globalStateId) {
                analytics_1.AnalyticsUtils.track(common_all_1.WorkspaceEvents.MultipleTelemetryIdsDetected, {
                    ids: [segmentAnonymousId, globalStateId],
                });
            }
            context.globalState.update(common_all_1.GLOBAL_STATE_KEYS.ANONYMOUS_ID, common_server_1.SegmentClient.instance().anonymousId);
        }
    }
    try {
        // Setup the workspace trust callback to detect changes from the user's
        // workspace trust settings
        // This version check is a temporary, one-release patch to try to unblock
        // users who are on old versions of VS Code.
        vscode.workspace.onDidGrantWorkspaceTrust(() => {
            (0, workspace_1.getExtension)().getEngine().trustedWorkspace = vscode.workspace.isTrusted;
        });
        //  needs to be initialized to setup commands
        const ws = await workspace_1.DendronExtension.getOrCreate(context, {
            skipSetup: stage === "test",
        });
        activationTimer.mark("after:extension-singleton");
        const existingCommands = await vscode.commands.getCommands();
        // Setup the commands
        await _setupCommands({ ext: ws, context, requireActiveWorkspace: false });
        // Order matters. Need to register `Reload Index` command before activating workspace
        // Workspace activation calls `RELOAD_INDEX` via {@link WSUtils.reloadWorkspace}
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.RELOAD_INDEX.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.RELOAD_INDEX.key, (0, analytics_1.sentryReportingCallback)(async (silent) => {
                const out = await new ReloadIndex_1.ReloadIndexCommand().run({ silent: silent });
                if (!silent) {
                    vscode.window.showInformationMessage(`finish reload`);
                }
                return out;
            })));
        }
        await _setupCommands({ ext: ws, context, requireActiveWorkspace: true });
        if (!opts?.skipLanguageFeatures) {
            _setupLanguageFeatures(context);
        }
        // Need to recompute this for tests, because the instance of DendronExtension doesn't get re-created.
        // Probably also needed if the user switches from one workspace to the other.
        ws.type = await engine_server_1.WorkspaceUtils.getWorkspaceType({
            workspaceFile: vscode.workspace.workspaceFile,
            workspaceFolders: vscode.workspace.workspaceFolders,
        });
        // Also need to reset the implementation here for testing. Doing it in all
        // cases because if the extension is activated, we'll recreate it while
        // activating the workspace
        ws.workspaceImpl = undefined;
        const currentVersion = workspace_1.DendronExtension.version();
        const previousWorkspaceVersionFromState = stateService.getWorkspaceVersion();
        const previousGlobalVersion = engine_server_1.MetadataService.instance().getGlobalVersion();
        const { extensionInstallStatus, isSecondaryInstall } = ExtensionUtils_1.ExtensionUtils.getAndTrackInstallStatus({
            UUIDPathExists,
            currentVersion,
            previousGlobalVersion,
        });
        if (!isSecondaryInstall &&
            extensionInstallStatus === common_all_1.InstallStatus.INITIAL_INSTALL) {
            // For new users, we want to load graph with new graph themes as default
            let graphTheme;
            const ABUserGroup = common_all_1.GRAPH_THEME_TEST.getUserGroup(common_server_1.SegmentClient.instance().anonymousId);
            switch (ABUserGroup) {
                case common_all_1.GraphThemeTestGroups.monokai: {
                    graphTheme = common_all_1.GraphThemeEnum.Monokai;
                    break;
                }
                case common_all_1.GraphThemeTestGroups.block: {
                    graphTheme = common_all_1.GraphThemeEnum.Block;
                    break;
                }
                default:
                    graphTheme = common_all_1.GraphThemeEnum.Classic;
            }
            analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphThemeChanged, {
                setDuringInstall: true,
            });
            engine_server_1.MetadataService.instance().setGraphTheme(graphTheme);
        }
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(context);
        logger_1.Logger.info({
            ctx,
            msg: "initializeWorkspace",
            wsType: ws.type,
            currentVersion,
            previousGlobalVersion,
            extensionInstallStatus,
        });
        // Setup the help and feedback and recent workspaces views here so that it still works even if
        // we're not in a Dendron workspace.
        context.subscriptions.push((0, HelpFeedbackTreeview_1.default)());
        context.subscriptions.push((0, RecentWorkspacesTreeview_1.default)());
        if (await workspace_1.DendronExtension.isDendronWorkspace()) {
            const activator = new workspaceActivator_1.WorkspaceActivator();
            const maybeWsRoot = await activator.getOrPromptWsRoot({
                ext: ws,
                context,
            });
            if (!maybeWsRoot) {
                return false;
            }
            const resp = await activator.init({
                ext: ws,
                context,
                wsRoot: maybeWsRoot,
            });
            if (resp.error) {
                return false;
            }
            const wsImpl = resp.data.workspace;
            // setup extension container
            (0, setupLocalExtContainer_1.setupLocalExtContainer)({
                wsRoot: maybeWsRoot,
                vaults: wsImpl.vaults,
                engine: resp.data.engine,
            });
            // initialize Segment client
            analytics_1.AnalyticsUtils.setupSegmentWithCacheFlush({ context, ws: wsImpl });
            // show interactive elements when **extension starts**
            if (!opts?.skipInteractiveElements) {
                // check if localhost is blocked
                StartupUtils_1.StartupUtils.showWhitelistingLocalhostDocsIfNecessary();
                // check for missing default config keys and prompt for a backfill.
                StartupUtils_1.StartupUtils.showMissingDefaultConfigMessageIfNecessary({
                    ext: ws,
                    extensionInstallStatus,
                });
                // check for deprecated config keys and prompt for removal.
                StartupUtils_1.StartupUtils.showDeprecatedConfigMessageIfNecessary({
                    ext: ws,
                    extensionInstallStatus,
                });
            }
            // Re-use the id for error reporting too:
            Sentry.setUser({ id: common_server_1.SegmentClient.instance().anonymousId });
            // stats
            const platform = (0, common_server_1.getOS)();
            const extensions = settings_1.Extensions.getDendronExtensionRecommendations().map(({ id, extension: ext }) => {
                return {
                    id,
                    version: ext?.packageJSON?.version,
                    active: ext?.isActive,
                };
            });
            logger_1.Logger.info({
                ctx: ctx + ":postSetupWorkspace",
                platform,
                extensions,
                vaults: wsImpl.vaults,
            });
            // --- Start Initializating the Engine
            const wsService = resp.data.wsService;
            const respActivate = await activator.activate({
                ext: ws,
                context,
                wsRoot: maybeWsRoot,
                engine: resp.data.engine,
                wsService,
                opts,
            });
            activationTimer.mark("after:workspace-activator");
            if (respActivate.error) {
                return false;
            }
            if (!opts?.skipInteractiveElements) {
                // on first install, warn if extensions are incompatible ^dlx35gstwsun
                if (extensionInstallStatus === common_all_1.InstallStatus.INITIAL_INSTALL) {
                    StartupUtils_1.StartupUtils.warnIncompatibleExtensions({ ext: ws });
                }
                // Show the feature showcase toast one minute after initialization.
                const ONE_MINUTE_IN_MS = 60_000;
                setTimeout(() => {
                    const showcase = new FeatureShowcaseToaster_1.FeatureShowcaseToaster();
                    // Temporarily show the new toast instead of the rest.
                    // for subsequent sessions this will not be shown as it already has been shown.
                    // TODO: remove this special treatment after 1~2 weeks.
                    let hasShown = false;
                    // only show for users installed prior to v113
                    const firstInstallVersion = engine_server_1.MetadataService.instance().firstInstallVersion;
                    if (firstInstallVersion === undefined ||
                        semver_1.default.lt(firstInstallVersion, "0.113.0")) {
                        hasShown = showcase.showSpecificToast(new CreateScratchNoteKeybindingTip_1.CreateScratchNoteKeybindingTip());
                    }
                    if (!hasShown) {
                        showcase.showToast();
                    }
                }, ONE_MINUTE_IN_MS);
            }
        }
        else {
            // ws not active
            logger_1.Logger.info({ ctx, msg: "dendron not active" });
            analytics_1.AnalyticsUtils.setupSegmentWithCacheFlush({ context });
            Sentry.setUser({ id: common_server_1.SegmentClient.instance().anonymousId });
        }
        if (extensionInstallStatus === common_all_1.InstallStatus.INITIAL_INSTALL) {
            // if keybinding conflict is detected, let the users know and guide them how to resolve  ^rikhd9cc0rwb
            await KeybindingUtils_1.KeybindingUtils.maybePromptKeybindingConflict();
            // if user hasn't opted out of telemetry, notify them about it ^njhii5plxmxr
            if (!common_server_1.SegmentClient.instance().hasOptedOut) {
                analytics_1.AnalyticsUtils.showTelemetryNotice();
            }
        }
        if (!opts?.skipInteractiveElements) {
            await showWelcomeOrWhatsNew({
                extensionInstallStatus,
                isSecondaryInstall,
                version: workspace_1.DendronExtension.version(),
                previousExtensionVersion: previousWorkspaceVersionFromState,
                start: startActivate,
                assetUri,
                context,
            });
        }
        if (workspace_1.DendronExtension.isActive(context)) {
            engine_server_1.HistoryService.instance().add({
                source: "extension",
                action: "activate",
            });
            // If automaticallyShowPreview = true, display preview panel on start up
            const note = await WSUtils_1.WSUtils.getActiveNote();
            if (note &&
                ws.workspaceService?.config.preview?.automaticallyShowPreview) {
                await PreviewViewFactory_1.PreviewPanelFactory.create((0, workspace_1.getExtension)()).show(note);
            }
            StartupUtils_1.StartupUtils.showUninstallMarkdownLinksExtensionMessage();
            activationTimer.mark("activate:success");
            logActivationReport(activationTimer);
            return true;
        }
        activationTimer.mark("activate:partial");
        logActivationReport(activationTimer);
        return false;
    }
    catch (error) {
        activationTimer.mark("activate:error");
        logActivationReport(activationTimer);
        Sentry.captureException(error);
        throw error;
    }
}
function logActivationReport(timer) {
    const isDev = (0, common_all_1.getStage)() === "dev" || process.env.DENDRON_PERF === "1" || process.env.LOG_LEVEL === "debug";
    timer.finish(); // always call finish
    if (!isDev) {
        return;
    }
    const report = timer.getDetailedReport();
    // Store for the new dev command
    (0, dev_1.setLastActivationReport)(report);
    // 1. Debug Console (what the user sees when attached)
    console.log(report);
    // 2. Clean dedicated "Dendron Dev" output channel (much nicer to read)
    const devChannel = (0, dev_1.getDevOutputChannel)();
    devChannel.clear();
    devChannel.appendLine(report);
    devChannel.show(true); // show but don't steal focus
    // 3. Also keep a compact version in the main Dendron channel
    logger_1.Logger.info({ ctx: "ActivationPerformance", totalMs: report.match(/Total: ([\d.]+)ms/)?.[1] ?? "unknown" });
}
function togglePluginActiveContext(enabled) {
    const ctx = "togglePluginActiveContext";
    logger_1.Logger.info({ ctx, state: `togglePluginActiveContext: ${enabled}` });
    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.PLUGIN_ACTIVE, enabled);
    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.HAS_CUSTOM_MARKDOWN_VIEW, enabled);
}
// this method is called when your extension is deactivated
function deactivate() {
    const ws = (0, workspace_1.getDWorkspace)();
    if (!engine_server_1.WorkspaceUtils.isNativeWorkspace(ws)) {
        (0, workspace_1.getExtension)().deactivate();
    }
    togglePluginActiveContext(false);
}
async function showWelcomeOrWhatsNew({ extensionInstallStatus, isSecondaryInstall, version, previousExtensionVersion, start, assetUri, context, }) {
    const ctx = "showWelcomeOrWhatsNew";
    logger_1.Logger.info({ ctx, version, previousExtensionVersion });
    const metadataService = engine_server_1.MetadataService.instance();
    switch (extensionInstallStatus) {
        case common_all_1.InstallStatus.INITIAL_INSTALL: {
            logger_1.Logger.info({
                ctx,
                msg: `extension, ${isSecondaryInstall
                    ? "initial install"
                    : "secondary install on new vscode instance"}`,
            });
            // Explicitly set the tutorial split test group in the Install event as
            // well, since Amplitude may not have the user props splitTest setup in time
            // before this install event reaches their backend.
            const group = tutorialInitializer_1.TutorialInitializer.getTutorialType();
            const installTrackProps = {
                duration: (0, common_server_1.getDurationMilliseconds)(start),
                isSecondaryInstall,
                tutorialGroup: group,
            };
            const { codeFolderCreated, ageOfCodeInstallInWeeks } = ExtensionUtils_1.ExtensionUtils.getCodeFolderCreated({
                context,
            });
            if (codeFolderCreated) {
                lodash_1.default.set(installTrackProps, "codeFolderCreated", codeFolderCreated);
            }
            if (ageOfCodeInstallInWeeks) {
                lodash_1.default.set(installTrackProps, "ageOfCodeInstallInWeeks", ageOfCodeInstallInWeeks);
            }
            // track how long install process took ^e8itkyfj2rn3
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.Install, installTrackProps);
            metadataService.setGlobalVersion(version);
            // show the welcome page ^ygtm7ofzezwd
            return (0, WelcomeUtils_1.showWelcome)(assetUri);
        }
        case common_all_1.InstallStatus.UPGRADED: {
            logger_1.Logger.info({
                ctx,
                msg: "extension, new version",
                version,
                previousExtensionVersion,
            });
            metadataService.setGlobalVersion(version);
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.Upgrade, {
                previousVersion: previousExtensionVersion,
                duration: (0, common_server_1.getDurationMilliseconds)(start),
            });
            const buttonAction = "See what's new";
            vscode.window
                .showInformationMessage(`Dendron has been upgraded to ${version}`, buttonAction)
                .then((resp) => {
                if (resp === buttonAction) {
                    analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.UpgradeSeeWhatsChangedClicked, {
                        previousVersion: previousExtensionVersion,
                        duration: (0, common_server_1.getDurationMilliseconds)(start),
                    });
                    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse("https://dendron.so/notes/9bc92432-a24c-492b-b831-4d5378c1692b.html"));
                }
            });
            break;
        }
        default:
            // no change
            break;
    }
    // Show lapsed users (users who have installed Dendron but haven't initialied
    // a workspace) a reminder prompt to re-engage them.
    StartupPrompts_1.StartupPrompts.showLapsedUserMessageIfNecessary({ assetUri });
}
async function _setupCommands({ ext, context, 
// If your command needs access to the engine at setup, requireActiveWorkspace should be set to true
requireActiveWorkspace, }) {
    const existingCommands = await vscode.commands.getCommands();
    // add all commands
    commands_1.ALL_COMMANDS.map((Cmd) => {
        // only process commands that match the filter
        if (Cmd.requireActiveWorkspace !== requireActiveWorkspace) {
            return;
        }
        const cmd = new Cmd(ext);
        if ((0, common_all_1.isDisposable)(cmd)) {
            context.subscriptions.push(cmd);
        }
        if (!existingCommands.includes(cmd.key))
            context.subscriptions.push(vscode.commands.registerCommand(cmd.key, (0, analytics_1.sentryReportingCallback)(async (args) => {
                await cmd.run(args);
            })));
    });
    // ---
    if (requireActiveWorkspace === true) {
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key, (0, analytics_1.sentryReportingCallback)(async () => {
                await new GoToSiblingCommand_1.GoToSiblingCommand().execute({ direction: "next" });
            })));
        }
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.GO_PREV_HIERARCHY.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.GO_PREV_HIERARCHY.key, (0, analytics_1.sentryReportingCallback)(async () => {
                await new GoToSiblingCommand_1.GoToSiblingCommand().execute({ direction: "prev" });
            })));
        }
        const preview = PreviewViewFactory_1.PreviewPanelFactory.create(ext);
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW.key, (0, analytics_1.sentryReportingCallback)(async (args) => {
                if (args === undefined) {
                    args = {};
                }
                await new TogglePreview_1.TogglePreviewCommand(preview).run(args);
            })));
        }
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key, (0, analytics_1.sentryReportingCallback)(async (args) => {
                if (args === undefined) {
                    args = {};
                }
                await new TogglePreviewLock_1.TogglePreviewLockCommand(preview).run(args);
            })));
        }
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key, (0, analytics_1.sentryReportingCallback)(async () => {
                await new ShowSchemaGraph_1.ShowSchemaGraphCommand(SchemaGraphViewFactory_1.SchemaGraphViewFactory.create(ext)).run();
            })));
        }
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key, (0, analytics_1.sentryReportingCallback)(async () => {
                await new ShowNoteGraph_1.ShowNoteGraphCommand(NoteGraphViewFactory_1.NoteGraphPanelFactory.create(ext, ext.getEngine())).run();
            })));
        }
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.CONFIGURE_UI.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.CONFIGURE_UI.key, (0, analytics_1.sentryReportingCallback)(async () => {
                await new ConfigureWithUICommand_1.ConfigureWithUICommand(ConfigureUIPanelFactory_1.ConfigureUIPanelFactory.create(ext)).run();
            })));
        }
        if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key)) {
            context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key, (0, analytics_1.sentryReportingCallback)(async (id) => {
                const resp = await ext.getEngine().getNoteMeta(id);
                const { data } = resp;
                await new GotoNote_1.GotoNoteCommand(ext).run({
                    qs: data?.fname,
                    vault: data?.vault,
                });
            })));
        }
    }
    // NOTE: seed commands currently DO NOT take extension as a first argument
    ExtensionUtils_1.ExtensionUtils.addCommand({
        context,
        key: constants_1.DENDRON_COMMANDS.SEED_ADD.key,
        cmd: new SeedAddCommand_1.SeedAddCommand(),
        existingCommands,
    });
    ExtensionUtils_1.ExtensionUtils.addCommand({
        context,
        key: constants_1.DENDRON_COMMANDS.SEED_REMOVE.key,
        cmd: new SeedRemoveCommand_1.SeedRemoveCommand(),
        existingCommands,
    });
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.SEED_BROWSE.key)) {
        context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.SEED_BROWSE.key, (0, analytics_1.sentryReportingCallback)(async () => {
            const panel = SeedBrowseCommand_1.WebViewPanelFactory.create(ext.workspaceService.seedService);
            const cmd = new SeedBrowseCommand_1.SeedBrowseCommand(panel);
            return cmd.run();
        })));
    }
}
function _setupLanguageFeatures(context) {
    const mdLangSelector = {
        language: "markdown",
        scheme: "file",
    };
    const anyLangSelector = { scheme: "file" };
    context.subscriptions.push(vscode.languages.registerReferenceProvider(mdLangSelector, new ReferenceProvider_1.default()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(
    // Allows definition provider to work for wikilinks in non-note files
    anyLangSelector, new DefinitionProvider_1.default()));
    context.subscriptions.push(vscode.languages.registerHoverProvider(
    // Allows hover provider to work for wikilinks in non-note files
    anyLangSelector, new ReferenceHoverProvider_1.default()));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(mdLangSelector, new FrontmatterFoldingRangeProvider_1.default()));
    context.subscriptions.push(vscode.languages.registerRenameProvider(mdLangSelector, new RenameProvider_1.default()));
    completionProvider_1.completionProvider.activate(context);
    codeActionProvider_1.codeActionProvider.activate(context);
}
//# sourceMappingURL=_extension.js.map