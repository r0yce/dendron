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
exports.SeedBrowseCommand = exports.WebViewPanelFactory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const utils_1 = require("../views/utils");
const SeedAddCommand_1 = require("./SeedAddCommand");
const SeedCommandBase_1 = require("./SeedCommandBase");
class WebViewPanelFactory {
    static panel = undefined;
    static create(svc) {
        if (!this.panel) {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const { bundleName: name, label } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.SEED_BROWSER);
            this.panel = vscode.window.createWebviewPanel(name, label, {
                viewColumn: vscode_1.ViewColumn.Active,
                preserveFocus: false,
            }, {
                enableScripts: true,
                retainContextWhenHidden: true,
                enableFindWidget: true,
                localResourceRoots: utils_1.WebViewUtils.getLocalResourceRoots(ext.context).concat(vscode.Uri.file(ext.getDWorkspace().wsRoot)),
            });
            this.panel.webview.onDidReceiveMessage(async (msg) => {
                switch (msg.type) {
                    case common_all_1.SeedBrowserMessageType.onSeedAdd: {
                        const cmd = new SeedAddCommand_1.SeedAddCommand();
                        const resp = await cmd.execute({ seedId: msg.data.data });
                        // Error should already be logged within SeedAddCommand()
                        if (!resp.error) {
                            this.panel?.webview.postMessage({
                                type: common_all_1.SeedBrowserMessageType.onSeedStateChange,
                                data: {
                                    msg: svc.getSeedsInWorkspace(),
                                },
                                source: "vscode",
                            });
                        }
                        break;
                    }
                    case common_all_1.SeedBrowserMessageType.onOpenUrl: {
                        vscode.env.openExternal(vscode.Uri.parse(msg.data.data));
                        break;
                    }
                    case common_all_1.DMessageEnum.MESSAGE_DISPATCHER_READY: {
                        this.panel?.webview.postMessage({
                            type: common_all_1.SeedBrowserMessageType.onSeedStateChange,
                            data: {
                                msg: svc.getSeedsInWorkspace(),
                            },
                            source: "vscode",
                        });
                        break;
                    }
                    default:
                        break;
                }
            });
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }
        return this.panel;
    }
}
exports.WebViewPanelFactory = WebViewPanelFactory;
class SeedBrowseCommand extends SeedCommandBase_1.SeedCommandBase {
    _panel;
    constructor(panel) {
        super();
        this._panel = panel;
    }
    key = constants_1.DENDRON_COMMANDS.SEED_BROWSE.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        const { bundleName: name } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.SEED_BROWSER);
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const port = ext.port;
        const engine = ext.getEngine();
        const { wsRoot } = engine;
        const webViewAssets = utils_1.WebViewUtils.getJsAndCss();
        const html = await utils_1.WebViewUtils.getWebviewContent({
            ...webViewAssets,
            port,
            wsRoot,
            panel: this._panel,
            name,
        });
        this._panel.webview.html = html;
        this._panel.reveal();
    }
}
exports.SeedBrowseCommand = SeedBrowseCommand;
//# sourceMappingURL=SeedBrowseCommand.js.map