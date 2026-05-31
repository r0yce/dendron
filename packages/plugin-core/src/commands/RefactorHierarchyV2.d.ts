import { DEngineClient, DNodeProps, DNodePropsQuickInputV2, DVault, RefactoringCommandUsedPayload } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { BasicCommand } from "./base";
import { RenameNoteOutputV2a, RenameNoteV2aCommand } from "./RenameNoteV2a";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
type CommandOpts = {
    scope?: NoteLookupProviderSuccessResp;
    match: string;
    replace: string;
    noConfirm?: boolean;
};
export type CommandOutput = RenameNoteOutputV2a & {
    operations: RenameOperation[];
};
type RenameOperation = {
    vault: DVault;
    oldUri: Uri;
    newUri: Uri;
};
export declare class RefactorHierarchyCommandV2 extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    _proxyMetricPayload: (RefactoringCommandUsedPayload & {
        extra: {
            [key: string]: any;
        };
    }) | undefined;
    entireWorkspaceQuickPickItem: DNodePropsQuickInputV2;
    promptScope(): Promise<NoteLookupProviderSuccessResp | undefined>;
    promptMatchText(): Promise<string | undefined>;
    promptReplaceText(): Promise<string | undefined>;
    gatherInputs(): Promise<CommandOpts | undefined>;
    showPreview(operations: RenameOperation[]): void;
    showError(operations: RenameOperation[]): Promise<void>;
    getCapturedNotes(opts: {
        scope: NoteLookupProviderSuccessResp | undefined;
        matchRE: RegExp;
        engine: DEngineClient;
    }): Promise<DNodeProps[]>;
    getRenameOperations(opts: {
        capturedNotes: DNodeProps[];
        matchRE: RegExp;
        replace: string;
        wsRoot: string;
    }): {
        oldUri: Uri;
        newUri: Uri;
        vault: DVault;
    }[];
    hasExistingFiles(opts: {
        operations: RenameOperation[];
    }): Promise<boolean>;
    runOperations(opts: {
        operations: RenameOperation[];
        renameCmd: RenameNoteV2aCommand;
    }): Promise<RenameNoteOutputV2a>;
    promptConfirmation(noConfirm?: boolean): Promise<boolean>;
    prepareProxyMetricPayload(capturedNotes: DNodeProps[]): void;
    execute(opts: CommandOpts): Promise<any>;
    showResponse(res: CommandOutput): Promise<void>;
    trackProxyMetrics({ noteChangeEntryCounts, }: {
        noteChangeEntryCounts: {
            createdCount: number;
            deletedCount: number;
            updatedCount: number;
        };
    }): void;
    addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput): {
        createdCount: number;
        deletedCount: number;
        updatedCount: number;
    };
}
export {};
