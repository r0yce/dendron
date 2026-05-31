import { DVault } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {
    /** Which vault to migrate? */
    vault?: DVault;
};
type CommandOutput = {
    /** The vault after the migration, or null if the migration was cancelled. */
    newVault: DVault | null;
};
export declare enum MigrateVaultContinueOption {
    continue = "continue",
    cancel = "cancel"
}
export declare class MigrateSelfContainedVaultCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    sanityCheck(opts?: CommandOpts): Promise<undefined | string>;
    constructor(ext: IDendronExtension);
    gatherInputs(opts?: CommandOpts): Promise<CommandOpts | undefined>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
export {};
