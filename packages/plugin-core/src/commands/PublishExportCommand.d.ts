import { BasicCommand } from "./base";
type CommandOpts = void;
type CommandOutput = {
    nextPath: string;
};
export declare class PublishExportCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<any>;
    execute(): Promise<{
        nextPath: string;
    }>;
    showResponse(opts: CommandOutput): Promise<void>;
}
export {};
