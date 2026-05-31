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
exports.default = setupRecentWorkspacesTreeView;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const InstrumentedWrapperCommand_1 = require("../commands/InstrumentedWrapperCommand");
/**
 * Data provider for the Recent Workspaces Tree View
 */
class RecentWorkspacesTreeDataProvider {
    getTreeItem(element) {
        const commandArgs = {
            command: {
                title: "Open Workspace",
                command: "vscode.openFolder",
                arguments: [vscode_1.Uri.file(element.fsPath)],
            },
            event: common_all_1.VSCodeEvents.RecentWorkspacesPanelUsed,
        };
        return {
            label: element.fsPath,
            collapsibleState: vscode_1.TreeItemCollapsibleState.None,
            tooltip: "Click to open the workspace",
            command: InstrumentedWrapperCommand_1.InstrumentedWrapperCommand.createVSCodeCommand(commandArgs),
        };
    }
    getChildren(element) {
        switch (element) {
            case undefined:
                return engine_server_1.MetadataService.instance().RecentWorkspaces?.map((workspacePath) => {
                    return {
                        fsPath: workspacePath,
                    };
                });
            default:
                return [];
        }
    }
}
/**
 * Creates a tree view for the 'Recent Workspaces' panel in the Dendron Custom
 * View Container
 * @returns
 */
function setupRecentWorkspacesTreeView() {
    const treeView = vscode.window.createTreeView(common_all_1.DendronTreeViewKey.RECENT_WORKSPACES, {
        treeDataProvider: new RecentWorkspacesTreeDataProvider(),
    });
    return treeView;
}
//# sourceMappingURL=RecentWorkspacesTreeview.js.map