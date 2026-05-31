import { DVault, WorkspaceType } from "@dendronhq/common-all";
import { WorkspaceInitializer } from "../workspace/workspaceInitializer";
import { BasicCommand } from "./base";
type CommandInput = {
    rootDirRaw: string;
    workspaceInitializer?: WorkspaceInitializer;
    workspaceType?: WorkspaceType;
};
type CommandOpts = CommandInput & {
    vault?: DVault;
    skipOpenWs?: boolean;
    /**
     * override prompts
     */
    skipConfirmation?: boolean;
    /** Create self contained vaults, overriding the Dendron VSCode setting. */
    selfContained?: boolean;
    /**
     * Open worksapce without reloading
     */
    EXPERIMENTAL_openNativeWorkspaceNoReload?: boolean;
};
type CommandOutput = {
    wsVault?: DVault;
    additionalVaults?: DVault[];
};
export { CommandOpts as SetupWorkspaceOpts };
export declare class SetupWorkspaceCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    handleExistingRoot: ({ rootDir, skipConfirmation, }: {
        rootDir: string;
        skipConfirmation?: boolean;
    }) => Promise<boolean>;
    addAnalyticsPayload(opts?: CommandOpts): {
        workspaceType: WorkspaceType | undefined;
    };
    execute(opts: CommandOpts): Promise<{
        wsVault?: DVault;
        additionalVaults?: DVault[];
    }>;
    /**
     * Tests whether or not the given directory is empty.
     */
    private isEmptyDirectory;
}
