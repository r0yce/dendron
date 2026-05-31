import { DendronError } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandInput = {};
type CommandOutput = {
    error?: DendronError;
    fsPath?: string;
};
export declare class OpenLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(opts?: {
        uri?: string;
    }): Promise<{
        error: DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
        filepath?: never;
    } | {
        filepath: string;
        error?: never;
    }>;
}
export {};
