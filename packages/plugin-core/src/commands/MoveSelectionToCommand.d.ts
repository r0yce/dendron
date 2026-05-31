import { RefactoringCommandUsedPayload } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandInput = {
    initialValue?: string;
    noConfirm?: boolean;
};
type CommandOpts = {} & CommandInput;
type CommandOutput = {} & CommandOpts;
export declare class MoveSelectionToCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    _proxyMetricPayload: (RefactoringCommandUsedPayload & {
        extra: {
            [key: string]: any;
        };
    }) | undefined;
    private extension;
    constructor(ext: IDendronExtension);
    sanityCheck(): Promise<"You need to have a note open to use this command." | "All selections are empty. Please selection the text to move." | "Selection contains frontmatter. Please only select the body of the note." | undefined>;
    private createLookupController;
    private createLookupProvider;
    private prepareProxyMetricPayload;
    execute(opts: CommandOpts): Promise<CommandOutput>;
    trackProxyMetrics(): void;
}
export {};
