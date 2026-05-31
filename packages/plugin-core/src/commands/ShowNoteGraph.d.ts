import * as vscode from "vscode";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = void;
export declare class ShowNoteGraphCommand extends BasicCommand<CommandOpts, CommandOutput> {
    static requireActiveWorkspace: boolean;
    key: string;
    private _panel;
    constructor(panel: vscode.WebviewPanel);
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
