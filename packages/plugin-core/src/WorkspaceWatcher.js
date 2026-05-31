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
exports.WorkspaceWatcher = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
const Sentry = __importStar(require("@sentry/node"));
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("./components/doctor/utils");
const logger_1 = require("./logger");
const TextDocumentService_1 = require("./services/node/TextDocumentService");
const analytics_1 = require("./utils/analytics");
const vsCodeUtils_1 = require("./vsCodeUtils");
const MOVE_CURSOR_PAST_FRONTMATTER_DELAY = 50; /* ms */
const context = (scope) => {
    const ROOT_CTX = "WorkspaceWatcher";
    return ROOT_CTX + ":" + scope;
};
/**
 * See [[Workspace Watcher|dendron://dendron.docs/pkg.plugin-core.ref.workspace-watcher]] for more docs
 */
class WorkspaceWatcher {
    /** The documents that have been opened during this session that have not been viewed yet in the editor. */
    _openedDocuments;
    _quickDebouncedOnDidChangeTextDocument;
    _schemaSyncService;
    _extension;
    _windowWatcher;
    constructor({ schemaSyncService, extension, windowWatcher, }) {
        this._extension = extension;
        this._schemaSyncService = schemaSyncService;
        this._openedDocuments = new Map();
        this._quickDebouncedOnDidChangeTextDocument = lodash_1.default.debounce(this.quickOnDidChangeTextDocument, 50);
        this._extension = extension;
        this._windowWatcher = windowWatcher;
    }
    // eslint-disable-next-line camelcase
    __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
        return {
            onFirstOpen: lodash_1.default.bind(this.onFirstOpen, this),
        };
    }
    activate(context) {
        this._extension.addDisposable(vscode_1.workspace.onWillSaveTextDocument(this.onWillSaveTextDocument, this, context.subscriptions));
        this._extension.addDisposable(vscode_1.workspace.onDidSaveTextDocument(this.onDidSaveTextDocument, this, context.subscriptions));
        // NOTE: currently, this is only used for logging purposes
        if (logger_1.Logger.isDebug()) {
            this._extension.addDisposable(vscode_1.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument, this, context.subscriptions));
        }
        this._extension.addDisposable(vscode_1.workspace.onWillRenameFiles(this.onWillRenameFiles, this, context.subscriptions));
        this._extension.addDisposable(vscode_1.workspace.onDidRenameFiles(this.onDidRenameFiles, this, context.subscriptions));
        this._extension.addDisposable(vscode_1.window.onDidChangeActiveTextEditor((0, analytics_1.sentryReportingCallback)((editor) => {
            if (editor?.document &&
                this.getNewlyOpenedDocument(editor.document)) {
                this.onFirstOpen(editor);
            }
        }), this, context.subscriptions));
        if (this._extension.getDWorkspace().config.workspace.enablePerfMode) {
            return;
        }
        this._extension.addDisposable(vscode_1.workspace.onDidChangeTextDocument(this._quickDebouncedOnDidChangeTextDocument, this, context.subscriptions));
    }
    async onDidSaveTextDocument(document) {
        if (common_all_1.SchemaUtils.isSchemaUri(document.uri)) {
            await this._schemaSyncService.onDidSave({
                document,
            });
        }
        else {
            await this.onDidSaveNote(document);
        }
    }
    /** This version of `onDidChangeTextDocument` is debounced for a shorter time, and is useful for UI updates that should happen quickly. */
    async quickOnDidChangeTextDocument(event) {
        try {
            // `workspace.onDidChangeTextDocument` fires 2 events for every change
            // the second one changing the dirty state of the page from `true` to `false`
            if (event.document.isDirty === false) {
                return;
            }
            const ctx = {
                ctx: "WorkspaceWatcher:quickOnDidChangeTextDocument",
                uri: event.document.uri.fsPath,
            };
            logger_1.Logger.debug({ ...ctx, state: "enter" });
            this._quickDebouncedOnDidChangeTextDocument.cancel();
            const uri = event.document.uri;
            const { wsRoot, vaults } = this._extension.getDWorkspace();
            if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({
                wsRoot,
                vaults,
                fpath: uri.fsPath,
            })) {
                logger_1.Logger.debug({ ...ctx, state: "uri not in workspace" });
                return;
            }
            logger_1.Logger.debug({ ...ctx, state: "trigger change handlers" });
            const activeEditor = vscode_1.window.activeTextEditor;
            if (activeEditor?.document.uri.fsPath === event.document.uri.fsPath) {
                this._windowWatcher.triggerUpdateDecorations(activeEditor);
            }
            logger_1.Logger.debug({ ...ctx, state: "exit" });
            return;
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    onDidOpenTextDocument(document) {
        try {
            this._openedDocuments.set(document.uri.fsPath, document);
            logger_1.Logger.debug({
                msg: "Note opened",
                fname: common_all_1.NoteUtils.uri2Fname(document.uri),
            });
            utils_1.DoctorUtils.findDuplicateNoteAndPromptIfNecessary(document, "onDidOpenTextDocument");
            utils_1.DoctorUtils.validateFilenameFromDocumentAndPromptIfNecessary(document);
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    /**
     * If note is in workspace, execute {@link onWillSaveNote}
     * @param event
     * @returns
     */
    onWillSaveTextDocument(event) {
        try {
            const ctx = "WorkspaceWatcher:onWillSaveTextDocument";
            const uri = event.document.uri;
            logger_1.Logger.info({
                ctx,
                url: uri.fsPath,
                reason: vscode_1.TextDocumentSaveReason[event.reason],
                msg: "enter",
            });
            const { wsRoot, vaults } = this._extension.getDWorkspace();
            if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({ fpath: uri.fsPath, wsRoot, vaults })) {
                logger_1.Logger.debug({
                    ctx,
                    uri: uri.fsPath,
                    msg: "not in workspace, ignoring.",
                });
                return { changes: [] };
            }
            if (uri.fsPath.endsWith(".md")) {
                return this.onWillSaveNote(event);
            }
            else {
                logger_1.Logger.debug({
                    ctx,
                    uri: uri.fsPath,
                    msg: "File type is not registered for updates. ignoring.",
                });
                return { changes: [] };
            }
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    /**
     * When saving a note, do some book keeping
     * - update the `updated` time in frontmatter
     * - update the note metadata in the engine
     *
     * this method needs to be sync since event.WaitUntil can be called
     * in an asynchronous manner.
     * @param event
     * @returns
     */
    onWillSaveNote(event) {
        const ctx = "WorkspaceWatcher:onWillSaveNote";
        const uri = event.document.uri;
        const engine = this._extension.getEngine();
        const fname = path_1.default.basename(uri.fsPath, ".md");
        const now = common_all_1.Time.now().toMillis();
        let changes = [];
        // eslint-disable-next-line  no-async-promise-executor
        const promise = new Promise(async (resolve) => {
            const note = (await engine.findNotes({
                fname,
                vault: this._extension.wsUtils.getVaultFromUri(uri),
            }))[0];
            // If we can't find the note, don't do anything
            if (!note) {
                // Log at info level and not error level for now to reduce Sentry noise
                logger_1.Logger.info({
                    ctx,
                    msg: `Note with fname ${fname} not found in engine! Skipping updated field FM modification.`,
                });
                return;
            }
            // Return undefined if document is missing frontmatter
            if (!TextDocumentService_1.TextDocumentService.containsFrontmatter(event.document)) {
                return;
            }
            const content = event.document.getText();
            const match = common_all_1.NoteUtils.RE_FM_UPDATED.exec(content);
            // update the `updated` time in frontmatter if it exists and content has changed
            if (match && engine_server_1.WorkspaceUtils.noteContentChanged({ content, note })) {
                logger_1.Logger.info({ ctx, match, msg: "update activeText editor" });
                const startPos = event.document.positionAt(match.index);
                const endPos = event.document.positionAt(match.index + match[0].length);
                changes = [
                    vscode_1.TextEdit.replace(new vscode_1.Range(startPos, endPos), `updated: ${now}`),
                ];
            }
            return resolve(changes);
        });
        event.waitUntil(promise);
        return { changes };
    }
    async onDidSaveNote(document) {
        // check and prompt duplicate warning.
        await utils_1.DoctorUtils.findDuplicateNoteAndPromptIfNecessary(document, "onDidSaveNote");
        const fname = path_1.default.basename(document.uri.fsPath, ".md");
        const engine = this._extension.getEngine();
        const config = this._extension.getDWorkspace().config;
        const { enablePersistentHistory, mainVault } = common_all_1.ConfigUtils.getProp(config, "workspace");
        if (enablePersistentHistory &&
            mainVault &&
            !fname.startsWith("dendron.hist")) {
            const date = common_all_1.Time.now().toFormat("y.MM.dd");
            const historyFile = `dendron.hist.${date}`;
            const minuteAndSecond = common_all_1.Time.now().toFormat("MM-dd-y HH:mm");
            // check if file exists
            // format line
            const maybeVault = engine.vaults.find((vault) => common_all_1.VaultUtils.getName(vault) === mainVault);
            if (!maybeVault) {
                logger_1.Logger.error({
                    ctx: "onWillSaveNote",
                    msg: `could not find vault for history file. vault: ${mainVault}`,
                });
            }
            else {
                const line = `- ${minuteAndSecond} : [[${fname}]]`;
                const base = maybeVault.fsPath;
                const fpath = path_1.default.join(engine.wsRoot, base, historyFile);
                logger_1.Logger.info({
                    ctx: "onDidSaveNote",
                    fpath,
                    line,
                    msg: "writing to history file",
                });
                if (!fs_1.default.existsSync(fpath)) {
                    const note = common_all_1.NoteUtils.create({
                        fname: historyFile,
                        vault: maybeVault,
                    });
                    await engine.writeNote(note, { runHooks: false });
                }
                fs_1.default.appendFileSync(fpath + ".md", "\n" + line);
            }
        }
    }
    /** Do not use this function, please go to `WindowWatcher.onFirstOpen() instead.`
     *
     * Checks if the given document has been opened for the first time during this session, and marks the document as being processed.
     *
     * Certain actions (such as folding and adjusting the cursor) need to be done only the first time a document is opened.
     * While the `WorkspaceWatcher` sees when new documents are opened, the `TextEditor` is not active at that point, and we can not
     * perform these actions. This code allows `WindowWatcher` to check when an editor becomes active whether that editor belongs to an
     * newly opened document.
     *
     * Mind that this method is not idempotent, checking the same document twice will always return false for the second time.
     */
    getNewlyOpenedDocument(document) {
        const key = document.uri.fsPath;
        if (this._openedDocuments?.has(key)) {
            logger_1.Logger.debug({
                msg: "Marking note as having opened for the first time this session",
                fname: common_all_1.NoteUtils.uri2Fname(document.uri),
            });
            this._openedDocuments.delete(key);
            return true;
        }
        return false;
    }
    /**
     * method to make modifications to the workspace before the file is renamed.
     * It updates all the references to the oldUri
     */
    onWillRenameFiles(args) {
        // No-op if we're not in a Dendron Workspace
        if (!this._extension.isActive()) {
            return;
        }
        try {
            const files = args.files[0];
            if (!files)
                return;
            const { vaults, wsRoot } = this._extension.getDWorkspace();
            const { oldUri, newUri } = files;
            // No-op if we are not dealing with a Dendron note.
            if (!common_all_1.NoteUtils.isNote(oldUri)) {
                return;
            }
            const oldVault = common_all_1.VaultUtils.getVaultByFilePath({
                vaults,
                wsRoot,
                fsPath: oldUri.fsPath,
            });
            const oldFname = common_all_1.DNodeUtils.fname(oldUri.fsPath);
            const newVault = common_all_1.VaultUtils.getVaultByFilePath({
                vaults,
                wsRoot,
                fsPath: newUri.fsPath,
            });
            const newFname = common_all_1.DNodeUtils.fname(newUri.fsPath);
            const opts = {
                oldLoc: {
                    fname: oldFname,
                    vaultName: common_all_1.VaultUtils.getName(oldVault),
                },
                newLoc: {
                    fname: newFname,
                    vaultName: common_all_1.VaultUtils.getName(newVault),
                },
                metaOnly: true,
            };
            analytics_1.AnalyticsUtils.track(common_all_1.ContextualUIEvents.ContextualUIRename);
            const engine = this._extension.getEngine();
            const updateNoteReferences = engine.renameNote(opts);
            args.waitUntil(updateNoteReferences);
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    /**
     * method to make modifications to the workspace after the file is renamed.
     * It updates the title of the note wrt the new fname and refreshes tree view
     */
    async onDidRenameFiles(args) {
        // No-op if we're not in a Dendron Workspace
        if (!this._extension.isActive()) {
            return;
        }
        try {
            const files = args.files[0];
            if (!files)
                return;
            const { newUri } = files;
            const fname = common_all_1.DNodeUtils.fname(newUri.fsPath);
            const engine = this._extension.getEngine();
            const { vaults, wsRoot } = this._extension.getDWorkspace();
            // No-op if we are not dealing with a Dendron note.
            if (!common_all_1.NoteUtils.isNote(newUri)) {
                return;
            }
            const newVault = common_all_1.VaultUtils.getVaultByFilePath({
                vaults,
                wsRoot,
                fsPath: newUri.fsPath,
            });
            const vpath = (0, common_server_1.vault2Path)({ wsRoot, vault: newVault });
            const newLocPath = path_1.default.join(vpath, fname + ".md");
            const resp = (0, common_server_1.file2Note)(newLocPath, newVault);
            if (common_all_1.ErrorUtils.isErrorResp(resp)) {
                throw resp.error;
            }
            let newNote = resp.data;
            const noteHydrated = await engine.getNote(newNote.id);
            if (noteHydrated.data) {
                newNote = common_all_1.NoteUtils.hydrate({
                    noteRaw: newNote,
                    noteHydrated: noteHydrated.data,
                });
            }
            newNote.title = common_all_1.NoteUtils.genTitle(fname);
            await engine.writeNote(newNote);
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    /**
     * Dendron will perform changes like moving the cursor when first opening a Dendron note
     * @returns boolean : returns `true` if Dendron made changes during `onFirstOpen` and `false` otherwise
     */
    async onFirstOpen(editor) {
        logger_1.Logger.info({
            ctx: context("onFirstOpen"),
            msg: "enter",
            fname: common_all_1.NoteUtils.uri2Fname(editor.document.uri),
        });
        const { vaults, wsRoot } = this._extension.getDWorkspace();
        const fpath = editor.document.uri.fsPath;
        // don't apply actions to non-dendron notes
        // NOTE: in the future if we add `onFirstOpen` actions to non-dendron notes, this logic will need to be updated
        if (!(await engine_server_1.WorkspaceUtils.isDendronNote({ wsRoot, vaults, fpath }))) {
            return false;
        }
        WorkspaceWatcher.moveCursorPastFrontmatter(editor);
        const config = this._extension.getDWorkspace().config;
        if (common_all_1.ConfigUtils.getWorkspace(config).enableAutoFoldFrontmatter) {
            await this.foldFrontmatter();
        }
        logger_1.Logger.info({
            ctx: context("onFirstOpen"),
            msg: "exit",
            fname: common_all_1.NoteUtils.uri2Fname(editor.document.uri),
        });
        return true;
    }
    static moveCursorPastFrontmatter(editor) {
        const ctx = "moveCursorPastFrontmatter";
        const nodePosition = unified_1.RemarkUtils.getNodePositionPastFrontmatter(editor.document.getText());
        const startFsPath = editor.document.uri.fsPath;
        if (!lodash_1.default.isUndefined(nodePosition)) {
            const position = vsCodeUtils_1.VSCodeUtils.point2VSCodePosition(nodePosition.end, {
                line: 1,
            });
            // If the user opened the document with something like the search window,
            // then VSCode is supposed to move the cursor to where the match is.
            // But if we move the cursor here, then it overwrites VSCode's move.
            // Worse, when VSCode calls this function the cursor hasn't updated yet
            // so the location will still be 0, so we have to delay a bit to let it update first.
            common_all_1.Wrap.setTimeout(() => {
                // Since we delayed, a new document could have opened. Make sure we're still in the document we expect
                if (vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath === startFsPath) {
                    const { line, character } = editor.selection.active;
                    // Move the cursor, but only if it hasn't already been moved by VSCode, another extension, or a very quick user
                    if (line === 0 && character === 0) {
                        editor.selection = new vscode_1.Selection(position, position);
                    }
                    else {
                        logger_1.Logger.debug({
                            ctx,
                            msg: "not moving cursor because the cursor was moved before we could get to it",
                        });
                    }
                }
                else {
                    logger_1.Logger.debug({
                        ctx,
                        msg: "not moving cursor because the document changed before we could move it",
                    });
                }
            }, MOVE_CURSOR_PAST_FRONTMATTER_DELAY);
        }
    }
    async foldFrontmatter() {
        await vsCodeUtils_1.VSCodeUtils.foldActiveEditorAtPosition({ line: 0 });
    }
}
exports.WorkspaceWatcher = WorkspaceWatcher;
//# sourceMappingURL=WorkspaceWatcher.js.map