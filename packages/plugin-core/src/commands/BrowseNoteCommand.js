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
exports.BrowseNoteCommand = void 0;
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class BrowseNoteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.BROWSE_NOTE.key;
    async sanityCheck() {
        if (lodash_1.default.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor())) {
            return "No document open";
        }
        return;
    }
    async execute(_opts) {
        const editor = vscode.window.activeTextEditor;
        if (vscode.workspace.workspaceFolders && editor) {
            const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            if (!folder) {
                return;
            }
            const root = (await common_server_1.GitUtils.getGitRoot(folder.uri.fsPath)) || "";
            // get just the file
            const file = editor.document.fileName.substring(root.length);
            const startLine = editor.selection.start.line;
            const endLine = editor.selection.end.line;
            const uri = vscode.Uri.parse(await common_server_1.GitUtils.getGithubFileUrl(folder.uri.fsPath, file, startLine, endLine));
            vscode.commands.executeCommand("vscode.open", uri);
            return uri;
        }
        return;
    }
}
exports.BrowseNoteCommand = BrowseNoteCommand;
//# sourceMappingURL=BrowseNoteCommand.js.map