import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandInput = {};
type CommandOutput = void;
/**
 * Command to be used for development purposes only.
 *
 * Main use case: place some piece of code to test its behavior and be able
 * to easily trigger to run that piece of code.
 * */
export declare class DevTriggerCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(): Promise<void>;
}
export {};
