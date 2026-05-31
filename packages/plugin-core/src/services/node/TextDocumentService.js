"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDocumentService = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../logger");
const EditorUtils_1 = require("../../utils/EditorUtils");
/**
 * This service keeps client state note state synchronized with the engine
 * state. It also exposes an event that allows callback functionality whenever
 * the engine has finished updating a note state. See {@link ITextDocumentService}
 * See [[Note Sync Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for
 * additional docs
 */
class TextDocumentService {
    L;
    _textDocumentEventHandle;
    _extension;
    /**
     *
     * @param ext Instance of IDendronExtension
     * @param textDocumentEvent - Event returning TextDocument, such as
     * vscode.workspace.OnDidSaveTextDocument. This call is not debounced
     */
    constructor(ext, textDocumentEvent) {
        this.L = logger_1.Logger;
        this._extension = ext;
        this._textDocumentEventHandle = textDocumentEvent(this.onDidSave, this);
    }
    dispose() {
        this._textDocumentEventHandle.dispose();
    }
    async updateNoteContents(opts) {
        const ctx = "TextDocumentService:updateNoteContents";
        const { content, fmChangeOnly, fname, vault, oldNote } = opts;
        // note is considered dirty, apply any necessary changes here
        // call `doc.getText` to get latest note
        let note = (0, common_all_1.string2Note)({
            content,
            fname,
            vault,
            calculateHash: true,
        });
        // when the note changes, other notes that link to this note should still be valid
        // hence we keep backlinks when hydrating
        note = common_all_1.NoteUtils.hydrate({
            noteRaw: note,
            noteHydrated: oldNote,
            opts: {
                keepBackLinks: true,
            },
        });
        await engine_server_1.EngineUtils.refreshNoteLinksAndAnchors({
            note,
            fmChangeOnly,
            engine: this._extension.getEngine(),
            config: common_server_1.DConfig.readConfigSync(this._extension.getDWorkspace().wsRoot),
        });
        this.L.debug({ ctx, fname: note.fname, msg: "exit" });
        return note;
    }
    /**
     * Callback function for vscode.workspace.OnDidSaveTextDocument. Updates note with contents from document and saves to engine
     * @param document
     * @returns
     */
    async onDidSave(document) {
        const ctx = "TextDocumentService:onDidSave";
        const uri = document.uri;
        const fname = path_1.default.basename(uri.fsPath, ".md");
        const { wsRoot, vaults } = this._extension.getDWorkspace();
        if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath: uri.fsPath })) {
            this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
            return;
        }
        this.L.debug({ ctx, uri: uri.fsPath });
        const engine = this._extension.getEngine();
        const vault = common_all_1.VaultUtils.getVaultByFilePath({
            vaults: engine.vaults,
            wsRoot,
            fsPath: uri.fsPath,
        });
        const noteHydrated = (await engine.findNotes({ fname, vault }))[0];
        if (lodash_1.default.isUndefined(noteHydrated)) {
            return;
        }
        const content = document.getText();
        if (!engine_server_1.WorkspaceUtils.noteContentChanged({ content, note: noteHydrated })) {
            this.L.debug({
                ctx,
                uri: uri.fsPath,
                msg: "note content unchanged, ignoring",
            });
            return noteHydrated;
        }
        const props = await this.updateNoteContents({
            oldNote: noteHydrated,
            content,
            fmChangeOnly: false,
            fname,
            vault,
        });
        const resp = await engine.writeNote(props, { metaOnly: true });
        // This altering of response type is only for maintaining test compatibility
        if (resp.data && resp.data.length > 0) {
            return resp.data[0].note;
        }
        return;
    }
    /**
     * See {@link ITextDocumentService.processTextDocumentChangeEvent}
     */
    async processTextDocumentChangeEvent(event) {
        if (event.document.isDirty === false) {
            return;
        }
        const document = event.document;
        const contentChanges = event.contentChanges;
        const ctx = "TextDocumentService:processTextDocumentChangeEvent";
        const uri = document.uri;
        const fname = path_1.default.basename(uri.fsPath, ".md");
        const { wsRoot, vaults } = this._extension.getDWorkspace();
        if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath: uri.fsPath })) {
            this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
            return;
        }
        const maybePos = await EditorUtils_1.EditorUtils.getFrontmatterPosition({ document });
        let fmChangeOnly = false;
        if (!maybePos) {
            this.L.debug({ ctx, uri: uri.fsPath, msg: "no frontmatter found" });
            return;
        }
        if (contentChanges) {
            const allChangesInFM = lodash_1.default.every(contentChanges, (contentChange) => {
                const endPosition = contentChange.range.end;
                return endPosition.isBefore(maybePos);
            });
            if (allChangesInFM) {
                this.L.debug({ ctx, uri: uri.fsPath, msg: "frontmatter change only" });
                fmChangeOnly = true;
            }
        }
        this.L.debug({ ctx, uri: uri.fsPath });
        const engine = this._extension.getEngine();
        const vault = common_all_1.VaultUtils.getVaultByFilePath({
            vaults: engine.vaults,
            wsRoot: this._extension.getEngine().wsRoot,
            fsPath: uri.fsPath,
        });
        const noteHydrated = (await engine.findNotes({ fname, vault }))[0];
        if (lodash_1.default.isUndefined(noteHydrated)) {
            return;
        }
        const content = document.getText();
        if (!engine_server_1.WorkspaceUtils.noteContentChanged({ content, note: noteHydrated })) {
            this.L.debug({
                ctx,
                uri: uri.fsPath,
                msg: "note content unchanged, ignoring",
            });
            return noteHydrated;
        }
        return this.updateNoteContents({
            oldNote: noteHydrated,
            content,
            fmChangeOnly,
            fname,
            vault,
        });
    }
    /**
     * See {@link ITextDocumentService.applyTextDocumentToNoteProps}
     */
    async applyTextDocumentToNoteProps(note, textDocument) {
        const ctx = "TextDocumentService:applyTextDocument";
        const uri = textDocument.uri;
        if (!TextDocumentService.containsFrontmatter(textDocument)) {
            this.L.debug({ ctx, uri: uri.fsPath, msg: "no frontmatter found" });
            return note;
        }
        this.L.debug({ ctx, uri: uri.fsPath });
        const content = textDocument.getText();
        if (!engine_server_1.WorkspaceUtils.noteContentChanged({ content, note })) {
            this.L.debug({
                ctx,
                uri: uri.fsPath,
                msg: "note content unchanged, returning original note",
            });
            return note;
        }
        return this.updateNoteContents({
            oldNote: note,
            content,
            fmChangeOnly: false,
            fname: note.fname,
            vault: note.vault,
        });
    }
    /**
     * Returns true if textDocument contains frontmatter. False otherwise.
     */
    static containsFrontmatter(textDocument) {
        const content = textDocument.getText();
        const matchFM = common_all_1.NoteUtils.RE_FM;
        const maybeMatch = content.match(matchFM);
        if (!maybeMatch) {
            return false;
        }
        return true;
    }
    // eslint-disable-next-line camelcase
    __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
        return {
            onDidSave: this.onDidSave.bind(this),
        };
    }
}
exports.TextDocumentService = TextDocumentService;
//# sourceMappingURL=TextDocumentService.js.map