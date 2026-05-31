import vscode from "vscode";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = void;
export declare class ShowSchemaGraphCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    _panel: vscode.WebviewPanel;
    constructor(panel: vscode.WebviewPanel);
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
