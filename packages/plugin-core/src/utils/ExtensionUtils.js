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
exports.ExtensionUtils = void 0;
const api_server_1 = require("@dendronhq/api-server");
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const global_1 = require("../types/global");
const analytics_1 = require("../utils/analytics");
const Sentry = __importStar(require("@sentry/node"));
const md_1 = require("../utils/md");
const vsCodeUtils_1 = require("../vsCodeUtils");
const vscode_uri_1 = require("vscode-uri");
const versionProvider_1 = require("../versionProvider");
const luxon_1 = require("luxon");
/** Before sending saved telemetry events, wait this long (in ms) to make sure
 * the workspace will likely remain open long enough for us to send everything.
 */
const DELAY_TO_SEND_SAVED_TELEMETRY = 15 * 1000;
async function startServerProcess() {
    const { nextServerUrl, nextStaticRoot, engineServerPort } = ExtensionProvider_1.ExtensionProvider.getDWorkspace().config.dev || {};
    // const ctx = "startServer";
    const maybePort = ExtensionProvider_1.ExtensionProvider.getExtension()
        .getWorkspaceConfig()
        .get(constants_1.CONFIG.SERVER_PORT.key) || engineServerPort;
    const port = maybePort;
    if (port) {
        return { port };
    }
    // if in dev mode, simplify debugging without going multi process
    if ((0, common_all_1.getStage)() !== "prod") {
        const out = await (0, api_server_1.launchv2)({
            logPath: path_1.default.join(__dirname, "..", "..", "dendron.server.log"),
            googleOauthClientId: global_1.GOOGLE_OAUTH_ID,
            googleOauthClientSecret: global_1.GOOGLE_OAUTH_SECRET,
        });
        return { port: out.port };
    }
    // start server is separate process ^pyiildtq4tdx
    const logPath = ExtensionProvider_1.ExtensionProvider.getDWorkspace().logUri.fsPath;
    try {
        const out = await api_server_1.ServerUtils.execServerNode({
            scriptPath: path_1.default.join(__dirname, "server.js"),
            logPath,
            nextServerUrl,
            nextStaticRoot,
            port,
            googleOauthClientId: global_1.GOOGLE_OAUTH_ID,
            googleOauthClientSecret: global_1.GOOGLE_OAUTH_SECRET,
        });
        return out;
    }
    catch (err) {
        // TODO: change to error, wait for https://github.com/dendronhq/dendron/issues/3227 to be resolved first
        logger_1.Logger.info({ msg: "failed to spawn a subshell" });
        const out = await (0, api_server_1.launchv2)({
            logPath: path_1.default.join(__dirname, "..", "..", "dendron.server.log"),
            googleOauthClientId: global_1.GOOGLE_OAUTH_ID,
            googleOauthClientSecret: global_1.GOOGLE_OAUTH_SECRET,
        });
        return { port: out.port };
    }
}
function handleServerProcess({ subprocess, context, onExit, }) {
    const ctx = "handleServerProcess";
    logger_1.Logger.info({ ctx, msg: "subprocess running", pid: subprocess.pid });
    // if extension closes, reap server process
    context.subscriptions.push(new vscode.Disposable(() => {
        logger_1.Logger.info({ ctx, msg: "kill server start" });
        if (subprocess.pid) {
            process.kill(subprocess.pid);
        }
        logger_1.Logger.info({ ctx, msg: "kill server end" });
    }));
    // if server process has issues, prompt user to restart
    api_server_1.ServerUtils.onProcessExit({
        // @ts-ignore
        subprocess,
        cb: onExit,
    });
}
class ExtensionUtils {
    static async activate() {
        const ext = this.getExtension();
        return ext.activate();
    }
    static addCommand = ({ context, key, cmd, existingCommands, }) => {
        if (!existingCommands.includes(key)) {
            context.subscriptions.push(vscode.commands.registerCommand(key, (0, analytics_1.sentryReportingCallback)(async (args) => {
                cmd.run(args);
            })));
        }
    };
    static getExtension() {
        const extName = (0, common_all_1.getStage)() === "dev"
            ? "dendron.@dendronhq/plugin-core"
            : "dendron.dendron";
        const ext = vscode.extensions.getExtension(extName);
        return ext;
    }
    static _TUTORIAL_IDS;
    static getTutorialIds() {
        if (lodash_1.default.isUndefined(ExtensionUtils._TUTORIAL_IDS)) {
            // Note IDs that are part of our tutorial(s). We want to exclude these from
            // our 'numNotes' telemetry.
            ExtensionUtils._TUTORIAL_IDS = new Set([
                "ks3b4u7gnd6yiw68qu6ba4m",
                "mycf53kz1r7swcttcobwbdl",
                "kzry3qcy2y4ey1jcf1llajg",
                "y60h6laqi7w462zjp3jyqtt",
                "4do06cts1tme9yz7vfp46bu",
                "5pz82kyfhp2whlzfldxmkzu",
                "kl6ndok3a1f14be6zv771c9",
                "iq3ggn67k1u3v6up8ny3kf5",
                "ie5x2bq5yj7uvenylblnhyr",
                "rjnqumna1ye82u9u76ni42k",
                "wmbd5xz40ohjb8rd5b737cq",
                "epmpyk2kjdxqyvflotan2vt",
                "yyfpeq3th3h17cgvj8cnjw5",
                "lxrp006mal1tfsd7nxmsobe",
                "4u6pv56mnt25d8l2wzfygu7",
                "khv6u4514vnvvy4njhctfru",
                "kyjfnf2rnc6vn71iyn9liz7",
                "c1bs7wsjfbhb0zipaywqfbg", // quickstart-v1
                "c1bs7wsjfbhb0zipaywqv1",
                "c1bs7wsjfbhb0zipaywqins", //quickstart-no-welcome
            ]);
        }
        return ExtensionUtils._TUTORIAL_IDS;
    }
    static setWorkspaceContextOnActivate(dendronConfig) {
        if (vsCodeUtils_1.VSCodeUtils.isDevMode()) {
            vscode.commands.executeCommand("setContext", constants_1.DendronContext.DEV_MODE, true);
        }
        // used for enablement of legacy show preview command.
        vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.HAS_LEGACY_PREVIEW, md_1.MarkdownUtils.hasLegacyPreview());
        //used for enablement of export pod v2 command
        vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.ENABLE_EXPORT_PODV2, dendronConfig.dev?.enableExportPodV2 ?? false);
        // @deprecate: should track as property of workspace init instead
        if (dendronConfig.dev?.enableExportPodV2) {
            analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.EnabledExportPodV2);
        }
    }
    /**
     * Setup segment client
     * Also setup cache flushing in case of missed uploads
     */
    static async startServerProcess({ context, start, wsService, onExit, }) {
        const ctx = "startServerProcess";
        const { port, subprocess } = await startServerProcess();
        if (subprocess) {
            handleServerProcess({
                subprocess,
                context,
                onExit,
            });
        }
        const durationStartServer = (0, common_server_1.getDurationMilliseconds)(start);
        logger_1.Logger.info({ ctx, msg: "post-start-server", port, durationStartServer });
        wsService.writePort(port);
        return { port, subprocess };
    }
    static getAndTrackInstallStatus({ UUIDPathExists, previousGlobalVersion, currentVersion, }) {
        const extensionInstallStatus = vsCodeUtils_1.VSCodeUtils.getInstallStatusForExtension({
            previousGlobalVersion,
            currentVersion,
        });
        // check if this is an install event, but a repeated one on a new instance.
        let isSecondaryInstall = false;
        // set initial install ^194e5bw7so9g
        if (extensionInstallStatus === common_all_1.InstallStatus.INITIAL_INSTALL) {
            // even if it's an initial install for this instance of vscode, it may not be for this machine.
            // in that case, we should skip setting the initial install time since it's already set.
            // we also check if we already set uuid for this machine. If so, this is not a true initial install.
            const metadata = engine_server_1.MetadataService.instance().getMeta();
            if (metadata.firstInstall === undefined && !UUIDPathExists) {
                engine_server_1.MetadataService.instance().setInitialInstall();
                const version = versionProvider_1.VersionProvider.version();
                engine_server_1.MetadataService.instance().setInitialInstallVersion(version);
            }
            else {
                // we still want to proceed with InstallStatus.INITIAL_INSTALL because we want everything
                // tied to initial install to happen in this instance of VSCode once for the first time
                isSecondaryInstall = true;
            }
        }
        // TODO: temporary backfill
        if (lodash_1.default.isUndefined(engine_server_1.MetadataService.instance().getMeta().firstInstall)) {
            const time = common_all_1.Time.DateTime.fromISO("2021-06-22");
            engine_server_1.MetadataService.instance().setInitialInstall(time.toSeconds());
        }
        return { extensionInstallStatus, isSecondaryInstall };
    }
    /**
     * Analytics related to initializing the workspace
     * @param param0
     */
    static async trackWorkspaceInit({ durationReloadWorkspace, ext, activatedSuccess, }) {
        const engine = ext.getEngine();
        const workspace = ext.getDWorkspace();
        const { wsRoot, vaults, type: workspaceType, config: dendronConfig, } = workspace;
        const notes = await engine.findNotesMeta({ excludeStub: false });
        let numNotes = notes.length;
        let numNoteRefs = 0;
        let numWikilinks = 0;
        let numBacklinks = 0;
        let numLinkCandidates = 0;
        let numFrontmatterTags = 0;
        let numTutorialNotes = 0;
        let numTaskNotes = 0;
        // Note IDs that are part of our tutorial(s). We want to exclude these from
        // our 'numNotes' telemetry.
        const tutorialIds = new Set([
            "ks3b4u7gnd6yiw68qu6ba4m",
            "mycf53kz1r7swcttcobwbdl",
            "kzry3qcy2y4ey1jcf1llajg",
            "y60h6laqi7w462zjp3jyqtt",
            "4do06cts1tme9yz7vfp46bu",
            "5pz82kyfhp2whlzfldxmkzu",
            "kl6ndok3a1f14be6zv771c9",
            "iq3ggn67k1u3v6up8ny3kf5",
            "ie5x2bq5yj7uvenylblnhyr",
            "rjnqumna1ye82u9u76ni42k",
            "wmbd5xz40ohjb8rd5b737cq",
            "epmpyk2kjdxqyvflotan2vt",
            "yyfpeq3th3h17cgvj8cnjw5",
            "lxrp006mal1tfsd7nxmsobe",
            "4u6pv56mnt25d8l2wzfygu7",
            "khv6u4514vnvvy4njhctfru",
            "kyjfnf2rnc6vn71iyn9liz7",
            "c1bs7wsjfbhb0zipaywqfbg", // quickstart-v1
        ]);
        // Takes about ~10 ms to compute in org-workspace
        notes.forEach((val) => {
            val.links.forEach((link) => {
                switch (link.type) {
                    case "ref":
                        numNoteRefs += 1;
                        break;
                    case "wiki":
                        numWikilinks += 1;
                        break;
                    case "backlink":
                        numBacklinks += 1;
                        break;
                    case "linkCandidate":
                        numLinkCandidates += 1;
                        break;
                    case "frontmatterTag":
                        numFrontmatterTags += 1;
                        break;
                    default:
                        break;
                }
            });
            if (tutorialIds.has(val.id)) {
                numTutorialNotes += 1;
            }
            if (common_all_1.TaskNoteUtils.isTaskNote(val)) {
                numTaskNotes += 1;
            }
        });
        // These are the values for the original tutorial; approximate is ok here.
        const tutorialWikiLinkCount = 19;
        const tutorialNoteRefCount = 1;
        const tutorialBacklinkCount = 18;
        if (numTutorialNotes > 0) {
            numNotes -= numTutorialNotes;
            numWikilinks = Math.max(0, numWikilinks - tutorialWikiLinkCount);
            numNoteRefs = Math.max(0, numNoteRefs - tutorialNoteRefCount);
            numBacklinks = Math.max(0, numBacklinks - tutorialBacklinkCount);
        }
        const numSchemas = lodash_1.default.size(await (await engine.querySchema("*")).data);
        const codeWorkspacePresent = await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_WS_NAME));
        const publishigConfig = common_all_1.ConfigUtils.getPublishing(dendronConfig);
        const siteUrl = publishigConfig.siteUrl;
        const publishingTheme = dendronConfig?.publishing?.theme;
        const previewTheme = dendronConfig?.preview?.theme;
        const enabledExportPodV2 = dendronConfig.dev?.enableExportPodV2;
        const { workspaceFile, workspaceFolders } = vscode.workspace;
        const configVersion = common_all_1.ConfigUtils.getVersion(dendronConfig);
        const configDiff = common_all_1.ConfigUtils.findDifference({ config: dendronConfig });
        const dendronConfigChanged = configDiff.length > 0;
        const trackProps = {
            duration: durationReloadWorkspace,
            numNotes,
            numNoteRefs,
            numWikilinks,
            numBacklinks,
            numLinkCandidates,
            numFrontmatterTags,
            numSchemas,
            numVaults: vaults.length,
            numTutorialNotes,
            numTaskNotes,
            workspaceType,
            codeWorkspacePresent,
            configVersion,
            selfContainedVaultsEnabled: dendronConfig.dev?.enableSelfContainedVaults || false,
            numSelfContainedVaults: vaults.filter(common_all_1.VaultUtils.isSelfContained).length,
            numRemoteVaults: vaults.filter(common_all_1.VaultUtils.isRemote).length,
            numWorkspaceVaults: vaults.filter((vault) => vault.workspace !== undefined).length,
            numSeedVaults: vaults.filter((vault) => vault.seed !== undefined).length,
            activationSucceeded: activatedSuccess,
            hasLegacyPreview: md_1.MarkdownUtils.hasLegacyPreview(),
            enabledExportPodV2,
            hasWorkspaceFile: !lodash_1.default.isUndefined(workspaceFile),
            workspaceFolders: lodash_1.default.isUndefined(workspaceFolders)
                ? 0
                : workspaceFolders.length,
            hasLocalConfig: false,
            numLocalConfigVaults: 0,
            dendronConfigChanged,
        };
        if (dendronConfigChanged) {
            lodash_1.default.set(trackProps, "numConfigChanged", configDiff.length);
            /**
             * This is a separate event because {@link VSCodeEvents.InitializeWorkspace} is getting a little crowded.
             * The payload will be stored in a _single column_ with a `text` type, and there is no to the length.
             * There is a hard limit of 1GB per field, but not a concern here.
             */
            analytics_1.AnalyticsUtils.track(common_all_1.ConfigEvents.ConfigChangeDetected, {
                changed: JSON.stringify(configDiff),
            });
        }
        if (siteUrl !== undefined) {
            lodash_1.default.set(trackProps, "siteUrl", siteUrl);
        }
        if (publishingTheme !== undefined) {
            lodash_1.default.set(trackProps, "publishingTheme", publishingTheme);
        }
        if (previewTheme !== undefined) {
            lodash_1.default.set(trackProps, "previewTheme", previewTheme);
        }
        const allExtensions = vscode.extensions.all;
        let allNonBuiltInExtensions = allExtensions.filter((extension) => {
            return !extension.packageJSON.isBuiltin;
        });
        if (vsCodeUtils_1.VSCodeUtils.isDevMode()) {
            // done to make this work during dev mode
            allNonBuiltInExtensions = allNonBuiltInExtensions.filter((ext) => {
                return !ext.extensionPath.includes("packages/plugin-core");
            });
        }
        try {
            const extensionsDetail = allNonBuiltInExtensions.map((extension) => {
                const { packageJSON } = extension;
                const { id, version } = packageJSON;
                return { id, version };
            });
            if (extensionsDetail && extensionsDetail.length > 0) {
                lodash_1.default.set(trackProps, "extensionsDetail", extensionsDetail);
                lodash_1.default.set(trackProps, "numExtensions", extensionsDetail.length);
            }
        }
        catch (error) {
            // something went wrong don't track extension detail
            Sentry.captureException(error);
        }
        // NOTE: this will not be accurate in dev mode
        const { codeFolderCreated, ageOfCodeInstallInWeeks } = ExtensionUtils.getCodeFolderCreated({
            context: ext.context,
        });
        if (codeFolderCreated) {
            lodash_1.default.set(trackProps, "codeFolderCreated", codeFolderCreated);
        }
        if (ageOfCodeInstallInWeeks) {
            lodash_1.default.set(trackProps, "ageOfCodeInstallInWeeks", ageOfCodeInstallInWeeks);
        }
        const maybeLocalConfig = common_server_1.DConfig.searchLocalConfigSync(wsRoot);
        if (maybeLocalConfig.data) {
            trackProps.hasLocalConfig = true;
            if (maybeLocalConfig.data.workspace.vaults) {
                trackProps.numLocalConfigVaults =
                    maybeLocalConfig.data.workspace.vaults.length;
            }
        }
        analytics_1.AnalyticsUtils.identify({
            numNotes,
            // Which side of all currently running tests is this user on?
            splitTests: common_all_1.CURRENT_AB_TESTS.map((test) => 
            // Formatted as `testName.groupName` since group names are not necessarily unique
            `${test.name}.${test.getUserGroup(common_server_1.SegmentClient.instance().anonymousId)}`),
        });
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.InitializeWorkspace, trackProps);
        setTimeout(() => {
            logger_1.Logger.info("sendSavedAnalytics"); // TODO
            analytics_1.AnalyticsUtils.sendSavedAnalytics();
        }, DELAY_TO_SEND_SAVED_TELEMETRY);
    }
    /**
     * Try to infer install code instance age from extension path
     * this will not be accurate in dev mode because the extension install path is the monorepo.
     * return the creation time and lapsed time in weeks
     */
    static getCodeFolderCreated(opts) {
        const { context } = opts;
        try {
            // infer install path from extension path.
            // this assumes the user installs all extensions in one place.
            // that should be the case for almost all cases, but vscode provides a way to
            // customize install location so this might not be the case in those rare cases.
            const installPath = vscode_uri_1.Utils.dirname(vscode_uri_1.Utils.dirname(vscode_uri_1.URI.file(context.extensionPath))).fsPath;
            const fd = fs_extra_1.default.openSync(installPath, "r");
            const stat = fs_extra_1.default.fstatSync(fd);
            // some file systems don't track birth times.
            // in this case the value may be ctime (time of inode change), or 0
            const { birthtimeMs } = stat;
            const currentTime = luxon_1.Duration.fromMillis(common_all_1.Time.now().toMillis());
            const birthTime = luxon_1.Duration.fromMillis(birthtimeMs);
            const ageOfCodeInstallInWeeks = Math.round(currentTime.minus(birthTime).as("weeks"));
            return {
                codeFolderCreated: birthtimeMs,
                ageOfCodeInstallInWeeks,
            };
        }
        catch (error) {
            // something went wrong. don't track. Send to sentry silently.
            Sentry.captureException(error);
            return {};
        }
    }
}
exports.ExtensionUtils = ExtensionUtils;
//# sourceMappingURL=ExtensionUtils.js.map