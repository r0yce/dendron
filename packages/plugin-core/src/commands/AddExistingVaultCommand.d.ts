import { DVault, DWorkspace, SelfContainedVault, VaultRemoteSource } from "@dendronhq/common-all";
import { QuickPickItem } from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {
    type: VaultRemoteSource;
    path: string;
    pathRemote?: string | undefined;
    name?: string | undefined;
    isSelfContained?: boolean | undefined;
};
type CommandOutput = {
    vaults: DVault[];
};
export { CommandOpts as VaultAddCommandOpts };
type SourceQuickPickEntry = QuickPickItem & {
    src: string;
};
export declare class AddExistingVaultCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    generateRemoteEntries: () => SourceQuickPickEntry[];
    /** A regular, non-self contained vault. */
    gatherVaultStandard(sourceType: VaultRemoteSource): Promise<CommandOpts | undefined>;
    gatherDestinationFolder(): Promise<string | undefined>;
    gatherVaultSelfContained(sourceType: VaultRemoteSource): Promise<CommandOpts | undefined>;
    gatherInputs(): Promise<CommandOpts | undefined>;
    handleRemoteRepo(opts: CommandOpts): Promise<{
        vaults: DVault[];
        workspace?: DWorkspace | undefined;
    }>;
    handleRemoteRepoSelfContained(opts: CommandOpts): Promise<{
        vaults: DVault[];
    }>;
    /** If a self contained vault contains transitive dependencies, warn the user
     * that they won't be accessible.
     *
     * Adding transitive deps is not supported yet, this check can be removed once
     * support is added.
     */
    checkAndWarnTransitiveDeps(opts: {
        vault: SelfContainedVault;
        wsRoot: string;
    }): Promise<void>;
    addWorkspaceToWorkspace(workspace: DWorkspace): Promise<void>;
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
