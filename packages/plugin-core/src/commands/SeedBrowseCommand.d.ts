import { SeedService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { SeedCommandBase } from "./SeedCommandBase";
type CommandOpts = {};
type CommandOutput = void;
export declare class WebViewPanelFactory {
    private static panel;
    static create(svc: SeedService): vscode.WebviewPanel;
}
export declare class SeedBrowseCommand extends SeedCommandBase<CommandOpts, CommandOutput> {
    _panel: vscode.WebviewPanel;
    constructor(panel: vscode.WebviewPanel);
    key: string;
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
