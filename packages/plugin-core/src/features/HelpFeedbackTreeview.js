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
exports.default = setupHelpFeedbackTreeView;
const common_all_1 = require("@dendronhq/common-all");
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const InstrumentedWrapperCommand_1 = require("../commands/InstrumentedWrapperCommand");
var MenuItem;
(function (MenuItem) {
    MenuItem["getStarted"] = "Get Started";
    MenuItem["readDocs"] = "Read Documentation";
    MenuItem["seeFaq"] = "See FAQ";
    MenuItem["reviewIssues"] = "Review Issues";
    MenuItem["reportIssue"] = "Report Issue";
    MenuItem["joinCommunity"] = "Join our Community!";
    MenuItem["followUs"] = "Follow our Progress";
})(MenuItem || (MenuItem = {}));
class HelpFeedbackTreeDataProvider {
    ALL_ITEMS = Object.values(MenuItem);
    onDidChangeTreeData;
    getTreeItem(element) {
        let iconPath;
        let url = "";
        switch (element) {
            case MenuItem.getStarted:
                iconPath = new vscode_1.ThemeIcon("star");
                url =
                    "https://wiki.dendron.so/notes/678c77d9-ef2c-4537-97b5-64556d6337f1/";
                break;
            case MenuItem.readDocs:
                iconPath = new vscode_1.ThemeIcon("book");
                url = "https://wiki.dendron.so/notes/FWtrGfE4YJc3j0yMNjBn5/";
                break;
            case MenuItem.seeFaq:
                iconPath = new vscode_1.ThemeIcon("question");
                url =
                    "https://wiki.dendron.so/notes/683740e3-70ce-4a47-a1f4-1f140e80b558/";
                break;
            case MenuItem.reviewIssues:
                iconPath = new vscode_1.ThemeIcon("issues");
                url = "https://github.com/dendronhq/dendron/issues";
                break;
            case MenuItem.reportIssue:
                iconPath = new vscode_1.ThemeIcon("comment");
                url = "https://github.com/dendronhq/dendron/issues/new/choose";
                break;
            case MenuItem.joinCommunity:
                iconPath = new vscode_1.ThemeIcon("organization");
                url = "https://discord.com/invite/xrKTUStHNZ";
                break;
            case MenuItem.followUs:
                iconPath = new vscode_1.ThemeIcon("twitter");
                url = "https://twitter.com/dendronhq";
                break;
            default:
                (0, common_all_1.assertUnreachable)(element);
        }
        const command = InstrumentedWrapperCommand_1.InstrumentedWrapperCommand.createVSCodeCommand({
            command: {
                title: "Help and Feedback",
                command: "vscode.open",
                arguments: [url],
            },
            event: common_all_1.VSCodeEvents.HelpAndFeedbackItemClicked,
            customProps: {
                menuItem: element,
            },
        });
        return {
            label: element.toString(),
            collapsibleState: vscode_1.TreeItemCollapsibleState.None,
            iconPath,
            command,
        };
    }
    getChildren(element) {
        switch (element) {
            case undefined:
                return this.ALL_ITEMS;
            default:
                return [];
        }
    }
}
/**
 * Creates a tree view for the basic 'Help and Feedback' panel in the Dendron
 * Custom View Container
 * @returns
 */
function setupHelpFeedbackTreeView() {
    return vscode.window.createTreeView(common_all_1.DendronTreeViewKey.HELP_AND_FEEDBACK, {
        treeDataProvider: new HelpFeedbackTreeDataProvider(),
    });
}
//# sourceMappingURL=HelpFeedbackTreeview.js.map