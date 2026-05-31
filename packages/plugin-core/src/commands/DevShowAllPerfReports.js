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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevShowAllPerfReports = void 0;
const constants_1 = require("../constants");
const base_1 = require("./base");
const dev_1 = require("../utils/dev");
const vscode = __importStar(require("vscode"));
/**
 * Development command that shows all recorded performance reports from the current session
 * in the clean "Dendron Dev" output channel.
 */
class DevShowAllPerfReports extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.DEV_SHOW_ALL_PERF_REPORTS.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        const reports = (0, dev_1.getAllPerfReports)();
        const channel = (0, dev_1.getDevOutputChannel)();
        channel.clear();
        if (reports.length === 0) {
            channel.appendLine("No performance reports recorded in this session yet.");
            channel.appendLine("Trigger some actions (lookup, graph, backlinks, reload index, preview) with DENDRON_PERF=1 enabled.");
            channel.show(true);
            return;
        }
        channel.appendLine(`=== All Perf Reports (${reports.length} total) ===\n`);
        reports.forEach((entry, index) => {
            channel.appendLine(`[${index + 1}] ${entry.name} @ ${entry.timestamp.toLocaleTimeString()}`);
            channel.appendLine(entry.report);
            channel.appendLine("---");
        });
        channel.show(true);
        const choice = await vscode.window.showInformationMessage(`${reports.length} perf reports shown in "Dendron Dev" channel.`, "Clear Reports", "Copy All to Clipboard");
        if (choice === "Clear Reports") {
            (0, dev_1.clearPerfReports)();
            vscode.window.showInformationMessage("Perf reports cleared.");
        }
        else if (choice === "Copy All to Clipboard") {
            const allText = reports
                .map((entry) => `[${entry.name} @ ${entry.timestamp.toISOString()}]\n${entry.report}`)
                .join("\n\n");
            await vscode.env.clipboard.writeText(allText);
            vscode.window.showInformationMessage("All perf reports copied to clipboard.");
        }
    }
}
exports.DevShowAllPerfReports = DevShowAllPerfReports;
//# sourceMappingURL=DevShowAllPerfReports.js.map