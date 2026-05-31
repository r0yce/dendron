import * as vscode from "vscode";
import { Logger } from "./logger";
import { DWorkspace } from "./workspacev2";
export declare function activate(context: vscode.ExtensionContext): {
    DWorkspace: typeof DWorkspace;
    Logger: typeof Logger;
};
export declare function deactivate(): void;
