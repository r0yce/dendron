import { DWorkspaceV2 } from "@dendronhq/common-all";
import { WorkspaceInitializer } from "./workspaceInitializer";
/**
 * Seed Browser Workspace Initializer - Open the Seed Browser
 */
export declare class SeedBrowserInitializer implements WorkspaceInitializer {
    /**
     * Launch Seed Browser Webview
     * @param _opts
     */
    onWorkspaceOpen(_opts: {
        ws: DWorkspaceV2;
    }): Promise<void>;
}
