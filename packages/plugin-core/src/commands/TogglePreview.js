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
exports.TogglePreviewCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const fs = __importStar(require("fs-extra"));
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
/**
 * Command to show the preview. If the desire is to programmatically show the
 * preview webview, then prefer to get an instance of {@link PreviewProxy}
 * instead of creating an instance of this command.
 */
class TogglePreviewCommand extends base_1.InputArgCommand {
    key = constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW.key;
    _panel;
    // This class is used for both ShowPreview and TogglePreview commands.
    // Pass true for isShowCommand param to use this class for Show Preview command
    // By default, this class is used for TogglePreview
    constructor(previewPanel) {
        super();
        this._panel = previewPanel;
    }
    async sanityCheck(opts) {
        if (_.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()) &&
            _.isEmpty(opts) &&
            !this._panel.isVisible()) {
            return "No note currently open, and no note selected to open.";
        }
        return;
    }
    addAnalyticsPayload(opts) {
        return { providedFile: !_.isEmpty(opts) };
    }
    /**
     *
     * @param opts if a Uri is defined through this parameter, then that Uri will
     * be shown in preview. If unspecified, then preview will follow default
     * behavior of showing the contents of the currently in-focus Dendron note.
     */
    async execute(opts) {
        let note;
        // Hide (dispose) the previwe panel when it's already visible
        if (this._panel.isVisible()) {
            this._panel.hide();
            return undefined;
        }
        if (opts !== undefined && !_.isEmpty(opts)) {
            // Used a context menu to open preview for a specific note
            note = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromPath(opts.fsPath);
        }
        else {
            // Used the command bar or keyboard shortcut to open preview for active note
            note = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getActiveNote();
        }
        await this._panel.show();
        if (note) {
            await this._panel.show(note);
            return { note };
        }
        else if (opts?.fsPath) {
            const fsPath = opts.fsPath;
            // We can't find the note, so this is not in the Dendron workspace.
            // Preview the file anyway if it's a markdown file.
            await this.openFileInPreview(fsPath);
            return { fsPath };
        }
        else {
            // Not file selected for preview, default to open file
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            if (editor) {
                const fsPath = editor.document.uri.fsPath;
                await this.openFileInPreview(fsPath);
                return { fsPath };
            }
        }
        return undefined;
    }
    /**
     * Show a file in the preview. Only use this for files that are not notes,
     * like a markdown file outside any vault.
     * @param filePath
     * @returns
     */
    async openFileInPreview(filePath) {
        // Only preview markdown files
        if (path.extname(filePath) !== ".md")
            return;
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        // If the file is already open in an editor, get the text from there to make
        // sure we have an up-to-date view in case changes are not persisted yet
        const openFile = ExtensionProvider_1.ExtensionProvider.getWSUtils().getMatchingTextDocument(filePath);
        const contents = openFile && !openFile.isClosed
            ? openFile.getText()
            : await fs.readFile(filePath, { encoding: "utf-8" });
        const dummyFileNote = common_all_1.NoteUtils.createForFile({
            filePath,
            wsRoot,
            contents,
        });
        await this._panel.show(dummyFileNote);
    }
}
exports.TogglePreviewCommand = TogglePreviewCommand;
//# sourceMappingURL=TogglePreview.js.map