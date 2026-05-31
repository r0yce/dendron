import { IDendronError } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
type CommandOpts = {
    hookName: string;
    shouldDeleteScript: boolean;
};
type CommandOutput = {
    error: IDendronError;
} | void;
export declare class DeleteHookCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<{
        hookName: string;
        shouldDeleteScript: boolean;
    } | undefined>;
    execute({ hookName, shouldDeleteScript }: CommandOpts): Promise<void>;
}
export {};
