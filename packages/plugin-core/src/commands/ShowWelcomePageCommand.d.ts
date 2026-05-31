import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandInput = {};
type CommandOutput = void;
/**
 * This command is a bit of a misnomer - it actually launches the welcome
 * webview page
 */
export declare class ShowWelcomePageCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(_opts: CommandOpts): Promise<CommandOutput>;
}
export {};
