import { IDendronError } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
type CommandOpts = {
    hookName: string;
    hookFilter: string;
};
type CommandOutput = {
    error: IDendronError;
} | void;
export declare class CreateHookCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<{
        hookName: string;
        hookFilter: string;
    } | undefined>;
    execute({ hookName, hookFilter }: CommandOpts): Promise<{
        error: import("@dendronhq/common-all").DendronErrorProps<import("@dendronhq/common-all").StatusCodes | undefined>;
    } | undefined>;
}
export {};
