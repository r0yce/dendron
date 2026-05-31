import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandInput = {};
type CommandOutput = void;
/**
 * Development command that shows all recorded performance reports from the current session
 * in the clean "Dendron Dev" output channel.
 */
export declare class DevShowAllPerfReports extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(): Promise<void>;
}
export {};
