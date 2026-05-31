import { DWorkspaceV2 } from "@dendronhq/common-all";
import { BlankInitializer } from "./blankInitializer";
import { OnWorkspaceCreationOpts, WorkspaceInitializer } from "./workspaceInitializer";
/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
export declare class TutorialInitializer extends BlankInitializer implements WorkspaceInitializer {
    static getTutorialType(): any;
    onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void>;
    private getAnalyticsPayloadFromDocument;
    onWorkspaceOpen(opts: {
        ws: DWorkspaceV2;
    }): Promise<void>;
    private triedToShowImportToast;
    private tryShowImportNotesFeatureToaster;
    onWorkspaceActivate(opts: {
        skipOpts: Partial<{
            skipTreeView: boolean;
        }>;
    }): Promise<void>;
}
