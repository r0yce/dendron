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
exports.PublishDevCommand = void 0;
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const base_1 = require("./base");
class PublishDevCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.PUBLISH_DEV.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        const ctx = "PublishDevCommand";
        this.L.info({ ctx, msg: "enter" });
        vscode_1.window
            .showWarningMessage("The Dendron: Publish Dev command is now deprecated. Please use Dendron CLI to publish your notes.", ...["Open docs"])
            .then((resp) => {
            if (resp === "Open docs") {
                vscode.commands.executeCommand("vscode.open", "https://wiki.dendron.so/notes/2340KhiZJWUy31Nrn37Fd/");
            }
        });
    }
}
exports.PublishDevCommand = PublishDevCommand;
//# sourceMappingURL=PublishDevCommand.js.map