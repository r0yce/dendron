import { NotePropsMeta } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {
    marker?: boolean;
};
type CommandOutput = CommandOpts;
export declare class InsertNoteIndexCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    genNoteIndex(notes: NotePropsMeta[], opts: {
        marker?: boolean;
    }): string;
    execute(opts: CommandOpts): Promise<CommandOpts>;
}
export {};
