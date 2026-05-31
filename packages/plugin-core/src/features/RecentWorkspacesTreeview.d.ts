import * as vscode from "vscode";
type DendronWorkspaceMenuItem = {
    fsPath: string;
};
/**
 * Creates a tree view for the 'Recent Workspaces' panel in the Dendron Custom
 * View Container
 * @returns
 */
export default function setupRecentWorkspacesTreeView(): vscode.TreeView<DendronWorkspaceMenuItem>;
export {};
