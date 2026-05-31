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
exports.GraphPanelTip = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
const vscode = __importStar(require("vscode"));
const common_all_1 = require("@dendronhq/common-all");
class GraphPanelTip {
    shouldShow(_displayLocation) {
        return true;
    }
    get showcaseEntry() {
        return engine_server_1.ShowcaseEntry.GraphPanel;
    }
    getDisplayMessage(_displayLocation) {
        return "We're experimenting with a note graph panel in the new Dendron sidebar. Check it out!";
    }
    onConfirm() {
        vscode.commands.executeCommand(`${common_all_1.DendronTreeViewKey.GRAPH_PANEL}.focus`);
    }
    get confirmText() {
        return "Show Graph Panel";
    }
    get deferText() {
        return "Later";
    }
}
exports.GraphPanelTip = GraphPanelTip;
//# sourceMappingURL=GraphPanelTip.js.map