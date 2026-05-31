import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = void;
export declare class ConfigureGraphStylesCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
