"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowWatcher = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const luxon_1 = require("luxon");
const vscode_1 = require("vscode");
const ExtensionProvider_1 = require("./ExtensionProvider");
const windowDecorations_1 = require("./features/windowDecorations");
const logger_1 = require("./logger");
const analytics_1 = require("./utils/analytics");
const ExtensionUtils_1 = require("./utils/ExtensionUtils");
const trackScrolled = lodash_1.default.debounce(() => {
    analytics_1.AnalyticsUtils.track(common_all_1.EngagementEvents.NoteScrolled, {
        noteScrolledSource: common_all_1.NoteScrolledSource.EDITOR,
    });
}, 2500);
/**
 * See [[Window Watcher|dendron://dendron.docs/pkg.plugin-core.ref.window-watcher]] for docs
 */
class WindowWatcher {
    _extension;
    _preview;
    constructor({ extension, previewProxy, }) {
        this._extension = extension;
        this._preview = previewProxy;
    }
    activate() {
        const context = this._extension.context;
        // provide logging whenever window changes
        this._extension.addDisposable(vscode_1.window.onDidChangeVisibleTextEditors((0, analytics_1.sentryReportingCallback)((editors) => {
            const ctx = "WindowWatcher:onDidChangeVisibleTextEditors";
            const editorPaths = editors.map((editor) => {
                return editor.document.uri.fsPath;
            });
            logger_1.Logger.info({ ctx, editorPaths });
        })));
        this._extension.addDisposable(vscode_1.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this, context.subscriptions));
        this._extension.addDisposable(vscode_1.window.onDidChangeTextEditorVisibleRanges(this.onDidChangeTextEditorVisibleRanges, this, context.subscriptions));
    }
    onDidChangeActiveTextEditor = (0, analytics_1.sentryReportingCallback)(async (editor) => {
        const ctx = "WindowWatcher:onDidChangeActiveTextEditor";
        if (!editor ||
            editor.document.uri.fsPath !==
                vscode_1.window.activeTextEditor?.document.uri.fsPath ||
            // ignore text editors like the output window
            editor.document.uri.scheme !== "file") {
            return;
        }
        // TODO: changing this to `this._extension.wsUtils.` will fails some tests that
        // mock the extension. Change once that is fixed.
        const note = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromDocument(editor.document);
        if (lodash_1.default.isUndefined(note)) {
            return;
        }
        logger_1.Logger.info({ ctx, editor: editor.document.uri.fsPath });
        this.triggerUpdateDecorations(editor);
        // If automatically show preview is enabled, then open the preview
        // whenever text editor changed, as long as it's not already opened:
        if (this._extension.workspaceService?.config.preview
            ?.automaticallyShowPreview) {
            if (!this._preview.isOpen()) {
                await this._preview.show();
            }
        }
        // If the opened note is still the active text editor 5 seconds after
        // opening, then count it as a valid 'viewed' event
        setTimeout(() => {
            if (editor.document.uri.fsPath ===
                vscode_1.window.activeTextEditor?.document.uri.fsPath) {
                const now = common_all_1.Time.now().toMillis();
                const daysSinceCreated = Math.round(luxon_1.Duration.fromMillis(now - note.created).as("days"));
                const daysSinceUpdated = Math.round(luxon_1.Duration.fromMillis(now - note.updated).as("days"));
                analytics_1.AnalyticsUtils.track(common_all_1.EngagementEvents.NoteViewed, {
                    daysSinceCreation: daysSinceCreated,
                    daysSinceUpdate: daysSinceUpdated,
                });
            }
        }, 5000);
    });
    onDidChangeTextEditorVisibleRanges = (0, analytics_1.sentryReportingCallback)(async (e) => {
        const editor = e?.textEditor;
        const ctx = "WindowWatcher:onDidChangeTextEditorVisibleRanges";
        if (!editor) {
            logger_1.Logger.info({ ctx, editor: "undefined" });
            return;
        }
        const uri = editor.document.uri;
        const { vaults, wsRoot } = this._extension.getDWorkspace();
        if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({ fpath: uri.fsPath, vaults, wsRoot })) {
            return;
        }
        logger_1.Logger.debug({ ctx, editor: uri.fsPath });
        // check if its a note and we should update decorators
        const note = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromDocument(editor.document);
        if (lodash_1.default.isUndefined(note)) {
            return;
        }
        // Decorations only render the visible portions of the screen, so they
        // need to be re-rendered when the user scrolls around
        this.triggerUpdateDecorations(editor);
        if (editor.document.uri.fsPath ===
            vscode_1.window.activeTextEditor?.document.uri.fsPath &&
            ExtensionUtils_1.ExtensionUtils.getTutorialIds().has(note.id)) {
            trackScrolled();
        }
    });
    /**
     * Decorate wikilinks, user tags etc. as well as warning about some issues like missing frontmatter
     */
    async triggerUpdateDecorations(editor) {
        if (!editor)
            return;
        // This may be the active editor, but could be another editor that's open side by side without being selected.
        // Also, debouncing this based on the editor URI so that decoration updates in different editors don't affect each other but updates don't trigger too often for the same editor
        windowDecorations_1.debouncedUpdateDecorations.debouncedFn(editor);
        return;
    }
    // eslint-disable-next-line camelcase
    __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
        return {
            onDidChangeActiveTextEditor: this.onDidChangeActiveTextEditor.bind(this),
        };
    }
}
exports.WindowWatcher = WindowWatcher;
//# sourceMappingURL=windowWatcher.js.map