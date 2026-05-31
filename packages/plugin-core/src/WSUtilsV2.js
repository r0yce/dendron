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
exports.WSUtilsV2 = void 0;
const vscode_1 = __importStar(require("vscode"));
const path_1 = __importDefault(require("path"));
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const logger_1 = require("./logger");
const vsCodeUtils_1 = require("./vsCodeUtils");
const ExtensionProvider_1 = require("./ExtensionProvider");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
let WS_UTILS;
/**
 *
 *  Utilities to work with workspace related functions
 **/
class WSUtilsV2 {
    extension;
    constructor(extension) {
        this.extension = extension;
    }
    getVaultFromPath(fsPath) {
        const { wsRoot, vaults } = this.extension.getDWorkspace();
        return common_all_1.VaultUtils.getVaultByFilePath({
            wsRoot,
            vaults,
            fsPath,
        });
    }
    async getNoteFromPath(fsPath) {
        const { engine } = this.extension.getDWorkspace();
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
     * Prefer NOT to use this method and instead get WSUtilsV2 passed in as
     * dependency or use IDendronExtension.wsUtils.
     *
     * This method exists to satisfy static method of WSUtils while refactoring
     * is happening and we are moving method to this class.
     * */
    static instance() {
        if (WS_UTILS === undefined) {
            WS_UTILS = new WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension());
        }
        return WS_UTILS;
    }
    getVaultFromUri(fileUri) {
        const { vaults } = this.extension.getDWorkspace();
        const vault = common_all_1.VaultUtils.getVaultByFilePath({
            fsPath: fileUri.fsPath,
            vaults,
            wsRoot: this.extension.getDWorkspace().wsRoot,
        });
        return vault;
    }
    async getNoteFromDocument(document) {
        const { engine } = this.extension.getDWorkspace();
        const txtPath = document.uri.fsPath;
        const fname = path_1.default.basename(txtPath, ".md");
        let vault;
        try {
            vault = this.getVaultFromDocument(document);
        }
        catch (err) {
            // No vault
            return undefined;
        }
        return (await engine.findNotes({ fname, vault }))[0];
    }
    /**
     * See {@link IWSUtilsV2.promptForNoteAsync}.
     */
    async promptForNoteAsync(opts) {
        const { notes, quickpickTitle, nonStubOnly = false } = opts;
        let existingNote;
        const filteredNotes = nonStubOnly
            ? notes.filter((note) => !note.stub)
            : notes;
        if (filteredNotes.length === 1) {
            // Only one match so use that as note
            existingNote = filteredNotes[0];
        }
        else if (filteredNotes.length > 1) {
            // If there are multiple notes with this fname, prompt user to select which vault
            const vaults = filteredNotes.map((noteProps) => {
                return {
                    vault: noteProps.vault,
                    label: `${noteProps.fname} from ${common_all_1.VaultUtils.getName(noteProps.vault)}`,
                };
            });
            const items = vaults.map((vaultPickerItem) => ({
                ...vaultPickerItem,
                label: vaultPickerItem.label
                    ? vaultPickerItem.label
                    : vaultPickerItem.vault.fsPath,
            }));
            const resp = await vscode_1.default.window.showQuickPick(items, {
                title: quickpickTitle,
            });
            if (!lodash_1.default.isUndefined(resp)) {
                existingNote = lodash_1.default.find(filteredNotes, { vault: resp.vault });
            }
            else {
                // If user escaped out of quickpick, then do not return error. Return undefined note instead
                return {
                    data: existingNote,
                };
            }
        }
        else {
            return {
                error: new common_all_1.DendronError({
                    message: `No note found`,
                }),
            };
        }
        return {
            data: existingNote,
        };
    }
    getVaultFromDocument(document) {
        const txtPath = document.uri.fsPath;
        const { wsRoot, vaults } = this.extension.getDWorkspace();
        const vault = common_all_1.VaultUtils.getVaultByFilePath({
            wsRoot,
            vaults,
            fsPath: txtPath,
        });
        return vault;
    }
    async tryGetNoteFromDocument(document) {
        const { wsRoot, vaults } = this.extension.getDWorkspace();
        if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({
            wsRoot,
            vaults,
            fpath: document.uri.fsPath,
        })) {
            logger_1.Logger.info({
                uri: document.uri.fsPath,
                msg: "not in workspace",
            });
            return;
        }
        try {
            const note = await this.getNoteFromDocument(document);
            return note;
        }
        catch (err) {
            logger_1.Logger.info({
                uri: document.uri.fsPath,
                msg: "not a valid note",
            });
        }
        return;
    }
    async trySelectRevealNonNoteAnchor(editor, anchor) {
        let position;
        switch (anchor.type) {
            case "line":
                // Line anchors are direct line numbers from the start
                position = new vscode_1.Position(anchor.line - 1 /* line 1 is index 0 */, 0);
                break;
            case "block":
                // We don't parse non note files for anchors, so read the document and find where the anchor is
                position = editor?.document.positionAt(editor?.document.getText().indexOf(unified_1.AnchorUtils.anchor2string(anchor)));
                break;
            default:
                // not supported for non-note files
                position = undefined;
        }
        if (position) {
            // if we did find the anchor, then select and scroll to it
            editor.selection = new vscode_1.Selection(position, position);
            editor.revealRange(editor.selection);
        }
    }
    async getActiveNote() {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (editor)
            return this.getNoteFromDocument(editor.document);
        return;
    }
    /** If the text document at `filePath` is open in any editor, return that document. */
    getMatchingTextDocument(filePath) {
        const { wsRoot } = this.extension.getDWorkspace();
        // Normalize file path for reliable comparison
        if ((0, common_server_1.isInsidePath)(wsRoot, filePath)) {
            filePath = path_1.default.relative(wsRoot, filePath);
        }
        return vscode_1.default.workspace.textDocuments.filter((document) => {
            let documentPath = document.uri.fsPath;
            if ((0, common_server_1.isInsidePath)(wsRoot, documentPath)) {
                documentPath = path_1.default.relative(wsRoot, documentPath);
            }
            return path_1.default.relative(filePath, documentPath) === "";
        })[0];
    }
    async openFileInEditorUsingFullFname(vault, fnameWithExtension) {
        const wsRoot = this.extension.getDWorkspace().wsRoot;
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const notePath = path_1.default.join(vpath, fnameWithExtension);
        const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.default.Uri.file(notePath));
        return editor;
    }
    async openNote(note) {
        const { vault, fname } = note;
        const fnameWithExtension = `${fname}.md`;
        return this.openFileInEditorUsingFullFname(vault, fnameWithExtension);
    }
    async openSchema(schema) {
        const { vault, fname } = schema;
        const fnameWithExtension = `${fname}.schema.yml`;
        return this.openFileInEditorUsingFullFname(vault, fnameWithExtension);
    }
}
exports.WSUtilsV2 = WSUtilsV2;
//# sourceMappingURL=WSUtilsV2.js.map