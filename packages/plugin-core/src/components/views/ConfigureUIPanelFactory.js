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
exports.ConfigureUIPanelFactory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const vscode = __importStar(require("vscode"));
const ConfigureCommand_1 = require("../../commands/ConfigureCommand");
const utils_1 = require("../../views/utils");
class ConfigureUIPanelFactory {
    static panel = undefined;
    static create(ext) {
        if (!this.panel) {
            const { bundleName: name, label } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.CONFIGURE);
            this.panel = vscode.window.createWebviewPanel(name, // Identifies the type of the webview. Used internally
            label, // Title of the panel displayed to the user
            {
                viewColumn: vscode.ViewColumn.One,
                preserveFocus: true,
            }, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                enableCommandUris: true,
                enableFindWidget: false,
                localResourceRoots: utils_1.WebViewUtils.getLocalResourceRoots(ext.context),
            });
            this.panel.webview.onDidReceiveMessage(async (msg) => {
                // eslint-disable-next-line default-case
                switch (msg.type) {
                    case common_all_1.ConfigureUIMessageEnum.onUpdateConfig:
                        {
                            const { config } = msg.data;
                            await common_server_1.DConfig.writeConfig({
                                wsRoot: ext.getDWorkspace().wsRoot,
                                config,
                            });
                        }
                        break;
                    case common_all_1.ConfigureUIMessageEnum.openDendronConfigYaml: {
                        const openConfig = new ConfigureCommand_1.ConfigureCommand(ext);
                        openConfig.run();
                        break;
                    }
                    default:
                        return;
                }
            });
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }
        return this.panel;
    }
}
exports.ConfigureUIPanelFactory = ConfigureUIPanelFactory;
//# sourceMappingURL=ConfigureUIPanelFactory.js.map