import { SeedService, SyncActionResult } from "@dendronhq/engine-server";
import { BasicCommand } from "./base";
export declare const UPDATE_SEED_CONFIG_PROMPT = "Update configuration";
/** If the configuration for a seed vault has changed, prompt to suggest updating the configuration. */
export declare function detectOutOfDateSeeds({ wsRoot, seedSvc, }: {
    wsRoot: string;
    seedSvc: SeedService;
}): Promise<void>;
type CommandOpts = {};
type CommandReturns = {
    committed: SyncActionResult[];
    pulled: SyncActionResult[];
    pushed: SyncActionResult[];
} | undefined;
export declare class SyncCommand extends BasicCommand<CommandOpts, CommandReturns> {
    key: string;
    private static generateReportMessage;
    addAnalyticsPayload(_opts: CommandOpts, resp: CommandReturns): {
        hasMultiVaultRepo: boolean;
    };
    execute(opts?: CommandOpts): Promise<{
        committed: SyncActionResult[];
        pulled: SyncActionResult[];
        pushed: SyncActionResult[];
        finalMessage: string;
    }>;
}
export {};
