import * as vscode from "vscode";
/**
 * This function prepares a TSyringe container suitable for the Web Extension
 * flavor of the Dendron Plugin.
 *
 * It uses a VSCodeFileStore and includes a reduced engine that runs in-memory.
 */
export declare function setupWebExtContainer(context: vscode.ExtensionContext): Promise<void>;
