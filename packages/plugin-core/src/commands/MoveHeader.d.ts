import { DLink, NoteChangeEntry, NoteProps, NoteQuickInput } from "@dendronhq/common-all";
import { Node } from "@dendronhq/engine-server";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { FoundRefT } from "../utils/md";
import { BasicCommand } from "./base";
type CommandInput = {
    nonInteractive?: boolean;
    useSameVault?: boolean;
} | undefined;
type CommandOpts = {
    dest?: NoteProps;
    origin: NoteProps;
    nodesToMove: Node[];
    engine: IEngineAPIService;
} & CommandInput;
type CommandOutput = {
    changed: NoteChangeEntry[];
} & CommandOpts;
export declare class MoveHeaderCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private headerNotSelectedError;
    private noActiveNoteError;
    private noNodesToMoveError;
    private noDestError;
    private getProc;
    /**
     * Helper for {@link MoveHeaderCommand.gatherInputs}
     * Validates and processes inputs to be passed for further action
     * @param engine
     * @returns {}
     */
    private validateAndProcessInput;
    /**
     * Helper for {@link MoveHeaderCommand.gatherInputs}
     * Prompts user to do a lookup on the desired destination.
     * @param opts
     * @returns
     */
    private promptForDestination;
    /**
     * Get the destination note given a quickpick and the selected item.
     * @param opts
     * @returns
     */
    prepareDestination(opts: {
        engine: IEngineAPIService;
        quickpick: DendronQuickPickerV2;
        selectedItems: readonly NoteQuickInput[];
    }): Promise<NoteProps | undefined>;
    gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined>;
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * Given a list of nodes to move, appends them to the destination
     * @param engine
     * @param dest
     * @param nodesToMove
     */
    private appendHeaderToDestination;
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * given a copy of origin, and the modified content of origin,
     * find the difference and return the updated anchor names
     * @param originDeepCopy
     * @param modifiedOriginContent
     * @returns anchorNamesToUpdate
     */
    private findAnchorNamesToUpdate;
    /**
     * Helper for {@link MoveHeaderCommand.updateReferences}
     * Given a {@link Location}, find the respective note.
     * @param location
     * @param engine
     * @returns note
     */
    private getNoteByLocation;
    /**
     * Helper for {@link MoveHeaderCommand.updateReferences}
     * Given an note, origin note, and a list of anchor names,
     * return all links that should be updated in {@link note},
     * is a descending order of location offset.
     * @param note
     * @param engine
     * @param origin
     * @param anchorNamesToUpdate
     * @returns
     */
    private findLinksToUpdate;
    /**
     * Helper for {@link MoveHeaderCommand.updateReferences}
     * Given a note that has links to update, and a list of links,
     * modify the note's body to have updated links.
     * @param note Note that has links to update
     * @param linksToUpdate list of links to update
     * @param dest Note that was the destination of move header commnad
     * @returns
     */
    updateLinksInNote(opts: {
        note: NoteProps;
        engine: IEngineAPIService;
        linksToUpdate: DLink[];
        dest: NoteProps;
    }): Promise<NoteProps>;
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * Given a list of found references, update those references
     * so that they point to the correct header in a destination note.
     * @param foundReferences
     * @param anchorNamesToUpdate
     * @param engine
     * @param origin
     * @param dest
     * @returns updated
     */
    updateReferences(foundReferences: FoundRefT[], anchorNamesToUpdate: string[], engine: IEngineAPIService, origin: NoteProps, dest: NoteProps): Promise<NoteChangeEntry[]>;
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * Given a origin note and a list of nodes to move,
     * remove the nodes from the origin's note body
     * and return the modified origin content rendered as string
     * @param origin origin note
     * @param nodesToMove nodes that will be moved
     * @param engine
     * @returns
     */
    removeBlocksFromOrigin(origin: NoteProps, nodesToMove: Node[], engine: IEngineAPIService): Promise<string>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
    trackProxyMetrics({ out, noteChangeEntryCounts, }: {
        out: CommandOutput;
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
