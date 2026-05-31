import { SEED_REGISTRY } from "@dendronhq/common-all";
import { SeedSvcResp } from "@dendronhq/engine-server";
import { SeedCommandBase } from "./SeedCommandBase";
type CommandOpts = {
    seedId: Extract<keyof typeof SEED_REGISTRY, string>;
};
type CommandInput = {
    seedId: Extract<keyof typeof SEED_REGISTRY, string>;
};
type CommandOutput = SeedSvcResp;
export declare class SeedRemoveCommand extends SeedCommandBase<CommandOpts, CommandOutput> {
    key: string;
    private readonly NO_SEEDS_MSG;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(_opts: CommandOpts): Promise<CommandOutput>;
}
export {};
