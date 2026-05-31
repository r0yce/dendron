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
exports.AnalyticsUtils = void 0;
exports.sentryReportingCallback = sentryReportingCallback;
exports.getAnalyticsPayload = getAnalyticsPayload;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const Sentry = __importStar(require("@sentry/node"));
const lodash_1 = __importDefault(require("lodash"));
const luxon_1 = require("luxon");
const vscode = __importStar(require("vscode"));
const versionProvider_1 = require("../versionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const telemetry_1 = require("../telemetry");
const logger_1 = require("../logger");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class AnalyticsUtils {
    static sessionStart = -1;
    static getVSCodeSentryRelease() {
        return `${common_all_1.AppNames.CODE}@${versionProvider_1.VersionProvider.version()}`;
    }
    static getVSCodeIdentifyProps() {
        const { appName, appHost, isNewAppInstall, language, machineId, shell, isTelemetryEnabled, } = vscode.env;
        return {
            type: common_all_1.AppNames.CODE,
            ideVersion: vscode.version,
            ideFlavor: appName,
            appVersion: versionProvider_1.VersionProvider.version(),
            appHost,
            userAgent: appName,
            isNewAppInstall,
            isTelemetryEnabled,
            language,
            machineId,
            shell,
        };
    }
    static getCommonTrackProps() {
        const firstWeekSinceInstall = AnalyticsUtils.isFirstWeek();
        const vscodeSessionId = vscode.env.sessionId;
        const appVersion = versionProvider_1.VersionProvider.version();
        return {
            firstWeekSinceInstall,
            vscodeSessionId,
            appVersion,
        };
    }
    static getSessionId() {
        if (AnalyticsUtils.sessionStart < 0) {
            AnalyticsUtils.sessionStart = Math.round(common_all_1.Time.now().toSeconds());
        }
        return AnalyticsUtils.sessionStart;
    }
    static isFirstWeek() {
        const metadata = engine_server_1.MetadataService.instance().getMeta();
        const ONE_WEEK = luxon_1.Duration.fromObject({ weeks: 1 });
        const firstInstallTime = metadata.firstInstall !== undefined
            ? luxon_1.Duration.fromObject({ seconds: metadata.firstInstall })
            : undefined;
        if (lodash_1.default.isUndefined(firstInstallTime)) {
            // `firstInstall` not set yet. by definition first week.
            return true;
        }
        const currentTime = luxon_1.Duration.fromObject({
            seconds: common_all_1.Time.now().toSeconds(),
        });
        return currentTime.minus(firstInstallTime) < ONE_WEEK;
    }
    static _trackCommon({ event, props, timestamp, }) {
        const { ideVersion, ideFlavor } = AnalyticsUtils.getVSCodeIdentifyProps();
        const properties = { ...props, ...AnalyticsUtils.getCommonTrackProps() };
        const sessionId = AnalyticsUtils.getSessionId();
        return {
            event,
            platformProps: {
                type: common_all_1.AppNames.CODE,
                ideVersion,
                ideFlavor,
            },
            properties,
            timestamp,
            integrations: { Amplitude: { session_id: sessionId } },
        };
    }
    static track(event, customProps, segmentProps) {
        return common_server_1.SegmentUtils.trackSync(this._trackCommon({
            event,
            props: customProps,
            timestamp: segmentProps?.timestamp,
        }));
    }
    /** Saves analytics to be sent during the next run of Dendron.
     *
     * Make sure any properties you use can be trivially serialized and
     * deserialized, numbers, strings, plain JSON objects, arrays are fine. No
     * Maps or complex objects.
     *
     * This is required for actions that reload the window, where the analytics
     * won't get sent in time before the reload and where delaying the reload
     * would be undesirable.
     */
    static async trackForNextRun(event, customProps) {
        const ctx = "AnalyticsUtils.trackForNextRun";
        logger_1.Logger.debug({
            ctx,
            event,
        });
        const analyticsProps = this._trackCommon({
            event,
            props: {
                ...customProps,
                savedAnalytics: true,
            },
            timestamp: new Date(),
        });
        const telemetryDir = path_1.default.join(os_1.default.homedir(), common_all_1.FOLDERS.DENDRON_SYSTEM_ROOT, common_all_1.FOLDERS.SAVED_TELEMETRY);
        await fs_extra_1.default.ensureDir(telemetryDir);
        await fs_extra_1.default.writeFile(path_1.default.join(telemetryDir, `${(0, common_all_1.genUUID)()}.json`), JSON.stringify({
            ...analyticsProps,
            timestamp: analyticsProps.timestamp?.toISOString(),
        }));
    }
    static async sendSavedAnalytics() {
        const ctx = "AnalyticsUtils.sendSavedAnalytics";
        logger_1.Logger.info({ ctx, message: "start" });
        const telemetryDir = path_1.default.join(os_1.default.homedir(), common_all_1.FOLDERS.DENDRON_SYSTEM_ROOT, common_all_1.FOLDERS.SAVED_TELEMETRY);
        let files = [];
        try {
            files = await fs_extra_1.default.readdir(telemetryDir);
        }
        catch {
            logger_1.Logger.warn({
                ctx,
                msg: "failed to read the saved telemetry dir",
                telemetryDir,
            });
        }
        return (0, common_all_1.asyncLoop)(files.filter((filename) => path_1.default.extname(filename) === ".json"), async (filename) => {
            const filePath = path_1.default.join(telemetryDir, filename);
            try {
                const contents = await fs_extra_1.default.readFile(filePath, { encoding: "utf-8" });
                const payload = JSON.parse(contents);
                payload.timestamp = new Date(payload.timestamp);
                await common_server_1.SegmentUtils.trackSync(payload);
                await fs_extra_1.default.rm(filePath);
            }
            catch (err) {
                logger_1.Logger.warn({
                    ctx,
                    msg: "failed to read or parse saved telemetry",
                    filePath,
                });
            }
        });
    }
    static identify(props) {
        const defaultProps = AnalyticsUtils.getVSCodeIdentifyProps();
        // if partial props is passed, fill them with defaults before calling identify.
        const _props = props ? lodash_1.default.defaults(props, defaultProps) : defaultProps;
        common_server_1.SegmentUtils.identify(_props);
    }
    /**
     * Setup segment client
     * Also setup cache flushing in case of missed uploads
     */
    static setupSegmentWithCacheFlush({ context, ws, }) {
        if ((0, common_all_1.getStage)() === "prod") {
            const segmentResidualCacheDir = context.globalStorageUri.fsPath;
            fs_extra_1.default.ensureDir(segmentResidualCacheDir);
            (0, telemetry_1.setupSegmentClient)({
                ws,
                cachePath: path_1.default.join(segmentResidualCacheDir, "segmentresidualcache.log"),
            });
            // Try to flush the Segment residual cache every hour:
            (function tryFlushSegmentCache() {
                common_server_1.SegmentClient.instance()
                    .tryFlushResidualCache()
                    .then((result) => {
                    logger_1.Logger.info(`Segment Residual Cache flush attempted. ${JSON.stringify(result)}`);
                });
                // Repeat once an hour:
                setTimeout(tryFlushSegmentCache, 3600000);
            })();
        }
    }
    static showTelemetryNotice() {
        vscode.window
            .showInformationMessage(`Dendron collects limited usage data to help improve the quality of our software`, "See Details", "Opt Out")
            .then((resp) => {
            if (resp === "See Details") {
                vsCodeUtils_1.VSCodeUtils.openLink("https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html");
            }
            if (resp === "Opt Out") {
                vsCodeUtils_1.VSCodeUtils.openLink("https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html#how-to-opt-out-of-data-collection");
            }
        });
    }
}
exports.AnalyticsUtils = AnalyticsUtils;
/**
 * Wraps a callback function with a try/catch block.  In the catch, any
 * exceptions that were encountered will be uploaded to Sentry and then
 * rethrown.
 *
 * Warning! This function will cause the callback function to lose its `this` value.
 * If you are passing a method to this function, you must bind the `this` value:
 *
 * ```ts
 * const wrappedCallback = sentryReportingCallback(
 *   this.callback.bind(this)
 * );
 * ```
 *
 * Otherwise, when the function is called the `this` value will be undefined.
 *
 * @param callback the function to wrap
 * @returns the wrapped callback function
 */
function sentryReportingCallback(callback) {
    return (...args) => {
        try {
            return callback(...args);
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    };
}
function getAnalyticsPayload(source) {
    if (source && source === common_all_1.ContextualUIEvents.ContextualUICodeAction) {
        return {
            source,
        };
    }
    return {};
}
//# sourceMappingURL=analytics.js.map