import { BasicCommand } from "./base";
type ConfigScope = "local" | "global" | "all";
type CommandOpts = {
    scope: ConfigScope;
};
type CommandOutput = void;
type CommandInput = {
    scope: ConfigScope;
};
export declare class ResetConfigCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(opts: CommandOpts): Promise<void>;
}
export {};
