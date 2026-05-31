import { RefactoringCommandUsedPayload } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
import { CommandOutput as RefactorHierarchyV2CommandOutput } from "./RefactorHierarchyV2";
type CommandOpts = {
    match: string;
};
type CommandInput = {
    match: string;
};
type CommandOutput = RefactorHierarchyV2CommandOutput;
export declare class ArchiveHierarchyCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private refactorCmd;
    private trackProxyMetrics;
    private prepareProxyMetricPayload;
    _proxyMetricPayload: (RefactoringCommandUsedPayload & {
        extra: {
            [key: string]: any;
        };
    }) | undefined;
    constructor(name?: string);
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(opts: CommandOpts): Promise<any>;
    showResponse(res: CommandOutput): Promise<void>;
    addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput): {
        createdCount: number;
        deletedCount: number;
        updatedCount: number;
    };
}
export {};
