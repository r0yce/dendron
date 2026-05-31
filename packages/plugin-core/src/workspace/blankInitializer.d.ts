import { DVault } from "@dendronhq/common-all";
import { OnWorkspaceCreationOpts, WorkspaceInitializer } from "./workspaceInitializer";
/**
 * Blank Workspace Initializer. Creates the barebones requirements for a functioning workspace
 */
export declare class BlankInitializer implements WorkspaceInitializer {
    createVaults(wsVault?: DVault): {
        wsVault: {
            fsPath: string;
        };
    };
    onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void>;
}
