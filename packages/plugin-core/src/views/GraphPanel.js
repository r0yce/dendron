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
exports.GraphPanel = void 0;
const common_all_1 = require("@dendronhq/common-all");
const dev_1 = require("../utils/dev");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const GotoNote_1 = require("../commands/GotoNote");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const styles_1 = require("../styles");
const analytics_1 = require("../utils/analytics");
const vsCodeUtils_1 = require("../vsCodeUtils");
const utils_1 = require("./utils");
class GraphPanel {
    static viewType = common_all_1.DendronTreeViewKey.GRAPH_PANEL;
    _view;
    _ext;
    _graphDepth;
    _showBacklinks;
    _showOutwardLinks;
    _showHierarchy;
    constructor(extension) {
        this._ext = extension;
        this._ext.context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this));
        // Set default
        this.showBacklinks =
            engine_server_1.MetadataService.instance().graphPanelShowBacklinks ?? true;
        this.showOutwardLinks =
            engine_server_1.MetadataService.instance().graphPanelShowOutwardLinks ?? true;
        this.showHierarchy =
            engine_server_1.MetadataService.instance().graphPanelShowHierarchy ?? true;
        this.graphDepth = engine_server_1.MetadataService.instance().graphDepth || 1;
    }
    get graphDepth() {
        return this._graphDepth;
    }
    set graphDepth(depth) {
        if (depth) {
            this._graphDepth = depth;
            this.postMessage({
                type: common_all_1.GraphViewMessageEnum.onGraphDepthChange,
                data: {
                    graphDepth: this._graphDepth,
                },
                source: common_all_1.DMessageSource.vscode,
            });
        }
    }
    get showBacklinks() {
        return this._showBacklinks;
    }
    set showBacklinks(displayBacklinks) {
        if (!lodash_1.default.isUndefined(displayBacklinks) &&
            this._showBacklinks !== displayBacklinks) {
            this._showBacklinks = displayBacklinks;
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.GRAPH_PANEL_SHOW_BACKLINKS, displayBacklinks);
            this.postMessage({
                type: common_all_1.GraphViewMessageEnum.toggleGraphEdges,
                data: {
                    showBacklinks: this._showBacklinks,
                },
                source: common_all_1.DMessageSource.vscode,
            });
            // Save the setting update into persistance storage:
            engine_server_1.MetadataService.instance().graphPanelShowBacklinks = displayBacklinks;
        }
    }
    get showOutwardLinks() {
        return this._showOutwardLinks;
    }
    set showOutwardLinks(displayOutwardLinks) {
        if (!lodash_1.default.isUndefined(displayOutwardLinks) &&
            this._showOutwardLinks !== displayOutwardLinks) {
            this._showOutwardLinks = displayOutwardLinks;
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.GRAPH_PANEL_SHOW_OUTWARD_LINKS, displayOutwardLinks);
            this.postMessage({
                type: common_all_1.GraphViewMessageEnum.toggleGraphEdges,
                data: {
                    showOutwardLinks: this._showOutwardLinks,
                },
                source: common_all_1.DMessageSource.vscode,
            });
            // Save the setting update into persistance storage:
            engine_server_1.MetadataService.instance().graphPanelShowOutwardLinks =
                displayOutwardLinks;
        }
    }
    get showHierarchy() {
        return this._showHierarchy;
    }
    set showHierarchy(displayHierarchy) {
        if (!lodash_1.default.isUndefined(displayHierarchy) &&
            this._showHierarchy !== displayHierarchy) {
            this._showHierarchy = displayHierarchy;
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.GRAPH_PANEL_SHOW_HIERARCHY, displayHierarchy);
            this.postMessage({
                type: common_all_1.GraphViewMessageEnum.toggleGraphEdges,
                data: {
                    showHierarchy: this._showHierarchy,
                },
                source: common_all_1.DMessageSource.vscode,
            });
            // Save the setting update into persistance storage:
            engine_server_1.MetadataService.instance().graphPanelShowHierarchy = displayHierarchy;
        }
    }
    postMessage(msg) {
        if (this._view)
            this._view.webview.postMessage(msg);
    }
    increaseGraphDepth() {
        if (this._view && this.graphDepth && this.graphDepth < 3) {
            this.graphDepth += 1;
        }
    }
    decreaseGraphDepth() {
        if (this.graphDepth && this.graphDepth > 1) {
            this.graphDepth -= 1;
        }
    }
    async resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        await utils_1.WebViewUtils.prepareTreeView({
            ext: this._ext,
            key: common_all_1.DendronTreeViewKey.GRAPH_PANEL,
            webviewView,
        });
        webviewView.webview.onDidReceiveMessage(this.onDidReceiveMessageHandler, this);
        webviewView.onDidChangeVisibility(() => {
            if (this.graphDepth && !webviewView.visible) {
                engine_server_1.MetadataService.instance().graphDepth = this.graphDepth;
                analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphPanelUsed, {
                    type: "DepthChanged",
                    state: this.graphDepth,
                });
            }
            analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphPanelUsed, {
                type: "VisibilityChanged",
                state: webviewView.visible ? "Visible" : "Collapsed",
            });
        });
    }
    async onDidReceiveMessageHandler(msg) {
        const ctx = "GraphPanel(side):onDidReceiveMessage";
        logger_1.Logger.info({ ctx, data: msg });
        const createStub = common_all_1.ConfigUtils.getWorkspace(this._ext.getDWorkspace().config).graph.createStub;
        switch (msg.type) {
            case common_all_1.GraphViewMessageEnum.onSelect: {
                const note = (await this._ext.getEngine().getNote(msg.data.id)).data;
                if (!note) {
                    logger_1.Logger.error({
                        ctx,
                        msg: `Note ${msg.data.id} not found in engine`,
                    });
                    break;
                }
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
                    });
                }
                analytics_1.AnalyticsUtils.track(common_all_1.GraphEvents.GraphPanelUsed, {
                    type: "NodeClicked",
                });
                break;
            }
            case common_all_1.GraphViewMessageEnum.onGetActiveEditor: {
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                this.onOpenTextDocument(editor);
                break;
            }
            case common_all_1.DMessageEnum.MESSAGE_DISPATCHER_READY: {
                // if ready, get current note
                const note = await this._ext.wsUtils.getActiveNote();
                if (note) {
                    logger_1.Logger.debug({
                        ctx,
                        msg: "got active note",
                        note: common_all_1.NoteUtils.toLogObj(note),
                    });
                }
                if (note) {
                    await this.refresh(note);
                }
                break;
            }
            case common_all_1.GraphViewMessageEnum.onRequestGraphOpts: {
                // Set graph styles
                const styles = styles_1.GraphStyleService.getParsedStyles();
                const graphTheme = engine_server_1.MetadataService.instance().getGraphTheme();
                this.graphDepth = engine_server_1.MetadataService.instance().graphDepth;
                if (this._view &&
                    (styles ||
                        graphTheme ||
                        this.graphDepth ||
                        this.showBacklinks ||
                        this.showOutwardLinks ||
                        this.showHierarchy)) {
                    this._view.webview.postMessage({
                        type: common_all_1.GraphViewMessageEnum.onGraphLoad,
                        data: {
                            styles,
                            graphTheme,
                            graphDepth: this.graphDepth,
                            showBacklinks: this.showBacklinks,
                            showOutwardLinks: this.showOutwardLinks,
                            showHierarchy: this.showHierarchy,
                        },
                        source: "vscode",
                    });
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
        const ctx = "GraphPanel(side):openTextDocument";
        const { wsRoot, vaults } = this._ext.getDWorkspace();
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
        const note = await this._ext.wsUtils.getNoteFromDocument(document);
        if (note) {
            logger_1.Logger.info({
                ctx,
                msg: "refresh note",
                note: common_all_1.NoteUtils.toLogObj(note),
            });
            await this.refresh(note);
        }
    }
    async refresh(note, createStub) {
        const perf = new common_all_1.PerformanceTimer({ timerName: "GraphRefresh" });
        perf.before("total");
        if (this._view) {
            if (note) {
                this._view.show?.(true);
            }
            this._view.webview.postMessage({
                type: common_all_1.DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
                data: {
                    note,
                    syncChangedNote: true,
                    activeNote: note?.stub && !createStub
                        ? note
                        : await this._ext.wsUtils.getActiveNote(),
                },
                source: "vscode",
            });
        }
        perf.after("total");
        const shouldLog = process.env.DENDRON_PERF === "1" || process.env.LOG_LEVEL === "debug";
        if (shouldLog) {
            (0, dev_1.logPerfReport)("Graph", perf.report());
        }
    }
}
exports.GraphPanel = GraphPanel;
//# sourceMappingURL=GraphPanel.js.map