import { NoteChangeEntry, RefactoringCommandUsedPayload, RenameNoteOpts } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandInput = any;
export type CommandOpts = {
    moves: RenameNoteOpts[];
    /**
     * Show notification message
     */
    silent?: boolean;
    /**
     * Close and open current file
     */
    closeAndOpenFile?: boolean;
    /**
     * Pause all watchers
     */
    noPauseWatcher?: boolean;
    nonInteractive?: boolean;
    initialValue?: string;
    vaultName?: string;
    /**
     * If set to true, don't allow toggling vaults
     * Used in RenameNoteCommand
     */
    useSameVault?: boolean;
    /** Defaults to true. */
    allowMultiselect?: boolean;
    /** set a custom title for the quick input. Used for rename note */
    title?: string;
};
export type CommandOutput = {
    changed: NoteChangeEntry[];
};
export declare class MoveNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    _proxyMetricPayload: (RefactoringCommandUsedPayload & {
        extra: {
            [key: string]: any;
        };
    }) | undefined;
    constructor(ext: IDendronExtension);
    sanityCheck(): Promise<"No document open" | undefined>;
    gatherInputs(opts?: CommandOpts): Promise<CommandInput | undefined>;
    private prepareProxyMetricPayload;
    private getDesiredMoves;
    execute(opts: CommandOpts): Promise<{
        changed: NoteChangeEntry[];
    }>;
    /** Performs the actual move of the notes. */
    private moveNotes;
    private showMultiMovePreview;
    trackProxyMetrics({ opts, noteChangeEntryCounts, }: {
        opts: CommandOpts;
        noteChangeEntryCounts: {
            createdCount: number;
            deletedCount: number;
            updatedCount: number;
        };
    }): void;
    addAnalyticsPayload(opts: CommandOpts, out: CommandOutput): {
        createdCount: number;
        deletedCount: number;
        updatedCount: number;
    };
}
export {};
