import { SyncActionResult } from "@dendronhq/engine-server";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandReturns = {
    finalMessage: string;
    committed: SyncActionResult[];
} | undefined;
export declare class AddAndCommit extends BasicCommand<CommandOpts, CommandReturns> {
    key: string;
    private static generateReportMessage;
    execute(opts?: CommandOpts): Promise<{
        committed: SyncActionResult[];
        finalMessage: string;
    }>;
}
export {};
