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
exports.StartupUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const luxon_1 = require("luxon");
const markdown_it_1 = __importDefault(require("markdown-it"));
const vscode = __importStar(require("vscode"));
const Doctor_1 = require("../commands/Doctor");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const survey_1 = require("../survey");
const vsCodeUtils_1 = require("../vsCodeUtils");
const analytics_1 = require("./analytics");
// import { ConfigMigrationUtils } from "./ConfigMigration";
const semver_1 = __importDefault(require("semver"));
const os_1 = __importDefault(require("os"));
class StartupUtils {
    static shouldShowManualUpgradeMessage({ previousWorkspaceVersion, currentVersion, }) {
        const workspaceInstallStatus = vsCodeUtils_1.VSCodeUtils.getInstallStatusForWorkspace({
            previousWorkspaceVersion,
            currentVersion,
        });
        return (workspaceInstallStatus === common_all_1.InstallStatus.UPGRADED &&
            semver_1.default.lte(previousWorkspaceVersion, "0.63.0"));
    }
    static showManualUpgradeMessage() {
        const SHOW_ME_HOW = "Show Me How";
        const MESSAGE = "You are upgrading from a legacy version of Dendron. Please follow the instructions to manually migrate your configuration.";
        vscode.window
            .showInformationMessage(MESSAGE, SHOW_ME_HOW)
            .then(async (resp) => {
            if (resp === SHOW_ME_HOW) {
                analytics_1.AnalyticsUtils.track(common_all_1.MigrationEvents.ManualUpgradeMessageConfirm, {
                    status: common_all_1.ConfirmStatus.accepted,
                });
                vsCodeUtils_1.VSCodeUtils.openLink("https://wiki.dendron.so/notes/4119x15gl9w90qx8qh1truj");
            }
            else {
                analytics_1.AnalyticsUtils.track(common_all_1.MigrationEvents.ManualUpgradeMessageConfirm, {
                    status: common_all_1.ConfirmStatus.rejected,
                });
            }
        });
    }
    static async showManualUpgradeMessageIfNecessary({ previousWorkspaceVersion, currentVersion, }) {
        if (StartupUtils.shouldShowManualUpgradeMessage({
            previousWorkspaceVersion,
            currentVersion,
        })) {
            StartupUtils.showManualUpgradeMessage();
        }
    }
    static async runMigrationsIfNecessary({ wsService, currentVersion, previousWorkspaceVersion, dendronConfig, maybeWsSettings, }) {
        const workspaceInstallStatus = vsCodeUtils_1.VSCodeUtils.getInstallStatusForWorkspace({
            previousWorkspaceVersion,
            currentVersion,
        });
        // see [[Migration|dendron://dendron.docs/pkg.plugin-core.t.migration]] for overview of migration process
        const changes = await wsService.runMigrationsIfNecessary({
            currentVersion,
            previousVersion: previousWorkspaceVersion,
            dendronConfig,
            workspaceInstallStatus,
            wsConfig: maybeWsSettings,
        });
        logger_1.Logger.info({
            ctx: "runMigrationsIfNecessary",
            changes,
            workspaceInstallStatus,
        });
        if (changes.length > 0) {
            changes.forEach((change) => {
                const event = lodash_1.default.isUndefined(change.error)
                    ? common_all_1.MigrationEvents.MigrationSucceeded
                    : common_all_1.MigrationEvents.MigrationFailed;
                analytics_1.AnalyticsUtils.track(event, engine_server_1.MigrationUtils.getMigrationAnalyticProps(change));
            });
        }
    }
    static showDuplicateConfigEntryMessageIfNecessary(opts) {
        const message = StartupUtils.getDuplicateKeysMessage(opts);
        if (message !== undefined) {
            StartupUtils.showDuplicateConfigEntryMessage({
                ...opts,
                message,
            });
        }
    }
    static getDuplicateKeysMessage(opts) {
        const wsRoot = opts.ext.getDWorkspace().wsRoot;
        try {
            common_server_1.DConfig.getRaw(wsRoot);
        }
        catch (error) {
            if (error.name === "YAMLException" &&
                error.reason === "duplicated mapping key") {
                return error.message;
            }
        }
    }
    static showDuplicateConfigEntryMessage(opts) {
        analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.DuplicateConfigEntryMessageShow);
        const FIX_ISSUE = "Fix Issue";
        const MESSAGE = "We have detected duplicate key(s) in dendron.yml. Dendron has activated using the last entry of the duplicate key(s)";
        vscode.window
            .showInformationMessage(MESSAGE, FIX_ISSUE)
            .then(async (resp) => {
            if (resp === FIX_ISSUE) {
                analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.DuplicateConfigEntryMessageConfirm, {
                    status: common_all_1.ConfirmStatus.accepted,
                });
                const wsRoot = opts.ext.getDWorkspace().wsRoot;
                const configPath = common_server_1.DConfig.configPath(wsRoot);
                const configUri = vscode.Uri.file(configPath);
                const message = opts.message;
                const content = [
                    `# Duplicate Keys in \`dendron.yml\``,
                    "",
                    "The message at the bottom displays the _first_ duplicate key mapping that was detected in `dendron.yml`",
                    "",
                    "**There may be more duplicate key mappings**.",
                    "",
                    "Take the following steps to fix this issue.",
                    "1. Look through `dendron.yml` and remove all duplicate mappings.",
                    "",
                    `    - We recommend installing the [YAML extension](${vscode.Uri.parse(`command:workbench.extensions.search?${JSON.stringify("@id:redhat.vscode-yaml")}`)}) for validating \`dendron.yml\``,
                    "",
                    "1. When you are done, save your changes made to `dendron.yml`",
                    "",
                    `1. Reload the window for it to take effect. [Click here to reload window](${vscode.Uri.parse(`command:workbench.action.reloadWindow`)})`,
                    "",
                    "## Error message",
                    "```",
                    message,
                    "```",
                    "",
                    "",
                ].join("\n");
                const panel = vscode.window.createWebviewPanel("showDuplicateConfigMessagePreview", "Duplicated Mapping Keys Preview", vscode.ViewColumn.One, {
                    enableCommandUris: true,
                });
                const md = (0, markdown_it_1.default)();
                panel.webview.html = md.render(content);
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(configUri, {
                    column: vscode.ViewColumn.Beside,
                });
            }
            else {
                analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.DuplicateConfigEntryMessageConfirm, {
                    status: common_all_1.ConfirmStatus.rejected,
                });
            }
        });
    }
    static showDeprecatedConfigMessageIfNecessary(opts) {
        if (StartupUtils.shouldDisplayDeprecatedConfigMessage(opts)) {
            StartupUtils.showDeprecatedConfigMessage({ ext: opts.ext });
        }
    }
    static shouldDisplayDeprecatedConfigMessage(opts) {
        if (opts.extensionInstallStatus === common_all_1.InstallStatus.UPGRADED) {
            const wsRoot = opts.ext.getDWorkspace().wsRoot;
            const rawConfig = common_server_1.DConfig.getRaw(wsRoot);
            const pathsToDelete = common_all_1.ConfigUtils.detectDeprecatedConfigs({
                config: rawConfig,
                deprecatedPaths: engine_server_1.DEPRECATED_PATHS,
            });
            return pathsToDelete.length > 0;
        }
        else {
            return false;
        }
    }
    static showDeprecatedConfigMessage(opts) {
        analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.DeprecatedConfigMessageShow);
        const REMOVE_CONFIG = "Remove Deprecated Configuration";
        const MESSAGE = "We have detected some deprecated configurations. Would you like to remove them from dendron.yml?";
        vscode.window
            .showInformationMessage(MESSAGE, REMOVE_CONFIG)
            .then(async (resp) => {
            if (resp === REMOVE_CONFIG) {
                analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.DeprecatedConfigMessageConfirm, {
                    status: common_all_1.ConfirmStatus.accepted,
                });
                const cmd = new Doctor_1.DoctorCommand(opts.ext);
                await cmd.execute({
                    action: engine_server_1.DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS,
                    scope: "workspace",
                });
            }
            else {
                analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.DeprecatedConfigMessageConfirm, {
                    status: common_all_1.ConfirmStatus.rejected,
                });
            }
        });
    }
    static showMissingDefaultConfigMessageIfNecessary(opts) {
        if (StartupUtils.shouldDisplayMissingDefaultConfigMessage(opts)) {
            StartupUtils.showMissingDefaultConfigMessage({ ext: opts.ext });
        }
    }
    static shouldDisplayMissingDefaultConfigMessage(opts) {
        if (opts.extensionInstallStatus === common_all_1.InstallStatus.UPGRADED) {
            const wsRoot = opts.ext.getDWorkspace().wsRoot;
            const rawConfig = common_server_1.DConfig.getRaw(wsRoot);
            const out = common_all_1.ConfigUtils.detectMissingDefaults({ config: rawConfig });
            return out !== undefined && out.needsBackfill;
        }
        else {
            return false;
        }
    }
    static showMissingDefaultConfigMessage(opts) {
        analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.ShowMissingDefaultConfigMessage);
        const ADD_CONFIG = "Add Missing Configuration";
        const MESSAGE = "We have detected a missing configuration. This may happen because a new configuration was introduced, or because an existing required configuration has been deleted. Would you like to add them to dendron.yml?";
        vscode.window
            .showInformationMessage(MESSAGE, ADD_CONFIG)
            .then(async (resp) => {
            if (resp === ADD_CONFIG) {
                analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.MissingDefaultConfigMessageConfirm, {
                    status: common_all_1.ConfirmStatus.accepted,
                });
                const cmd = new Doctor_1.DoctorCommand(opts.ext);
                await cmd.execute({
                    action: engine_server_1.DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS,
                    scope: "workspace",
                });
            }
            else {
                analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.MissingDefaultConfigMessageConfirm, {
                    status: common_all_1.ConfirmStatus.rejected,
                });
            }
        });
    }
    static async showInactiveUserMessageIfNecessary() {
        if (StartupUtils.shouldDisplayInactiveUserSurvey()) {
            await StartupUtils.showInactiveUserMessage();
        }
    }
    static shouldDisplayInactiveUserSurvey() {
        const metaData = engine_server_1.MetadataService.instance().getMeta();
        const inactiveSurveyMsgStatus = metaData.inactiveUserMsgStatus;
        if (inactiveSurveyMsgStatus === engine_server_1.InactvieUserMsgStatusEnum.submitted) {
            return false;
        }
        // rare case where global state has been reset (or a reinstall) may cause issues with
        // the prompt logic. ignore these cases and don't show the
        if (metaData.firstInstall !== undefined &&
            metaData.firstLookupTime !== undefined) {
            if (metaData.firstLookupTime - metaData.firstInstall < 0) {
                return false;
            }
        }
        const ONE_WEEK = luxon_1.Duration.fromObject({ weeks: 1 });
        const FOUR_WEEKS = luxon_1.Duration.fromObject({ weeks: 4 });
        const currentTime = common_all_1.Time.now().toSeconds();
        const CUR_TIME = luxon_1.Duration.fromObject({ seconds: currentTime });
        const FIRST_INSTALL = metaData.firstInstall !== undefined
            ? luxon_1.Duration.fromObject({ seconds: metaData.firstInstall })
            : undefined;
        const FIRST_LOOKUP_TIME = metaData.firstLookupTime !== undefined
            ? luxon_1.Duration.fromObject({ seconds: metaData.firstLookupTime })
            : undefined;
        const LAST_LOOKUP_TIME = metaData.lastLookupTime !== undefined
            ? luxon_1.Duration.fromObject({ seconds: metaData.lastLookupTime })
            : undefined;
        const INACTIVE_USER_MSG_SEND_TIME = metaData.inactiveUserMsgSendTime !== undefined
            ? luxon_1.Duration.fromObject({ seconds: metaData.inactiveUserMsgSendTime })
            : undefined;
        // is the user a first week active user?
        const isFirstWeekActive = FIRST_INSTALL !== undefined &&
            FIRST_LOOKUP_TIME !== undefined &&
            FIRST_LOOKUP_TIME.minus(FIRST_INSTALL) <= ONE_WEEK;
        // was the user active on the first week but has been inactive for more than four weeks?
        const isInactive = isFirstWeekActive &&
            LAST_LOOKUP_TIME !== undefined &&
            CUR_TIME.minus(LAST_LOOKUP_TIME) >= FOUR_WEEKS;
        // if they have cancelled last time, we should be waiting another four weeks.
        if (inactiveSurveyMsgStatus === engine_server_1.InactvieUserMsgStatusEnum.cancelled) {
            const shouldSendAgain = INACTIVE_USER_MSG_SEND_TIME !== undefined &&
                CUR_TIME.minus(INACTIVE_USER_MSG_SEND_TIME) >= FOUR_WEEKS &&
                isInactive;
            if (shouldSendAgain) {
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InactiveUserSurveyPromptReason, {
                    reason: "reprompt",
                    currentTime,
                    ...metaData,
                });
            }
            return shouldSendAgain;
        }
        else {
            // this is the first time we are asking them.
            const shouldSend = metaData.dendronWorkspaceActivated !== undefined &&
                metaData.firstWsInitialize !== undefined &&
                isInactive &&
                // this is needed since we may have prompted them before we introduced this metadata
                metaData.inactiveUserMsgSendTime === undefined;
            if (shouldSend) {
                analytics_1.AnalyticsUtils.track(common_all_1.SurveyEvents.InactiveUserSurveyPromptReason, {
                    reason: "initial_prompt",
                    currentTime,
                    ...metaData,
                });
            }
            return shouldSend;
        }
    }
    static async showInactiveUserMessage() {
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.ShowInactiveUserMessage);
        engine_server_1.MetadataService.instance().setInactiveUserMsgSendTime();
        await survey_1.SurveyUtils.showInactiveUserSurvey();
    }
    static warnIncompatibleExtensions(opts) {
        const installStatus = constants_1.INCOMPATIBLE_EXTENSIONS.map((extId) => {
            return { id: extId, installed: vsCodeUtils_1.VSCodeUtils.isExtensionInstalled(extId) };
        });
        const installedExtensions = installStatus
            .filter((status) => status.installed)
            .map((status) => status.id);
        const shouldDisplayWarning = installStatus.some((status) => status.installed);
        if (shouldDisplayWarning) {
            analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.IncompatibleExtensionsWarned, {
                installedExtensions,
            });
            vscode.window
                .showWarningMessage("We have detected some extensions that may conflict with Dendron. Further action is needed for Dendron to function correctly", "Fix conflicts...")
                .then(async (resp) => {
                if (resp === "Fix conflicts...") {
                    const cmd = new Doctor_1.DoctorCommand(opts.ext);
                    await cmd.execute({
                        action: Doctor_1.PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
                        scope: "workspace",
                        data: { installStatus },
                    });
                }
            });
        }
    }
    static showUninstallMarkdownLinksExtensionMessage() {
        if (vsCodeUtils_1.VSCodeUtils.isExtensionInstalled("dendron.dendron-markdown-links")) {
            vscode.window
                .showInformationMessage("Please uninstall the Dendron Markdown Links extension. Dendron has the note graph feature built-in now and having this legacy extension installed will interfere with its functionality.", { modal: true }, { title: "Uninstall" })
                .then(async (resp) => {
                if (resp?.title === "Uninstall") {
                    await vscode.commands.executeCommand("workbench.extensions.uninstallExtension", "dendron.dendron-markdown-links");
                }
            });
        }
    }
    /**
     * A one-off logic to show a special webview message for the v0.100.0 launch.
     * @returns
     */
    static maybeShowProductHuntMessage() {
        // only show once
        if (engine_server_1.MetadataService.instance().v100ReleaseMessageShown) {
            return;
        }
        const uri = vsCodeUtils_1.VSCodeUtils.joinPath(vsCodeUtils_1.VSCodeUtils.getAssetUri(ExtensionProvider_1.ExtensionProvider.getExtension().context), "dendron-ws", "vault", "v100.html");
        const { content } = (0, common_server_1.readMD)(uri.fsPath);
        const title = "Dendron Release Notes";
        const panel = vscode.window.createWebviewPanel(lodash_1.default.kebabCase(title), title, vscode.ViewColumn.One, {
            enableScripts: true,
        });
        panel.webview.html = content;
        panel.reveal();
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.V100ReleaseNotesShown);
        engine_server_1.MetadataService.instance().v100ReleaseMessageShown = true;
    }
    /**
     * this method pings the localhost and checks if it is available. Incase local is blocked off,
     * displays a toaster with a link to troubleshooting docs
     */
    static async showWhitelistingLocalhostDocsIfNecessary() {
        const pingArgs = os_1.default.platform() === "win32" ? "ping -n 1 127.0.0.1" : "ping -c 1 127.0.0.1";
        const { failed } = await engine_server_1.execa.command(pingArgs);
        if (failed) {
            analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.LocalhostBlockedNotified);
            vscode.window
                .showWarningMessage("Dendron is facing issues while connecting with localhost. Please ensure that you don't have anything running that can block localhost.", ...["Open troubleshooting docs"])
                .then((resp) => {
                if (resp === "Open troubleshooting docs") {
                    analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.LocalhostBlockedAccepted);
                    vscode.commands.executeCommand("vscode.open", "https://wiki.dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe/#whitelisting-localhost");
                }
                else {
                    analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.LocalhostBlockedRejected);
                }
            });
        }
    }
}
exports.StartupUtils = StartupUtils;
//# sourceMappingURL=StartupUtils.js.map