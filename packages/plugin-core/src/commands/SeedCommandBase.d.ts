import { SeedService } from "@dendronhq/engine-server";
import { BasicCommand } from "./base";
export declare abstract class SeedCommandBase<CommandOpts, CommandOutput> extends BasicCommand<CommandOpts, CommandOutput> {
    protected seedSvc: SeedService | undefined;
    constructor(seedSvc?: SeedService);
    protected getSeedSvc(): SeedService;
    protected onUpdatingWorkspace(): Promise<void>;
    protected onUpdatedWorkspace(): Promise<void>;
}
