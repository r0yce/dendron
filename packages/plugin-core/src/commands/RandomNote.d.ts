import { NotePropsMeta } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandInput = {};
type CommandOutput = NotePropsMeta | undefined;
export declare class RandomNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(_opts: CommandOpts): Promise<CommandOutput>;
}
export {};
