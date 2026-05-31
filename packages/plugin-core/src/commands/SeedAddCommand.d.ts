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
export declare class SeedAddCommand extends SeedCommandBase<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(_opts: CommandOpts): Promise<CommandOutput>;
}
export {};
