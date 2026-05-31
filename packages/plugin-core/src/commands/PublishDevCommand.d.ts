import { BasicCommand } from "./base";
type CommandOutput = {};
export declare class PublishDevCommand extends BasicCommand<CommandOutput> {
    key: string;
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
