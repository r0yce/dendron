import "reflect-metadata";
import * as vscode from "vscode";
export declare function activate(context: vscode.ExtensionContext): vscode.ExtensionContext;
export declare function _activate(context: vscode.ExtensionContext, opts?: Partial<{
    /**
     * Skip setting up language features (eg. code action providesr)
     */
    skipLanguageFeatures: boolean;
    /**
     * Skip automatic migrations on start
     */
    skipMigrations: boolean;
    /**
     * Skip surfacing dialogues on startup
     */
    skipInteractiveElements: boolean;
    /**
     * Skip showing tree view
     */
    skipTreeView: boolean;
}>): Promise<boolean>;
export declare function deactivate(): void;
