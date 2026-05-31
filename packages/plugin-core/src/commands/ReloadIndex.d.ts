import { DEngineClient } from "@dendronhq/common-all";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { BasicCommand } from "./base";
export declare const FIX_CONFIG_SELF_CONTAINED = "Fix configuration";
type ReloadIndexCommandOpts = {
    silent?: boolean;
};
export declare class ReloadIndexCommand extends BasicCommand<ReloadIndexCommandOpts, DEngineClient | undefined> {
    key: string;
    silent: boolean;
    /** Create the root schema if it is missing. */
    private createRootSchemaIfMissing;
    /** Creates the root note if it is missing. */
    private createRootNoteIfMissing;
    /** Checks if there are any self contained vaults that aren't marked correctly, and prompts the user to fix the configuration. */
    static checkAndPromptForMisconfiguredSelfContainedVaults({ engine, }: {
        engine: IEngineAPIService;
    }): Promise<void>;
    /**
     * Update index
     * @param opts
     */
    execute(opts?: ReloadIndexCommandOpts): Promise<DEngineClient | undefined>;
}
export {};
