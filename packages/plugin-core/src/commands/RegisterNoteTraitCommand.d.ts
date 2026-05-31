import { BasicCommand } from "./base";
type CommandOpts = {
    traitId: string;
};
type CommandOutput = {} | undefined;
/**
 * Command for a user to register a new note type with custom functionality.
 * This command is not directly exposed via the command palette, for the user
 * facing command see ConfigureNoteTraitsCommand
 */
export declare class RegisterNoteTraitCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<{
        traitId: string;
    } | undefined>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
export {};
