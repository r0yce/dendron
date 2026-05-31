import { NoteProps, RenameNoteResp } from "@dendronhq/common-all";
import { Range } from "vscode";
import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandOpts = {
    /** If missing, this will be parsed from the currently selected line. */
    oldHeader?: {
        /** The contents of the old header. */
        text: string;
        /** The region of the document containing the text of the old header. */
        range: Range;
    };
    /** The new text for the header. */
    newHeader?: string;
    /** added for contextual UI analytics. */
    source?: string;
    /** current note that the rename is happening */
    note?: NoteProps;
} | undefined;
export type CommandOutput = RenameNoteResp | undefined;
export declare class RenameHeaderCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    gatherInputs(opts: CommandOpts): Promise<Required<CommandOpts> | undefined>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
    trackProxyMetrics({ opts, noteChangeEntryCounts, }: {
        opts: CommandOpts;
        noteChangeEntryCounts: {
            createdCount: number;
            deletedCount: number;
            updatedCount: number;
        };
    }): void;
    addAnalyticsPayload(opts?: CommandOpts, out?: CommandOutput): {
        source: import("@dendronhq/common-all").ContextualUIEvents;
        createdCount: number;
        deletedCount: number;
        updatedCount: number;
    } | {
        source?: never;
        createdCount: number;
        deletedCount: number;
        updatedCount: number;
    };
}
export {};
