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
exports.LookupPanelView = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const types_1 = require("../components/lookup/types");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const utils_1 = require("./utils");
/**
 * A view that handles the UI state for the Lookup Panel (the webview on a VS
 * Code side panel). This instantiates and then communicates with the React
 * based webview (the true _view_). This class is essentially a proxy for
 * plugin-core to the webview.
 */
class LookupPanelView {
    _view;
    _viewModel;
    _disposables = [];
    constructor(viewModel) {
        this._viewModel = viewModel;
        this.bindToViewModel();
        this._disposables.push(vscode.window.registerWebviewViewProvider(common_all_1.DendronTreeViewKey.LOOKUP_VIEW, this));
        vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.SHOULD_SHOW_LOOKUP_VIEW, true);
    }
    dispose() {
        vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.SHOULD_SHOW_LOOKUP_VIEW, false);
        this._disposables.forEach((value) => value.dispose());
    }
    bindToViewModel() {
        // Only these options are currently visible in the Lookup View Side Panel
        this._disposables.push(this._viewModel.selectionState.bind(this.refresh, this));
        this._disposables.push(this._viewModel.isApplyDirectChildFilter.bind(this.refresh, this));
        this._disposables.push(this._viewModel.isMultiSelectEnabled.bind(this.refresh, this));
        this._disposables.push(this._viewModel.isCopyNoteLinkEnabled.bind(this.refresh, this));
        this._disposables.push(this._viewModel.isSplitHorizontally.bind(this.refresh, this));
    }
    postMessage(msg) {
        this._view?.webview.postMessage(msg);
    }
    async resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.onDidReceiveMessage(this.onDidReceiveMessageHandler, this);
        utils_1.WebViewUtils.prepareTreeView({
            ext: ExtensionProvider_1.ExtensionProvider.getExtension(),
            key: common_all_1.DendronTreeViewKey.LOOKUP_VIEW,
            webviewView,
        });
        // Send the initial state to the view:
        this.refresh();
        // Set preserveFocus to true - otherwise, this will remove focus from the
        // lookup quickpick, and the user will not be able to type immediately upon
        // calling lookup:
        this._view?.show(true);
    }
    async onDidReceiveMessageHandler(msg) {
        const ctx = "onDidReceiveMessage";
        logger_1.Logger.info({ ctx, data: msg });
        switch (msg.type) {
            case common_all_1.LookupViewMessageEnum.onValuesChange: {
                logger_1.Logger.info({
                    ctx: `${ctx}:onValuesChange`,
                    data: msg.data,
                });
                const { category, type } = msg.data;
                switch (category) {
                    case "effect": {
                        // in this case, type is an array of the selected effects
                        this._viewModel.isMultiSelectEnabled.value = lodash_1.default.includes(type, "multiSelect");
                        this._viewModel.isCopyNoteLinkEnabled.value = lodash_1.default.includes(type, "copyNoteLink");
                        break;
                    }
                    case "selection": {
                        switch (type) {
                            case common_all_1.LookupSelectionTypeEnum.selection2Items:
                                this._viewModel.selectionState.value =
                                    common_all_1.LookupSelectionTypeEnum.selection2Items;
                                break;
                            case common_all_1.LookupSelectionTypeEnum.selection2link:
                                this._viewModel.selectionState.value =
                                    common_all_1.LookupSelectionTypeEnum.selection2link;
                                break;
                            case common_all_1.LookupSelectionTypeEnum.selectionExtract:
                                this._viewModel.selectionState.value =
                                    common_all_1.LookupSelectionTypeEnum.selectionExtract;
                                break;
                            // "None" comes back as undefined for the type:
                            default:
                                this._viewModel.selectionState.value =
                                    common_all_1.LookupSelectionTypeEnum.none;
                        }
                        break;
                    }
                    default: {
                        switch (type) {
                            case "other": {
                                this._viewModel.vaultSelectionMode.value =
                                    this._viewModel.vaultSelectionMode.value ===
                                        types_1.VaultSelectionMode.alwaysPrompt
                                        ? types_1.VaultSelectionMode.smart
                                        : types_1.VaultSelectionMode.alwaysPrompt;
                                break;
                            }
                            case "multiSelect": {
                                this._viewModel.isMultiSelectEnabled.value =
                                    !this._viewModel.isMultiSelectEnabled.value;
                                break;
                            }
                            case "copyNoteLink": {
                                this._viewModel.isCopyNoteLinkEnabled.value =
                                    !this._viewModel.isCopyNoteLinkEnabled.value;
                                break;
                            }
                            case "directChildOnly": {
                                this._viewModel.isApplyDirectChildFilter.value =
                                    !this._viewModel.isApplyDirectChildFilter.value;
                                break;
                            }
                            case common_all_1.LookupNoteTypeEnum.journal: {
                                this._viewModel.nameModifierMode.value =
                                    this._viewModel.nameModifierMode.value ===
                                        common_all_1.LookupNoteTypeEnum.journal
                                        ? common_all_1.LookupNoteTypeEnum.none
                                        : common_all_1.LookupNoteTypeEnum.journal;
                                break;
                            }
                            case common_all_1.LookupNoteTypeEnum.scratch: {
                                this._viewModel.nameModifierMode.value =
                                    this._viewModel.nameModifierMode.value ===
                                        common_all_1.LookupNoteTypeEnum.scratch
                                        ? common_all_1.LookupNoteTypeEnum.none
                                        : common_all_1.LookupNoteTypeEnum.scratch;
                                break;
                            }
                            case common_all_1.LookupNoteTypeEnum.task: {
                                this._viewModel.nameModifierMode.value =
                                    this._viewModel.nameModifierMode.value ===
                                        common_all_1.LookupNoteTypeEnum.task
                                        ? common_all_1.LookupNoteTypeEnum.none
                                        : common_all_1.LookupNoteTypeEnum.task;
                                break;
                            }
                            case "horizontal": {
                                this._viewModel.isSplitHorizontally.value =
                                    !this._viewModel.isSplitHorizontally.value;
                                break;
                            }
                            default:
                                throw new Error(`Message Handler for Type ${type} Not Implemented`);
                        }
                    }
                }
                break;
            }
            case common_all_1.LookupViewMessageEnum.onRequestControllerState:
            case common_all_1.LookupViewMessageEnum.onUpdate:
            default:
                break;
        }
    }
    refresh() {
        const payload = [
            {
                type: "selection2link",
                pressed: this._viewModel.selectionState.value ===
                    common_all_1.LookupSelectionTypeEnum.selection2link,
            },
            {
                type: "selectionExtract",
                pressed: this._viewModel.selectionState.value ===
                    common_all_1.LookupSelectionTypeEnum.selectionExtract,
            },
            {
                type: "selection2Items",
                pressed: this._viewModel.selectionState.value ===
                    common_all_1.LookupSelectionTypeEnum.selection2Items,
            },
            {
                type: "directChildOnly",
                pressed: this._viewModel.isApplyDirectChildFilter.value,
            },
            {
                type: "multiSelect",
                pressed: this._viewModel.isMultiSelectEnabled.value,
            },
            {
                type: "copyNoteLink",
                pressed: this._viewModel.isCopyNoteLinkEnabled.value,
            },
            {
                type: "horizontal",
                pressed: this._viewModel.isSplitHorizontally.value,
            },
        ];
        if (this._view) {
            this._view.webview.postMessage({
                type: common_all_1.LookupViewMessageEnum.onUpdate,
                data: { payload },
                source: "vscode",
            });
        }
    }
}
exports.LookupPanelView = LookupPanelView;
//# sourceMappingURL=LookupPanelView.js.map