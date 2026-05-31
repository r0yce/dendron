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
exports.PreviewPanel = void 0;
const common_all_1 = require("@dendronhq/common-all");
const dev_1 = require("../../utils/dev");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const logger_1 = require("../../logger");
const analytics_1 = require("../../utils/analytics");
const utils_1 = require("../../views/utils");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtilsV2_1 = require("../../WSUtilsV2");
/**
 * This is the default implementation of PreviewProxy. It contains a singleton
 * of a vscode webviewPanel that renders the note preview. Furthermore, it will
 * automatically handle event subscriptions to know when to update the preview,
 * as well as properly dispose of the resources when the preview has been
 * closed.
 */
class PreviewPanel {
    _ext;
    _panel;
    _textDocumentService;
    _onDidChangeActiveTextEditor = undefined;
    _onTextChanged = undefined;
    _linkHandler;
    _lockedEditorNoteId;
    /**
     *
     * @param param0 extension - IDendronExtension implementation. linkHandler -
     * Implementation to handle preview link clicked events
     */
    constructor({ extension, linkHandler, textDocumentService, }) {
        this._ext = extension;
        this._linkHandler = linkHandler;
        this._textDocumentService = textDocumentService;
    }
    /**
     * Show the preview.
     * @param note - if specified, this will override the preview contents with
     * the contents specified in this parameter. Otherwise, the contents of the
     * preview will follow default behavior (it will show the currently in-focus
     * Dendron note).
     */
    async show(note) {
        const perf = new common_all_1.PerformanceTimer({ timerName: "PreviewShow" });
        perf.before("total");
        if (this._panel) {
            if (!this.isVisible()) {
                this._panel.reveal();
            }
        }
        else {
            const viewColumn = vscode.ViewColumn.Beside; // Editor column to show the new webview panel in.
            const preserveFocus = true;
            const port = this._ext.port;
            const engine = this._ext.getEngine();
            const { wsRoot } = engine;
            const { bundleName: name, label } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.NOTE_PREVIEW);
            this._panel = vscode.window.createWebviewPanel(name, label, {
                viewColumn,
                preserveFocus,
            }, {
                enableScripts: true,
                enableCommandUris: true,
                retainContextWhenHidden: true,
                enableFindWidget: true,
                localResourceRoots: utils_1.WebViewUtils.getLocalResourceRoots(this._ext.context).concat(vscode.Uri.file(wsRoot)),
            });
            const webViewAssets = utils_1.WebViewUtils.getJsAndCss();
            const initialTheme = common_all_1.ConfigUtils.getPreview(this._ext.getDWorkspace().config).theme || "";
            const html = await utils_1.WebViewUtils.getWebviewContent({
                ...webViewAssets,
                name,
                port,
                wsRoot,
                panel: this._panel,
                initialTheme,
            });
            this._panel.webview.html = html;
            this.setupCallbacks();
            this._panel.onDidDispose(() => {
                if (this._onDidChangeActiveTextEditor) {
                    this._onDidChangeActiveTextEditor.dispose();
                    this._onDidChangeActiveTextEditor = undefined;
                }
                if (this._onTextChanged) {
                    this._onTextChanged.dispose();
                    this._onTextChanged = undefined;
                }
                this._panel = undefined;
                this.unlock();
            });
            this._panel.reveal(viewColumn, preserveFocus);
        }
        if (note && this.isVisible()) {
            this.sendRefreshMessage(this._panel, note, true);
        }
        perf.after("total");
        const shouldLog = process.env.DENDRON_PERF === "1" || process.env.LOG_LEVEL === "debug";
        if (shouldLog) {
            (0, dev_1.logPerfReport)("Preview", perf.report());
        }
    }
    hide() {
        this.dispose();
    }
    async lock(noteId) {
        if (noteId) {
            this._lockedEditorNoteId = noteId;
            this.sendLockMessage(this._panel, this.isLocked());
        }
        else {
            logger_1.Logger.error({
                ctx: "lock preview",
                msg: "Did not find note to lock.",
            });
        }
    }
    unlock() {
        this._lockedEditorNoteId = undefined;
        this.sendLockMessage(this._panel, this.isLocked());
    }
    isOpen() {
        return this._panel !== undefined;
    }
    isVisible() {
        return this._panel !== undefined && this._panel.visible;
    }
    isLocked() {
        return this._lockedEditorNoteId !== undefined;
    }
    /**
     * If the Preview is locked and the active note does not match the locked note.
     */
    async isLockedAndDirty() {
        const note = await this._ext.wsUtils.getActiveNote();
        return this.isLocked() && note?.id !== this._lockedEditorNoteId;
    }
    dispose() {
        this.unlock();
        if (this._panel) {
            this._panel.dispose();
            this._panel = undefined;
        }
    }
    setupCallbacks() {
        const wsUtils = new WSUtilsV2_1.WSUtilsV2(this._ext);
        // Callback on getting a message back from the webview
        this._panel.webview.onDidReceiveMessage(async (msg) => {
            const ctx = "ShowPreview:onDidReceiveMessage";
            logger_1.Logger.debug({ ctx, msgType: msg.type });
            switch (msg.type) {
                case common_all_1.DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR:
                case common_all_1.DMessageEnum.INIT: {
                    // do nothing
                    break;
                }
                case common_all_1.DMessageEnum.MESSAGE_DISPATCHER_READY: {
                    // if ready, get current note
                    let note;
                    if (this.initWithNote !== undefined) {
                        note = this.initWithNote;
                        logger_1.Logger.debug({
                            ctx,
                            msg: "got pre-set note",
                            note: common_all_1.NoteUtils.toLogObj(note),
                        });
                    }
                    else {
                        note = await wsUtils.getActiveNote();
                        if (note) {
                            logger_1.Logger.debug({
                                ctx,
                                msg: "got active note",
                                note: common_all_1.NoteUtils.toLogObj(note),
                            });
                        }
                    }
                    if (note) {
                        this.sendRefreshMessage(this._panel, note, true);
                    }
                    break;
                }
                case common_all_1.NoteViewMessageEnum.onClick: {
                    const { data } = msg;
                    this._linkHandler.onLinkClicked({ data });
                    break;
                }
                case common_all_1.NoteViewMessageEnum.onGetActiveEditor: {
                    logger_1.Logger.debug({ ctx, "msg.type": "onGetActiveEditor" });
                    const activeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    const maybeNote = !lodash_1.default.isUndefined(activeTextEditor)
                        ? await this._ext.wsUtils.tryGetNoteFromDocument(activeTextEditor?.document)
                        : undefined;
                    if (!lodash_1.default.isUndefined(maybeNote)) {
                        this.sendRefreshMessage(this._panel, maybeNote, true);
                    }
                    break;
                }
                case common_all_1.NoteViewMessageEnum.onLock: {
                    const { data } = msg;
                    logger_1.Logger.debug({ ctx, "msg.type": "onLock" });
                    this.lock(data.id);
                    break;
                }
                case common_all_1.NoteViewMessageEnum.onUnlock: {
                    logger_1.Logger.debug({ ctx, "msg.type": "onUnlock" });
                    this.unlock();
                    break;
                }
                case common_all_1.DMessageEnum.ON_UPDATE_PREVIEW_HTML:
                    break;
                default:
                    (0, common_all_1.assertUnreachable)(msg.type);
            }
        });
        // If the user changes focus, then the newly in-focus Dendron note should be
        // shown in the preview
        this._onDidChangeActiveTextEditor =
            vscode.window.onDidChangeActiveTextEditor((0, analytics_1.sentryReportingCallback)(async (editor) => {
                if (!editor ||
                    editor.document.uri.fsPath !==
                        vscode.window.activeTextEditor?.document.uri.fsPath ||
                    (await this.isLockedAndDirty())) {
                    return;
                }
                const textDocument = editor.document;
                const { wsRoot, vaults } = this._ext.getDWorkspace();
                if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({
                    wsRoot,
                    vaults,
                    fpath: textDocument.uri.fsPath,
                })) {
                    return;
                }
                const maybeNote = await this._ext.wsUtils.tryGetNoteFromDocument(editor.document);
                if (!maybeNote) {
                    return;
                }
                this.sendRefreshMessage(this._panel, maybeNote, true);
            }));
        // If the text document contents have changed, update the preview with the new
        // contents. This call is debounced every 200 ms
        this._onTextChanged = vscode.workspace.onDidChangeTextDocument(lodash_1.default.debounce(this.updatePreviewPanel, 200), this);
        this._ext.addDisposable(this._onDidChangeActiveTextEditor);
        this._ext.addDisposable(this._onTextChanged);
    }
    /** Rewrites the image URLs to use VSCode's webview URIs, which is required to
     * access files from the preview.
     *
     * The results of this is cached based on the note content hash, so repeated
     * calls should not be excessively expensive.
     */
    rewriteImageUrls = (0, common_all_1.memoize)({
        fn: (note, panel) => {
            const parser = unified_1.MDUtilsV5.procRemarkFull({
                noteToRender: note,
                dest: common_all_1.DendronASTDest.MD_DENDRON,
                fname: note.fname,
                vault: note.vault,
                config: common_server_1.DConfig.readConfigSync(this._ext.getDWorkspace().wsRoot, true),
                wsRoot: this._ext.getDWorkspace().wsRoot,
                vaults: this._ext.getDWorkspace().vaults,
            });
            const tree = parser.parse(note.body);
            // ^preview-rewrites-images
            (0, unified_1.visit)(tree, [unified_1.DendronASTTypes.IMAGE, unified_1.DendronASTTypes.EXTENDED_IMAGE], (image) => {
                if (!(0, common_all_1.isWebUri)(image.url)) {
                    (0, unified_1.makeImageUrlFullPath)({ node: image, proc: parser });
                    image.url = panel.webview
                        .asWebviewUri(vscode.Uri.file(image.url))
                        .toString();
                }
            });
            return {
                ...note,
                body: parser.stringify(tree),
            };
        },
        keyFn: (note) => note.id,
        shouldUpdate: (previous, current) => previous.contentHash !== current.contentHash,
    });
    /**
     * Notify preview webview panel to display latest contents
     *
     * @param panel panel to notify
     * @param note note to display
     * @param isFullRefresh If true, sync contents of note with what's being seen in active editor.
     * This will be true in cases where user switches between tabs or opens/closes notes without saving, as contents of notes may not match engine notes.
     * Otherwise display contents of note
     */
    async sendRefreshMessage(panel, note, isFullRefresh) {
        if (this.isVisible()) {
            // Engine state has not changed so do not sync. This is for displaying updated text only
            const syncChangedNote = false;
            // If full refresh is required, sync note with contents in active text editor
            const textDocument = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document;
            if (textDocument && isFullRefresh) {
                note = await this._textDocumentService.applyTextDocumentToNoteProps(note, textDocument);
            }
            note = this.rewriteImageUrls(note, panel);
            try {
                return panel.webview.postMessage({
                    type: common_all_1.DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
                    data: {
                        note,
                        syncChangedNote,
                    },
                    source: "vscode",
                });
            }
            catch (err) {
                logger_1.Logger.info({
                    ctx: "sendRefreshMessage",
                    state: "webview is disposed",
                });
                return;
            }
        }
        return;
    }
    sendLockMessage(panel, isLocked) {
        try {
            return panel?.webview.postMessage({
                type: isLocked
                    ? common_all_1.NoteViewMessageEnum.onLock
                    : common_all_1.NoteViewMessageEnum.onUnlock,
                data: {},
                source: "vscode",
            });
        }
        catch (err) {
            logger_1.Logger.info({
                ctx: "sendLockMessage",
                state: "webview is disposed",
            });
            return;
        }
    }
    /**
     * If panel is visible, update preview panel with text document changes
     */
    async updatePreviewPanel(textDocument) {
        if (textDocument.document.isDirty === false) {
            return;
        }
        if (this.isVisible() && !(await this.isLockedAndDirty())) {
            const note = await this._textDocumentService.processTextDocumentChangeEvent(textDocument);
            if (note) {
                return this.sendRefreshMessage(this._panel, note, false);
            }
        }
        return undefined;
    }
    initWithNote;
    // eslint-disable-next-line camelcase
    __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
        return {
            rewriteImageUrls: (note) => {
                if (!this._panel)
                    throw new common_all_1.DendronError({
                        message: "Panel used before being initalized",
                    });
                return this.rewriteImageUrls(note, this._panel);
            },
        };
    }
}
exports.PreviewPanel = PreviewPanel;
//# sourceMappingURL=PreviewPanel.js.map