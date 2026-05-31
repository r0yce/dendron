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
exports.SchemaGraphViewFactory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const logger_1 = require("../../logger");
const analytics_1 = require("../../utils/analytics");
const utils_1 = require("../../views/utils");
const vsCodeUtils_1 = require("../../vsCodeUtils");
class SchemaGraphViewFactory {
    static _panel = undefined;
    static _vsCodeCallback = undefined;
    //TODO: Limit scope of parameter from DendronExtension to only what's needed
    static create(ext) {
        if (this._panel) {
            return this._panel;
        }
        const { bundleName: name, label } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.SCHEMA_GRAPH);
        this._panel = vscode_1.window.createWebviewPanel(name, // Identifies the type of the webview. Used internally
        label, // Title of the panel displayed to the user
        {
            viewColumn: vscode_1.ViewColumn.Beside,
            preserveFocus: true,
        }, // Editor column to show the new webview panel in.
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            enableFindWidget: true,
            localResourceRoots: utils_1.WebViewUtils.getLocalResourceRoots(ext.context),
        });
        // Listener
        this._panel.webview.onDidReceiveMessage(async (msg) => {
            const ctx = "ShowSchemaGraph:onDidReceiveMessage";
            logger_1.Logger.debug({ ctx, msgType: msg.type });
            switch (msg.type) {
                case common_all_1.GraphViewMessageEnum.onSelect: {
                    const engine = ext.getEngine();
                    const schema = (await engine.getSchema(msg.data.id)).data;
                    const wsRoot = ext.getEngine().wsRoot;
                    await vscode.commands.executeCommand("workbench.action.focusFirstEditorGroup");
                    if (msg.data.vault && wsRoot) {
                        const vaults = engine.vaults.filter((v) => common_all_1.VaultUtils.getName(v) === msg.data.vault);
                        if (lodash_1.default.isEmpty(vaults))
                            return;
                        const schemaPath = path_1.default.join(wsRoot, vaults[0].fsPath, `root.schema.yml`);
                        const uri = vscode_1.Uri.file(schemaPath);
                        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
                    }
                    else if (schema && wsRoot) {
                        const fname = schema.fname;
                        // const vault = schema.vault;
                        const schemaPath = path_1.default.join(wsRoot, schema.vault.fsPath, `${fname}.schema.yml`);
                        const uri = vscode_1.Uri.file(schemaPath);
                        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
                    }
                    break;
                }
                // not handled
                case common_all_1.GraphViewMessageEnum.onGraphLoad: {
                    break;
                }
                // TODO: these should be handled
                default:
                    logger_1.Logger.info({
                        ctx,
                        msg: "Unexpected message type from SchemaGraph Webview: " +
                            JSON.stringify(msg),
                    });
                    break;
            }
        });
        this._vsCodeCallback = vscode.window.onDidChangeActiveTextEditor((0, analytics_1.sentryReportingCallback)(async (editor) => {
            if (SchemaGraphViewFactory._panel &&
                SchemaGraphViewFactory._panel.visible) {
                if (!editor) {
                    return;
                }
                const note = await ext.wsUtils.getNoteFromDocument(editor.document);
                SchemaGraphViewFactory._panel.webview.postMessage({
                    type: common_all_1.DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
                    data: {
                        note,
                        sync: true,
                    },
                    source: "vscode",
                });
            }
        }));
        ext.addDisposable(this._vsCodeCallback);
        this._panel.onDidDispose(() => {
            this._panel = undefined;
            if (this._vsCodeCallback) {
                this._vsCodeCallback.dispose();
                this._vsCodeCallback = undefined;
            }
        });
        return this._panel;
    }
}
exports.SchemaGraphViewFactory = SchemaGraphViewFactory;
//# sourceMappingURL=SchemaGraphViewFactory.js.map