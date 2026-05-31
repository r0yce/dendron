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
exports.activate = activate;
exports.deactivate = deactivate;
require("reflect-metadata"); // This needs to be the topmost import for tsyringe to work
const common_all_1 = require("@dendronhq/common-all");
const inject_1 = require("../di/inject");
const vscode = __importStar(require("vscode"));
const NoteLookupAutoCompleteCommand_1 = require("../commands/common/NoteLookupAutoCompleteCommand");
const constants_1 = require("../constants");
const NativeTreeView_1 = require("../views/common/treeview/NativeTreeView");
const CopyNoteURLCmd_1 = require("./commands/CopyNoteURLCmd");
const NoteLookupCmd_1 = require("./commands/NoteLookupCmd");
const TogglePreviewCmd_1 = require("./commands/TogglePreviewCmd");
const setupWebExtContainer_1 = require("./injection-providers/setupWebExtContainer");
/**
 * This is the entry point for the web extension variant of Dendron
 * @param context
 */
async function activate(context) {
    try {
        // Use the web extension injection container:
        await (0, setupWebExtContainer_1.setupWebExtContainer)(context);
        setupCommands(context);
        setupViews(context);
        reportActivationTelemetry();
    }
    catch (error) {
        // TODO: properly detect if we're in a Dendron workspace or not (instead of
        // relying on getWSRoot throwing).
        vscode.window.showErrorMessage(`Something went wrong during initialization.`);
    }
    vscode.commands.executeCommand("setContext", "dendron:pluginActive", true);
    vscode.window.showInformationMessage("Dendron is active");
}
function deactivate() { }
async function setupCommands(context) {
    const existingCommands = await vscode.commands.getCommands();
    const noteLookupCmd = inject_1.container.resolve(NoteLookupCmd_1.NoteLookupCmd);
    const key = constants_1.DENDRON_COMMANDS.LOOKUP_NOTE.key;
    if (!existingCommands.includes(key))
        context.subscriptions.push(vscode.commands.registerCommand(key, async (_args) => {
            await noteLookupCmd.run();
        }));
    const noteLookupAutoCompleteCommand = inject_1.container.resolve(NoteLookupAutoCompleteCommand_1.NoteLookupAutoCompleteCommand);
    const noteLookupAutoCompleteCommandKey = constants_1.DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;
    if (!existingCommands.includes(noteLookupAutoCompleteCommandKey))
        context.subscriptions.push(vscode.commands.registerCommand(noteLookupAutoCompleteCommandKey, () => {
            noteLookupAutoCompleteCommand.run();
        }));
    const togglePreviewCmd = inject_1.container.resolve(TogglePreviewCmd_1.TogglePreviewCmd);
    const togglePreviewCmdKey = constants_1.DENDRON_COMMANDS.TOGGLE_PREVIEW.key;
    if (!existingCommands.includes(togglePreviewCmdKey))
        context.subscriptions.push(vscode.commands.registerCommand(togglePreviewCmdKey, async (_args) => {
            await togglePreviewCmd.run();
        }));
    if (!existingCommands.includes(CopyNoteURLCmd_1.CopyNoteURLCmd.key)) {
        context.subscriptions.push(vscode.commands.registerCommand(CopyNoteURLCmd_1.CopyNoteURLCmd.key, async (_args) => {
            await inject_1.container.resolve(CopyNoteURLCmd_1.CopyNoteURLCmd).run();
        }));
    }
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key)) {
        context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key, async (_args) => {
            await inject_1.container.resolve(NoteLookupCmd_1.NoteLookupCmd).run();
        }));
    }
    /**
     * go to note is not yet supported in dendron-web.
     * for now, we open lookup bar when user clicks on the view action(+) for stubs
     */
    if (!existingCommands.includes(constants_1.DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key)) {
        context.subscriptions.push(vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key, async (_args) => {
            await inject_1.container.resolve(NoteLookupCmd_1.NoteLookupCmd).run();
        }));
    }
}
async function setupViews(context) {
    await setupTreeView(context);
}
async function setupTreeView(context) {
    const treeView = inject_1.container.resolve(NativeTreeView_1.NativeTreeView);
    treeView.show();
    context.subscriptions.push(treeView);
    vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_LABEL_BY_TITLE.key, () => {
        treeView.updateLabelType({
            labelType: common_all_1.TreeViewItemLabelTypeEnum.title,
        });
    });
    vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_LABEL_BY_FILENAME.key, () => {
        treeView.updateLabelType({
            labelType: common_all_1.TreeViewItemLabelTypeEnum.filename,
        });
    });
    vscode.commands.registerCommand(constants_1.DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key, async (id) => {
        await treeView.expandTreeItem(id);
    });
}
async function reportActivationTelemetry() {
    const telemetryClient = inject_1.container.resolve("ITelemetryClient");
    await telemetryClient.identify();
    // TODO: Add workspace properties later.
    await telemetryClient.track(common_all_1.VSCodeEvents.InitializeWorkspace);
}
//# sourceMappingURL=extension.js.map