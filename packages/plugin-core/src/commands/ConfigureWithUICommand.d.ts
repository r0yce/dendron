import * as vscode from "vscode";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = void;
export declare class ConfigureWithUICommand extends BasicCommand<CommandOpts, CommandOutput> {
    static requireActiveWorkspace: boolean;
    private _panel;
    key: string;
    constructor(panel: vscode.WebviewPanel);
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
