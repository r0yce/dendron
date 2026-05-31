import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
import { CommandOpts as MoveNoteCommandOpts, CommandOutput as MoveNoteCommandOutput } from "./MoveNoteCommand";
type CommandOpts = MoveNoteCommandOpts;
type CommandInput = any;
type CommandOutput = MoveNoteCommandOutput;
/**
 * This is `Dendron: Rename Note`.
 * Currently (as of 2022-06-15),
 * this is simply wrapping methods of the move note command and calling them with a custom option.
 * This is done to correctly register the command and to properly instrument command usage.
 *
 * TODO: refactor move and rename logic, redesign arch for both commands.
 */
export declare class RenameNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    private _moveNoteCommand;
    constructor(ext: IDendronExtension);
    sanityCheck(): Promise<"No document open" | undefined>;
    private populateCommandOpts;
    gatherInputs(opts: CommandOpts): Promise<CommandInput | undefined>;
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
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
export {};
