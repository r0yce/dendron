"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsReportCommand = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const utils_1 = require("../utils");
const workspace_1 = require("../workspace");
const base_1 = require("./base");
const L = logger_1.Logger;
class DiagnosticsReportCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.DEV_DIAGNOSTICS_REPORT.key;
    async execute(opts) {
        const ctx = "execute";
        L.info({ ctx, opts });
        const logPath = logger_1.Logger.logPath;
        if (!logPath) {
            throw Error("logPath not defined");
        }
        const logFile = fs_extra_1.default.readFileSync(logPath, { encoding: "utf8" });
        const firstLines = logFile.slice(0, 10000);
        const lastLines = logFile.slice(-10000);
        const serverLogPath = path_1.default.join(path_1.default.dirname(logPath), "dendron.server.log");
        let serverLastLines = "";
        if (fs_extra_1.default.pathExistsSync(serverLogPath)) {
            const serverLogFile = fs_extra_1.default.readFileSync(serverLogPath, {
                encoding: "utf8",
            });
            serverLastLines = serverLogFile.slice(-5000);
        }
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const config = ext.getDWorkspace().config.toString();
        const port = ext.port;
        let wsFile;
        try {
            const workspaceFile = workspace_1.DendronExtension.workspaceFile().fsPath;
            wsFile = await fs_extra_1.default.readFile(workspaceFile, { encoding: "utf8" });
        }
        catch {
            // Workspace file is missing, may be a native workspace
            wsFile = "<!-- workspace file doesn't exist -->";
        }
        const content = [
            "# Plugin Logs",
            firstLines,
            "---",
            lastLines,
            "---",
            "# Server Logs",
            serverLastLines,
            "# Dendron Config",
            config,
            "# Port",
            port,
            "# Workspace File",
            wsFile,
        ].join("\n");
        const document = await vscode_1.workspace.openTextDocument({
            language: "markdown",
            content,
        });
        await vscode_1.window.showTextDocument(document);
        await utils_1.clipboard.writeText(content);
        return;
    }
    async showResponse() {
        vscode_1.window.showInformationMessage("diagnostics report copied to clipboard");
    }
}
exports.DiagnosticsReportCommand = DiagnosticsReportCommand;
//# sourceMappingURL=DiagnosticsReport.js.map