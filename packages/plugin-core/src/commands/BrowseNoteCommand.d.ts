import * as vscode from "vscode";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = vscode.Uri | undefined;
export declare class BrowseNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    sanityCheck(): Promise<"No document open" | undefined>;
    execute(_opts: CommandOpts): Promise<vscode.Uri | undefined>;
}
export {};
