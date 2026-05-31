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
exports.Logger = exports.UNKNOWN_ERROR_MSG = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const Sentry = __importStar(require("@sentry/node"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const FileItem_1 = require("./external/fileutils/FileItem");
const levels = ["debug", "info", "warn", "error", "fatal"];
exports.UNKNOWN_ERROR_MSG = `You found a bug! We didn't think this could happen but you proved us wrong. Please file the bug here -->  https://github.com/dendronhq/dendron/issues/new?assignees=&labels=&template=bug_report.md&title= We will put our best bug exterminators on this right away!`;
// TODO: this is extracted from ./src/utils.ts
// The reason is because `logger` is used in `utils` and importing `VSCodeUtils` inside logger causes a circular dependency
const openFileInEditor = async (fileItemOrURI, opts) => {
    let textDocument;
    if (fileItemOrURI instanceof FileItem_1.FileItem) {
        if (fileItemOrURI.isDir) {
            return;
        }
        textDocument = await vscode.workspace.openTextDocument(fileItemOrURI.path);
    }
    else {
        textDocument = await vscode.workspace.openTextDocument(fileItemOrURI);
    }
    if (!textDocument) {
        throw new Error("Could not open file!");
    }
    const col = opts?.column || vscode.ViewColumn.Active;
    const editor = await vscode.window.showTextDocument(textDocument, col);
    if (!editor) {
        throw new Error("Could not show document!");
    }
    return editor;
};
class Logger {
    static output;
    static logger;
    static logPath;
    static configure(context, level) {
        const ctx = "Logger:configure";
        fs_extra_1.default.ensureDirSync(context.logPath);
        const logPath = path_1.default.join(context.logPath, "dendron.log");
        if (fs_extra_1.default.existsSync(logPath)) {
            try {
                fs_extra_1.default.moveSync(logPath, `${logPath}.old`, { overwrite: true });
            }
            catch {
                Logger.error({
                    ctx,
                    msg: `Unable to rename ${logPath}. Logs will be appended.`,
                });
            }
        }
        fs_extra_1.default.ensureFileSync(logPath);
        const conf = vscode_1.workspace.getConfiguration();
        const logLevel = conf.get(constants_1.CONFIG.LOG_LEVEL.key) || "info";
        (0, common_all_1.setEnv)("LOG_DST", logPath);
        (0, common_all_1.setEnv)("LOG_LEVEL", logLevel);
        Logger.logPath = logPath;
        this.logger = (0, common_server_1.createLogger)("dendron", logPath);
        this.level = level;
        Logger.info({ ctx, msg: "exit", logLevel });
    }
    static _level = "debug";
    /**
     * Shortcut to check if logger is set to debug
     */
    static isDebug() {
        return Logger.level === "debug";
    }
    static cmpLevel(lvl) {
        return levels.indexOf(lvl) >= levels.indexOf(Logger.level || "debug");
    }
    /**
     * Is lvl1 >= lvl2
     * @param lvl1
     * @param lvl2
     */
    static cmpLevels(lvl1, lvl2) {
        return levels.indexOf(lvl1) >= levels.indexOf(lvl2);
    }
    static get level() {
        return this._level;
    }
    static set level(value) {
        this._level = value;
        this.output =
            this.output || vscode_1.window.createOutputChannel(constants_1.DENDRON_CHANNEL_NAME);
    }
    /** Log an error.
     *
     * If an `error` is attached to log payload, the error is also sent to Sentry.
     * This should be used for internal Dendron errors that we can fix, or for
     * problems we assume should never happen.
     *
     * If the error is expected in regular execution, you can log it with
     * {@link Logger.info} instead.
     *
     * If the error is unexpected, but also not something we could fix (i.e. the
     * user misconfigured something), you'll probably want to use
     * {@link Logger.warn} instead. That way we can debug the issue in a bug
     * report by looking at the logs, but it doesn't clog up Sentry.
     */
    static error(payload) {
        Logger.log(payload, "error");
        if (payload.error) {
            // if we log an error, also report it to sentry ^sf0k4z8hnvjo
            Sentry.captureException(payload.error, {
                extra: {
                    ctx: payload.ctx,
                    name: payload.error.name,
                    message: payload.error.message,
                    payload: payload.error.payload,
                    severity: payload.error.severity?.toString(),
                    code: payload.error.code,
                    status: payload.error.status,
                },
            });
        }
        else {
            const cleanMsg = payload.msg || customStringify(payload);
            Sentry.captureMessage(cleanMsg, { extra: { ctx: payload.ctx } });
        }
    }
    static info(payload, show) {
        Logger.log(payload, "info", { show });
        Sentry.addBreadcrumb({
            category: "plugin",
            message: customStringify(payload),
            level: "info",
        });
    }
    static debug(payload) {
        Logger.log(payload, "debug");
    }
    /** Use this to log an error without submitting it to Sentry.
     *
     * This should be used for errors related to users setup etc., where
     * we wouldn't be able to do anything on our part to fix the problem.
     */
    static warn(payload) {
        Logger.log(payload, "warn");
    }
    static log = (payload, lvl, _opts) => {
        if (Logger.cmpLevel(lvl)) {
            let stringMsg;
            if (lodash_1.default.isString(payload)) {
                stringMsg = payload;
            }
            else {
                const payloadWithErrorAsPlainObject = {
                    ...payload,
                    error: payload.error
                        ? (0, common_all_1.error2PlainObject)(payload.error)
                        : payload.error,
                };
                stringMsg = customStringify(payloadWithErrorAsPlainObject);
            }
            Logger.logger?.[lvl](payload);
            Logger.output?.appendLine(lvl + ": " + stringMsg);
            // ^oy9q7tpy0v3t
            // FIXME: disable for now
            const shouldShow = false; // getStage() === "dev" && cleanOpts.show;
            if (shouldShow || Logger.cmpLevels(lvl, "error")) {
                const cleanMsg = (payload.error ? payload.error.message : payload.msg) || stringMsg;
                const fullPath = Logger.tryExtractFullPath(payload);
                if (Logger.cmpLevels(lvl, "error")) {
                    if (fullPath) {
                        // Currently when the user clicks on the action of 'Go to file.' We navigate
                        // to the file but the message explaining the error auto closes. For now we will
                        // at least set the status bar message to what went wrong.
                        vscode_1.window.setStatusBarMessage(cleanMsg);
                        const navigateMsg = "Go to file.";
                        vscode_1.window.showErrorMessage(cleanMsg, {}, navigateMsg).then((value) => {
                            if (value === navigateMsg) {
                                openFileInEditor(vscode_1.Uri.file(fullPath));
                            }
                        });
                    }
                    else {
                        vscode_1.window.showErrorMessage(cleanMsg);
                    }
                }
                else if (Logger.cmpLevels(lvl, "info")) {
                    vscode_1.window.showInformationMessage(cleanMsg);
                }
            }
        }
    };
    /**
     * Extract full path from the payload when it exists in the error
     * otherwise return undefined. This path is meant to be used for user to be
     * able to navigate to the file at fault.
     *   */
    static tryExtractFullPath(payload) {
        let fullPath;
        try {
            if (payload.error?.payload) {
                fullPath = JSON.parse(JSON.parse(payload.error?.payload)).fullPath;
            }
        }
        catch (err) {
            fullPath = undefined;
        }
        return fullPath;
    }
}
exports.Logger = Logger;
const customStringify = function (v) {
    const cache = new Set();
    return JSON.stringify(v, (_key, value) => {
        if (typeof value === "object" && value !== null) {
            if (cache.has(value)) {
                // Circular reference found
                try {
                    // If this value does not reference a parent it can be deduped
                    return JSON.parse(JSON.stringify(value));
                }
                catch (err) {
                    // discard key if value cannot be deduped
                    return;
                }
            }
            // Store value in our set
            cache.add(value);
        }
        return value;
    });
};
//# sourceMappingURL=logger.js.map