import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandInput = {};
type CommandOutput = void;
/**
 * Development command that shows the last activation performance report
 * in a clean, readable format.
 */
export declare class DevShowActivationReport extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(): Promise<void>;
}
export {};
