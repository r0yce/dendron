import { NoteTrait } from "@dendronhq/common-all";
import { BaseCommand } from "./base";
type CommandOpts = {
    trait: NoteTrait;
};
type CommandInput = {
    trait: NoteTrait;
};
/**
 * Command that can create a new noted with the specified user-defined custom
 * note traits. This will find the registered {@link CreateNoteWithTraitCommand}
 * command corresponding to the passed in type and execute it, if the command
 * exists.
 */
export declare class CreateNoteWithUserDefinedTrait extends BaseCommand<CommandOpts, CommandOpts, CommandInput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    enrichInputs(inputs: CommandInput): Promise<CommandInput>;
    execute(opts: CommandOpts): Promise<CommandOpts>;
}
export {};
