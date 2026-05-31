import { DVault, VaultRemoteSource } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandOpts = {
    type: VaultRemoteSource;
    vault: DVault;
    remoteUrl?: string;
};
type CommandOutput = {
    updatedVault: DVault | null;
};
export { CommandOpts as ConvertVaultCommandOpts };
export declare class ConvertVaultCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    gatherVault(): Promise<DVault | undefined>;
    gatherType(vault: DVault): Promise<VaultRemoteSource | undefined>;
    gatherRemoteURL(): Promise<string | undefined>;
    /** Prompt the user if they agree to have their vault folder moved.
     *
     * @return true if the user agreed to the prompt, false if they cancelled or dismissed it.
     */
    promptForFolderMove(vault: DVault, remote: string | null): Promise<boolean>;
    gatherInputs(opts?: CommandOpts): Promise<CommandOpts | undefined>;
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    execute(opts: CommandOpts): Promise<{
        updatedVault: DVault;
    }>;
}
