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
exports.DevShowActivationReport = void 0;
const constants_1 = require("../constants");
const base_1 = require("./base");
const dev_1 = require("../utils/dev");
const vscode = __importStar(require("vscode"));
/**
 * Development command that shows the last activation performance report
 * in a clean, readable format.
 */
class DevShowActivationReport extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.DEV_SHOW_ACTIVATION_REPORT.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        const report = (0, dev_1.getLastActivationReport)();
        if (!report) {
            vscode.window.showWarningMessage("No activation report available yet. Restart the Extension Development Host to capture one.");
            return;
        }
        // Show in the dedicated clean dev channel
        const channel = (0, dev_1.getDevOutputChannel)();
        channel.clear();
        channel.appendLine(report);
        channel.show(true);
        // Also offer to copy to clipboard
        const choice = await vscode.window.showInformationMessage("Activation report shown in 'Dendron Dev' output channel.", "Copy to Clipboard");
        if (choice === "Copy to Clipboard") {
            await vscode.env.clipboard.writeText(report);
            vscode.window.showInformationMessage("Activation report copied to clipboard.");
        }
    }
}
exports.DevShowActivationReport = DevShowActivationReport;
//# sourceMappingURL=DevShowActivationReport.js.map