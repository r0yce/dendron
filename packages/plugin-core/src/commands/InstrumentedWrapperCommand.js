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
exports.InstrumentedWrapperCommand = void 0;
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const analytics_1 = require("../utils/analytics");
const base_1 = require("./base");
/**
 * This command is a simple wrapper around commands, but this wrapper also fires
 * a telemetry event when it is invoked. This is intended to be used as a
 * wrapper around built-in VSCode commands that need to be invoked via a command
 * URI, such as within webviews or in TreeView items, but where we still want a
 * telemetry event to get reported.
 */
class InstrumentedWrapperCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.INSTRUMENTED_WRAPPER_COMMAND.key;
    /**
     * Helper method to create a vscode.Command instance that utilizes this wrapper
     * @param args
     * @returns
     */
    static createVSCodeCommand(args) {
        return {
            title: args.command.title,
            command: constants_1.DENDRON_COMMANDS.INSTRUMENTED_WRAPPER_COMMAND.key,
            arguments: [args],
        };
    }
    async execute(opts) {
        const args = opts.command.arguments ?? [];
        await vscode.commands.executeCommand(opts.command.command, ...args);
        analytics_1.AnalyticsUtils.track(opts.event, opts.customProps);
    }
}
exports.InstrumentedWrapperCommand = InstrumentedWrapperCommand;
//# sourceMappingURL=InstrumentedWrapperCommand.js.map