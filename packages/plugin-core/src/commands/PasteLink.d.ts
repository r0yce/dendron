import ogs from "open-graph-scraper";
import { Selection } from "vscode";
import { BasicCommand } from "./base";
type CommandOpts = {
    link?: string;
    selection?: Selection;
};
type CommandOutput = string;
export declare class PasteLinkCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    sanityCheck(): Promise<"No document open" | undefined>;
    showFeedback(formattedLink: string): Promise<void>;
    getFormattedLinkFromOpenGraphResult(result: ogs.SuccessResult["result"], url: string): string;
    execute(opts: CommandOpts): Promise<string>;
}
export {};
