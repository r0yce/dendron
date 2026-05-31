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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TextDocumentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDocumentService = void 0;
const common_all_1 = require("@dendronhq/common-all");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const inject_1 = require("../../di/inject");
const unist_util_visit_1 = __importDefault(require("unist-util-visit"));
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const isPathInWorkspace_1 = require("../../web/utils/isPathInWorkspace");
/**
 * This version of TextDocumentService is specific to Web Ext and has the
 * following limitations before feature parity:
 *  - does not call refreshNoteLinksAndAnchors
 *
 * This service keeps client state note state synchronized with the engine
 * state. It also exposes an event that allows callback functionality whenever
 * the engine has finished updating a note state. See
 * {@link ITextDocumentService} See [[Note Sync
 * Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for
 * additional docs
 */
let TextDocumentService = TextDocumentService_1 = class TextDocumentService {
    wsRoot;
    vaults;
    engine;
    L;
    _textDocumentEventHandle;
    constructor(textDocumentEvent, wsRoot, vaults, engine, L) {
        this.wsRoot = wsRoot;
        this.vaults = vaults;
        this.engine = engine;
        this.L = L;
        this._textDocumentEventHandle = textDocumentEvent(this.onDidSave, this);
    }
    dispose() {
        this._textDocumentEventHandle.dispose();
    }
    updateNoteContents(opts) {
        const ctx = "TextDocumentService:updateNoteContents";
        const { content, fname, vault, oldNote } = opts;
        // const { content, fmChangeOnly, fname, vault, oldNote } = opts;
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
        // TODO: Add back
        // EngineUtils.refreshNoteLinksAndAnchors({
        //   note,
        //   fmChangeOnly,
        //   engine: this._extension.getEngine(),
        // });
        this.L.debug({ ctx, fname: note.fname, msg: "exit" });
        return note;
    }
    /**
     * Callback function for vscode.workspace.OnDidSaveTextDocument. Updates note
     * with contents from document and saves to engine
     * @param document
     * @returns
     */
    async onDidSave(document) {
        const ctx = "TextDocumentService:onDidSave";
        const uri = document.uri;
        const fname = vscode_uri_1.Utils.basename(uri);
        const wsRoot = this.wsRoot;
        const vaults = this.vaults;
        if (!(0, isPathInWorkspace_1.isPathInWorkspace)({ wsRoot, vaults, fsPath: uri })) {
            this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
            return;
        }
        this.L.debug({ ctx, uri: uri.fsPath });
        const vault = common_all_1.VaultUtilsV2.getVaultByFilePath({
            vaults,
            wsRoot,
            fsPath: uri,
        });
        const noteHydrated = (await this.engine.findNotes({ fname, vault }))[0];
        if (lodash_1.default.isUndefined(noteHydrated)) {
            return;
        }
        const content = document.getText();
        if (!this.noteContentChanged({ content, note: noteHydrated })) {
            this.L.debug({
                ctx,
                uri: uri.fsPath,
                msg: "note content unchanged, ignoring",
            });
            return noteHydrated;
        }
        const props = this.updateNoteContents({
            oldNote: noteHydrated,
            content,
            fmChangeOnly: false,
            fname,
            vault: vault, // TODO: Remove !
        });
        const resp = await this.engine.writeNote(props);
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
        const fname = lodash_1.default.trimEnd(vscode_uri_1.Utils.basename(uri), ".md");
        const wsRoot = this.wsRoot;
        const vaults = this.vaults;
        if (!(0, isPathInWorkspace_1.isPathInWorkspace)({ wsRoot, vaults, fsPath: uri })) {
            this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
            return;
        }
        const maybePos = await this.getFrontmatterPosition(document);
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
        const vault = common_all_1.VaultUtilsV2.getVaultByFilePath({
            vaults,
            wsRoot,
            fsPath: uri,
        });
        const note = (await this.engine.findNotes({ fname, vault }))[0];
        if (lodash_1.default.isUndefined(note)) {
            return;
        }
        const content = document.getText();
        if (!this.noteContentChanged({ content, note })) {
            this.L.debug({
                ctx,
                uri: uri.fsPath,
                msg: "note content unchanged, ignoring",
            });
            return note;
        }
        return this.updateNoteContents({
            oldNote: note,
            content,
            fmChangeOnly,
            fname,
            vault: vault, // TODO: Remove !
        });
    }
    /**
     * See {@link ITextDocumentService.applyTextDocumentToNoteProps}
     */
    async applyTextDocumentToNoteProps(note, textDocument) {
        const ctx = "TextDocumentService:applyTextDocument";
        const uri = textDocument.uri;
        if (!TextDocumentService_1.containsFrontmatter(textDocument)) {
            this.L.debug({ ctx, uri: uri.fsPath, msg: "no frontmatter found" });
            return note;
        }
        this.L.debug({ ctx, uri: uri.fsPath });
        const content = textDocument.getText();
        if (!this.noteContentChanged({ content, note })) {
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
    getFrontmatterPosition = (document) => {
        return new Promise((resolve) => {
            const proc = unified_1.MDUtilsV5.procRemarkParseNoData({}, { dest: common_all_1.DendronASTDest.MD_DENDRON });
            const parsed = proc.parse(document.getText());
            (0, unist_util_visit_1.default)(parsed, ["yaml"], (node) => {
                if (lodash_1.default.isUndefined(node.position))
                    return resolve(false); // Should never happen
                const position = this.point2VSCodePosition(node.position.end, {
                    line: 1,
                });
                resolve(position);
            });
        });
    };
    noteContentChanged({ content, note, }) {
        const noteHash = (0, common_all_1.genHash)(content);
        if (lodash_1.default.isUndefined(note.contentHash)) {
            return true;
        }
        return noteHash !== note.contentHash;
    }
    point2VSCodePosition(point, offset) {
        return new vscode.Position(
        // remark Point's are 0 indexed
        point.line - 1 + (offset?.line || 0), point.column - 1 + (offset?.column || 0));
    }
};
exports.TextDocumentService = TextDocumentService;
exports.TextDocumentService = TextDocumentService = TextDocumentService_1 = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)(inject_1.TOKENS.TextDocumentEvent)),
    __param(1, (0, inject_1.inject)(inject_1.TOKENS.WsRoot)),
    __param(2, (0, inject_1.inject)(inject_1.TOKENS.Vaults)),
    __param(3, (0, inject_1.inject)(inject_1.TOKENS.ReducedDEngine)),
    __param(4, (0, inject_1.inject)(inject_1.TOKENS.Logger)),
    __metadata("design:paramtypes", [Function, common_all_1.URI, Array, Object, Object])
], TextDocumentService);
//# sourceMappingURL=TextDocumentService.js.map