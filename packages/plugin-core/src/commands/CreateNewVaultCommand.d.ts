import { DVault } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {
    path: string;
    pathRemote?: string;
    name?: string;
    isSelfContained?: boolean;
};
type CommandOutput = {
    vaults: DVault[];
};
export { CommandOpts as VaultAddCommandOpts };
export declare class CreateNewVaultCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    gatherDestinationFolder(): Promise<string | undefined>;
    gatherVaultStandard(): Promise<CommandOpts | undefined>;
    gatherVaultSelfContained(): Promise<CommandOpts | undefined>;
    gatherInputs(): Promise<CommandOpts | undefined>;
    addVaultToWorkspace(vault: DVault): Promise<void>;
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    execute(opts: CommandOpts): Promise<{
        vaults: DVault[];
    }>;
}
