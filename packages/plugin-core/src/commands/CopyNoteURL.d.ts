import { Selection } from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = string | undefined;
export declare class CopyNoteURLCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    gatherInputs(): Promise<any>;
    showFeedback(link: string): Promise<void>;
    isHeader(text: string, selection: Selection): boolean;
    execute(): Promise<string | undefined>;
}
export {};
