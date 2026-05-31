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
exports.WSUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("./constants");
const ExtensionProvider_1 = require("./ExtensionProvider");
const logger_1 = require("./logger");
const vsCodeUtils_1 = require("./vsCodeUtils");
/**
 * Prefer to use WSUtilsV2 instead of this class to prevent circular dependencies.
 * (move methods from this file to WSUtilsV2 as needed).
 * See [[Migration of static  methods to a non-static|dendron://dendron.docs/dev.ref.impactful-change-notice#migration-of-static--methods-to-a-non-static]]
 * */
class WSUtils {
    static showActivateProgress() {
        const ctx = "showActivateProgress";
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Starting Dendron...",
            cancellable: true,
        }, (_progress, _token) => {
            _token.onCancellationRequested(() => {
                // eslint-disable-next-line no-console
                console.log("Cancelled");
            });
            const p = new Promise((resolve) => {
                engine_server_1.HistoryService.instance().subscribe("extension", async (_event) => {
                    if (_event.action === "initialized") {
                        resolve(undefined);
                    }
                });
                engine_server_1.HistoryService.instance().subscribe("extension", async (_event) => {
                    if (_event.action === "not_initialized") {
                        logger_1.Logger.error({ ctx, msg: "issue initializing Dendron" });
                        resolve(undefined);
                    }
                });
            });
            return p;
        });
    }
    /**
     * Performs a series of step to initialize the workspace
     *  Calls activate workspace
     * - initializes DendronEngine
     * @param mainVault
     */
    static async reloadWorkspace() {
        try {
            const out = await vscode.commands.executeCommand(constants_1.DENDRON_COMMANDS.RELOAD_INDEX.key, true);
            return out;
        }
        catch (err) {
            logger_1.Logger.error({ error: err });
            return undefined;
        }
    }
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getVaultFromPath(fsPath) {
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        return common_all_1.VaultUtils.getVaultByFilePath({
            wsRoot,
            vaults,
            fsPath,
        });
    }
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static async getNoteFromPath(fsPath) {
        const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const fname = path_1.default.basename(fsPath, ".md");
        let vault;
        try {
            vault = this.getVaultFromPath(fsPath);
        }
        catch (err) {
            // No vault
            return undefined;
        }
        return (await engine.findNotes({ fname, vault }))[0];
    }
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getVaultFromDocument(document) {
        return this.getVaultFromPath(document.uri.fsPath);
    }
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static async getNoteFromDocument(document) {
        return this.getNoteFromPath(document.uri.fsPath);
    }
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getActiveNote() {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (editor)
            return this.getNoteFromDocument(editor.document);
        return;
    }
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static async openFileInEditorUsingFullFname(vault, fnameWithExtension) {
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const notePath = path_1.default.join(vpath, fnameWithExtension);
        const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        return editor;
    }
    static async openNoteByPath({ vault, fname, }) {
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const notePath = path_1.default.join(vpath, `${fname}.md`);
        const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        return editor;
    }
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static async openNote(note) {
        const { vault, fname } = note;
        const fnameWithExtension = `${fname}.md`;
        return this.openFileInEditorUsingFullFname(vault, fnameWithExtension);
    }
    static async openSchema(schema) {
        const { vault, fname } = schema;
        const fnameWithExtension = `${fname}.schema.yml`;
        return this.openFileInEditorUsingFullFname(vault, fnameWithExtension);
    }
}
exports.WSUtils = WSUtils;
//# sourceMappingURL=WSUtils.js.map