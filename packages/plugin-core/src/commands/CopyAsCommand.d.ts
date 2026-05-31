import { CopyAsFormat } from "@dendronhq/pods-core";
import { BasicCommand, CodeCommandInstance } from "./base";
type CommandOutput = void;
type CommandOpts = CodeCommandInstance;
/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
export declare class CopyAsCommand extends BasicCommand<CommandOpts, CommandOutput, CopyAsFormat> {
    format: CopyAsFormat[];
    key: string;
    constructor(_name?: string);
    sanityCheck(): Promise<"you must have a note open to execute this command" | undefined>;
    gatherInputs(copyAsFormat?: CopyAsFormat): Promise<CodeCommandInstance | undefined>;
    execute(opts: CommandOpts): Promise<void>;
}
export {};
