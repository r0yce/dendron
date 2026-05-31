import { NoteChangeEntry } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { OldNewLocation } from "../components/lookup/utils";
import { BaseCommand } from "./base";
type CommandInput = {
    move: OldNewLocation[];
};
type CommandOpts = {
    files: {
        oldUri: Uri;
        newUri: Uri;
    }[];
    silent: boolean;
    closeCurrentFile: boolean;
    openNewFile: boolean;
    noModifyWatcher?: boolean;
};
type CommandOutput = {
    changed: NoteChangeEntry[];
};
export { CommandOutput as RenameNoteOutputV2a };
/**
 * This is not `Dendron: Rename Note`. For that, See [[../packages/plugin-core/src/commands/RenameNoteCommand.ts]]
 * This is an plugin internal command that is used as part of refactor hierarchy and the rename provider implementation.
 *
 * TODO: refactor this class to avoid confusion.
 * Possibly consolidate renaming logic in one place.
 */
export declare class RenameNoteV2aCommand extends BaseCommand<CommandOpts, CommandOutput, CommandInput> {
    key: string;
    silent?: boolean;
    gatherInputs(): Promise<CommandInput>;
    enrichInputs(inputs: CommandInput): Promise<CommandOpts>;
    sanityCheck(): Promise<"No document open" | undefined>;
    showResponse(res: CommandOutput): Promise<void>;
    execute(opts: CommandOpts): Promise<{
        changed: NoteChangeEntry[];
    }>;
}
