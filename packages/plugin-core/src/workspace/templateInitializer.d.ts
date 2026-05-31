import { BlankInitializer } from "./blankInitializer";
import { OnWorkspaceCreationOpts, WorkspaceInitializer } from "./workspaceInitializer";
/**
 * Template Workspace Initializer - add the templates seed to the workspace:
 */
export declare class TemplateInitializer extends BlankInitializer implements WorkspaceInitializer {
    onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void>;
}
