import { InsertNoteLinkAliasMode, NoteProps } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
type CommandInput = {
    multiSelect?: boolean;
    aliasMode?: InsertNoteLinkAliasMode;
};
type CommandOpts = {
    notes: readonly NoteProps[];
} & CommandInput;
type CommandOutput = CommandOpts;
export declare class InsertNoteLinkCommand extends BasicCommand<CommandOpts, CommandOutput, CommandInput> {
    key: string;
    gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined>;
    promptForAlias(note: NoteProps): Promise<string | undefined>;
    execute(opts: CommandOpts): Promise<CommandOpts>;
}
export {};
