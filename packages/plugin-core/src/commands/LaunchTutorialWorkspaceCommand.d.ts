import { LaunchTutorialCommandInvocationPoint } from "../constants";
import { BasicCommand } from "./base";
type CommandInput = {
    invocationPoint: LaunchTutorialCommandInvocationPoint;
};
type CommandOpts = CommandInput;
/**
 * Helper command to launch the user into a new tutorial workspace.
 */
export declare class LaunchTutorialWorkspaceCommand extends BasicCommand<CommandOpts, void> {
    key: string;
    execute(opts: CommandOpts): Promise<void>;
}
export {};
