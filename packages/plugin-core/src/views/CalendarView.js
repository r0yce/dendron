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
exports.CalendarView = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const CreateDailyJournal_1 = require("../commands/CreateDailyJournal");
const GotoNote_1 = require("../commands/GotoNote");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const utils_1 = require("./utils");
class CalendarView {
    static viewType = common_all_1.DendronTreeViewKey.CALENDAR_VIEW;
    _view;
    _extension;
    constructor(extension) {
        this._extension = extension;
        this._extension.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this));
    }
    postMessage(msg) {
        this._view?.webview.postMessage(msg);
    }
    async resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        await utils_1.WebViewUtils.prepareTreeView({
            ext: this._extension,
            key: common_all_1.DendronTreeViewKey.CALENDAR_VIEW,
            webviewView,
        });
        webviewView.webview.onDidReceiveMessage(this.onDidReceiveMessageHandler, this);
    }
    async onDidReceiveMessageHandler(msg) {
        const ctx = "onDidReceiveMessage";
        logger_1.Logger.info({ ctx, data: msg });
        switch (msg.type) {
            case common_all_1.CalendarViewMessageType.onSelect: {
                logger_1.Logger.info({
                    ctx: `${ctx}:onSelect`,
                    data: msg.data,
                });
                const { id, fname } = msg.data;
                // eslint-disable-next-line no-cond-assign
                if (id) {
                    const note = (await this._extension.getEngine().getNoteMeta(id)).data;
                    if (note) {
                        await new GotoNote_1.GotoNoteCommand(this._extension).execute({
                            qs: note.fname,
                            vault: note.vault,
                        });
                    }
                }
                else if (fname) {
                    await new CreateDailyJournal_1.CreateDailyJournalCommand(this._extension).execute({
                        fname,
                    });
                }
                break;
            }
            case common_all_1.CalendarViewMessageType.onGetActiveEditor: {
                this.onActiveTextEditorChangeHandler(); // initial call
                break;
            }
            case common_all_1.CalendarViewMessageType.messageDispatcherReady: {
                const note = await this._extension.wsUtils.getActiveNote();
                if (note) {
                    await this.refresh(note);
                }
                break;
            }
            default:
                break;
        }
    }
    async onActiveTextEditorChangeHandler() {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (editor?.document) {
            this.onOpenTextDocument(editor);
        }
        else {
            this.refresh(); // call refresh without note so that `noteActive` gets unset.
        }
    }
    async onOpenTextDocument(editor) {
        const document = editor?.document;
        if (lodash_1.default.isUndefined(document) || lodash_1.default.isUndefined(this._view)) {
            return;
        }
        if (!this._view.visible) {
            return;
        }
        const ctx = "CalendarView:openTextDocument";
        const { wsRoot, vaults } = this._extension.getDWorkspace();
        if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({
            wsRoot,
            vaults,
            fpath: document.uri.fsPath,
        })) {
            logger_1.Logger.info({
                ctx,
                uri: document.uri.fsPath,
                msg: "not in workspace",
            });
            return;
        }
        const note = await this._extension.wsUtils.getNoteFromDocument(document);
        if (note) {
            logger_1.Logger.info({
                ctx,
                msg: "refresh note",
                note: common_all_1.NoteUtils.toLogObj(note),
            });
            this.refresh(note);
        }
    }
    async refresh(note) {
        if (this._view) {
            // When the last note is closed the note will be undefined and we do not
            // want to auto expand the calendar if there are no notes.
            if (note) {
                this._view.show?.(true);
            }
            this._view.webview.postMessage({
                type: common_all_1.DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
                data: {
                    note,
                    syncChangedNote: true,
                    activeNote: await this._extension.wsUtils.getActiveNote(),
                },
                source: "vscode",
            });
        }
    }
}
exports.CalendarView = CalendarView;
//# sourceMappingURL=CalendarView.js.map