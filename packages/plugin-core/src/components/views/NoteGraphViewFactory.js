"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteGraphPanelFactory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const GotoNote_1 = require("../../commands/GotoNote");
const constants_1 = require("../../constants");
const logger_1 = require("../../logger");
const styles_1 = require("../../styles");
const utils_1 = require("../../views/utils");
const analytics_1 = require("../../utils/analytics");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const ConfigureGraphStyles_1 = require("../../commands/ConfigureGraphStyles");
class NoteGraphPanelFactory {
    static _panel = undefined;
    static _onEngineNoteStateChangedDisposable;
    static _engineEvents;
    static _ext;
    static initWithNote;
    /**
     * These properties temporarily stores the graph theme and depth selected by user and is written
     * back to MetadataService once the panel is disposed.
     */
    static defaultGraphTheme;
    static graphDepth;
    static create(ext, engineEvents) {
        if (!this._panel) {
            const { bundleName: name, label } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.NOTE_GRAPH);
            this._panel = vscode_1.window.createWebviewPanel(name, // Identifies the type of the webview. Used internally
            label, // Title of the panel displayed to the user
            {
                viewColumn: vscode_1.ViewColumn.Beside,
                preserveFocus: true,
            }, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                enableFindWidget: false,
                localResourceRoots: utils_1.WebViewUtils.getLocalResourceRoots(ext.context),
            });
            this._ext = ext;
            this._engineEvents = engineEvents;
            this._ext.context.subscriptions.push(vscode_1.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this));
            this._onEngineNoteStateChangedDisposable =
                this._engineEvents.onEngineNoteStateChanged(async (noteChangeEntry) => {
                    const ctx = "NoteGraphViewFactoryEngineNoteStateChanged";
                    logger_1.Logger.info({ ctx });
                    if (this._panel && this._panel.visible) {
                        await Promise.all(noteChangeEntry.map((changeEntry) => {
                            return this.refresh(changeEntry.note);
                        }));
                    }
                });
            // listener
            this._panel.webview.onDidReceiveMessage(async (msg) => {
                const ctx = "ShowNoteGraph:onDidReceiveMessage";
                logger_1.Logger.debug({ ctx, msgType: msg.type });
                const createStub = common_all_1.ConfigUtils.getWorkspace(this._ext.getDWorkspace().config).graph.createStub;
                switch (msg.type) {
                    case common_all_1.GraphViewMessageEnum.onSelect: {
                        const resp = await this._ext.getEngine().getNote(msg.data.id);
                        if (resp.error) {
                            throw new common_all_1.DendronError({
                                message: `Note not found for ${msg.data.id}`,
                                innerError: resp.error,
                            });
                        }
                        const note = resp.data;
                        if (note.stub && !createStub) {
                            await this.refresh(note, createStub);
                        }
                        else {
                            if ((await this._ext.wsUtils.getActiveNote())?.fname === note.fname) {
                                await this.refresh(note);
                                break;
                            }
                            await new GotoNote_1.GotoNoteCommand(this._ext).execute({
                                qs: note.fname,
                                vault: note.vault,
                                column: vscode_1.ViewColumn.One,
                            });
                        }
                        analytics_1.AnalyticsUtils.track(constants_1.DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key, {
                            message: common_all_1.GraphViewMessageEnum.onSelect,
                        });
                        break;
                    }
                    case common_all_1.GraphViewMessageEnum.onGetActiveEditor: {
                        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                        this.onOpenTextDocument(editor);
                        break;
                    }
                    case common_all_1.GraphViewMessageEnum.onRequestGraphOpts: {
                        // Set graph styles
                        const styles = styles_1.GraphStyleService.getParsedStyles();
                        const graphTheme = engine_server_1.MetadataService.instance().getGraphTheme();
                        const graphDepth = engine_server_1.MetadataService.instance().graphDepth;
                        if (graphTheme) {
                            this.defaultGraphTheme = graphTheme;
                        }
                        if (graphDepth) {
                            this.graphDepth = graphDepth;
                        }
                        if (styles || graphTheme || graphDepth) {
                            this._panel.webview.postMessage({
                                type: common_all_1.GraphViewMessageEnum.onGraphLoad,
                                data: {
                                    styles,
                                    graphTheme,
                                    graphDepth,
                                },
                                source: "vscode",
                            });
                        }
                        break;
                    }
                    case common_all_1.GraphViewMessageEnum.onReady:
                        throw new common_all_1.DendronError({
                            message: "Unexpected message received from the graph view",
                            payload: {
                                ctx: "NoteGraphPanelFactory",
                                "msg.type": msg.type,
                            },
                        });
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
                            note = await this._ext.wsUtils.getActiveNote();
                            if (note) {
                                logger_1.Logger.debug({
                                    ctx,
                                    msg: "got active note",
                                    note: common_all_1.NoteUtils.toLogObj(note),
                                });
                            }
                        }
                        if (note) {
                            await this.refresh(note);
                        }
                        break;
                    }
                    case common_all_1.GraphViewMessageEnum.onGraphThemeChange: {
                        this.defaultGraphTheme = msg.data.graphTheme;
                        analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphThemeChanged, {
                            theme: msg.data.graphTheme,
                        });
                        break;
                    }
                    case common_all_1.GraphViewMessageEnum.configureCustomStyling: {
                        await new ConfigureGraphStyles_1.ConfigureGraphStylesCommand().execute();
                        analytics_1.AnalyticsUtils.track(constants_1.DENDRON_COMMANDS.CONFIGURE_GRAPH_STYLES.key, {
                            source: "graph filter menu",
                        });
                        break;
                    }
                    case common_all_1.GraphViewMessageEnum.toggleGraphView: {
                        analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphViewUsed, {
                            type: "GraphTypeChanged",
                            state: msg.data.graphType,
                        });
                        break;
                    }
                    case common_all_1.GraphViewMessageEnum.onGraphDepthChange: {
                        this.graphDepth = msg.data.graphDepth;
                        break;
                    }
                    default:
                        break;
                }
            });
            this._panel.onDidDispose(() => {
                this._panel = undefined;
                if (this._onEngineNoteStateChangedDisposable) {
                    this._onEngineNoteStateChangedDisposable.dispose();
                }
                if (this.defaultGraphTheme) {
                    analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphThemeChanged, {
                        defaultTheme: this.defaultGraphTheme,
                    });
                    engine_server_1.MetadataService.instance().setGraphTheme(this.defaultGraphTheme);
                    this.defaultGraphTheme = undefined;
                }
                if (this.graphDepth) {
                    analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphViewUsed, {
                        graphDepth: this.graphDepth,
                    });
                    engine_server_1.MetadataService.instance().graphDepth = this.graphDepth;
                    this.graphDepth = undefined;
                }
            });
        }
        return this._panel;
    }
    /**
     * Post message to the webview content.
     * @param note
     */
    static async refresh(note, createStub) {
        if (this._panel) {
            this._panel.webview.postMessage({
                type: common_all_1.DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
                data: {
                    note,
                    syncChangedNote: true,
                    activeNote: note.stub && !createStub
                        ? note
                        : await this._ext.wsUtils.getActiveNote(),
                },
                source: common_all_1.DMessageSource.vscode,
            });
        }
    }
    /**
     * If the user changes focus, then the newly in-focus Dendron note
     * should be shown in the graph.
     */
    static async onOpenTextDocument(editor) {
        if (lodash_1.default.isUndefined(editor) || lodash_1.default.isUndefined(this._panel)) {
            return;
        }
        if (!this._panel.visible) {
            return;
        }
        const uri = editor.document.uri;
        const basename = path_1.default.basename(uri.fsPath);
        const { wsRoot, vaults } = this._ext.getDWorkspace();
        if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath: uri.fsPath })) {
            return;
        }
        if (basename.endsWith(".md")) {
            const note = await this._ext.wsUtils.getNoteFromDocument(editor.document);
            if (note) {
                await this.refresh(note);
            }
        }
    }
}
exports.NoteGraphPanelFactory = NoteGraphPanelFactory;
//# sourceMappingURL=NoteGraphViewFactory.js.map