import { NotePropsMeta } from "@dendronhq/common-all";
import { Selection, TextEditor } from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = string;
export declare class CopyNoteRefCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    sanityCheck(): Promise<"No document open" | undefined>;
    showFeedback(link: string): Promise<void>;
    hasNextHeader(opts: {
        selection: Selection;
    }): boolean;
    buildLink(opts: {
        note: NotePropsMeta;
        useVaultPrefix?: boolean;
        editor: TextEditor;
    }): Promise<string>;
    execute(_opts: CommandOpts): Promise<string>;
}
export {};
