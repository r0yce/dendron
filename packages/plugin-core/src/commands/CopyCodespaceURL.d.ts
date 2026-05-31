import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = string | undefined;
export declare class CopyCodespaceURL extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    sanityCheck(): Promise<"No document open" | undefined>;
    showFeedback(link: string): Promise<void>;
    execute(_opts: CommandOpts): Promise<string | undefined>;
}
export {};
