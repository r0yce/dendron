import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = any;
export declare class ShowLegacyPreviewCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    sanityCheck(): Promise<"No document open" | undefined>;
    execute(_opts?: CommandOpts): Promise<unknown>;
}
export {};
