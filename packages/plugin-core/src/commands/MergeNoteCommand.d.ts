import { NoteChangeEntry, NoteProps, RefactoringCommandUsedPayload } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand, SanityCheckResults } from "./base";
type CommandInput = {
    source?: string;
    dest?: string;
    noConfirm?: boolean;
};
type CommandOpts = {
    sourceNote: NoteProps | undefined;
    destNote: NoteProps | undefined;
} & CommandInput;
type CommandOutput = {
    changed: NoteChangeEntry[];
} & CommandOpts;
export declare class MergeNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    _proxyMetricPayload: (RefactoringCommandUsedPayload & {
        extra: {
            [key: string]: any;
        };
    }) | undefined;
    private extension;
    constructor(ext: IDendronExtension);
    private createLookupController;
    private createLookupProvider;
    sanityCheck(): Promise<SanityCheckResults>;
    gatherInputs(opts: CommandOpts): Promise<CommandOpts | undefined>;
    private prepareProxyMetricPayload;
    /**
     * Given a source note and destination note,
     * append the entire body of source note to the destination note.
     * @param sourceNote Source note
     * @param destNote Dest note
     */
    private appendNote;
    /**
     * Helper for {@link updateBacklinks}.
     * Given a note id, source and dest note,
     * Find all links in note with id that points to source
     * and update it to point to dest instead.
     * @param opts
     */
    private updateLinkInNote;
    /**
     * Given a source note and dest note,
     * Look at all the backlinks source note has, and update them
     * to point to the dest note.
     * @param sourceNote Source note
     * @param destNote Dest note
     */
    private updateBacklinks;
    /**
     * Given a source note, delete it
     * @param sourceNote source note
     */
    private deleteSource;
    execute(opts: CommandOpts): Promise<CommandOutput>;
    addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput): {
        createdCount: number;
        deletedCount: number;
        updatedCount: number;
    };
    trackProxyMetrics({ noteChangeEntryCounts, }: {
        noteChangeEntryCounts: {
            createdCount: number;
            deletedCount: number;
            updatedCount: number;
        };
    }): void;
}
export {};
