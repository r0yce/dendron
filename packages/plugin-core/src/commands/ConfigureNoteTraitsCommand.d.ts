import { BasicCommand } from "./base";
type CommandOpts = {
    traitId: string;
};
type CommandOutput = {} | undefined;
/**
 * Command for a user to register a new note type with custom functionality
 */
export declare class ConfigureNoteTraitsCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private readonly createNewOption;
    gatherInputs(): Promise<{
        traitId: string;
    } | undefined>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
export {};
