import { DeleteNoteResp, DLink, NotePropsMeta } from "@dendronhq/common-all";
import { InputArgCommand } from "./base";
type CommandOpts = any;
type CommandOutput = DeleteNoteResp | void;
export type { CommandOutput as DeleteNodeCommandOutput };
export declare class DeleteCommand extends InputArgCommand<CommandOpts, CommandOutput> {
    key: string;
    private getBacklinkFrontmatterLineOffset;
    /**
     * When Delete Command is ran from explorer menu, it gets Uri as args
     */
    private isUriArgs;
    private deleteNote;
    showNoteDeletePreview(note: NotePropsMeta, backlinks: DLink[]): Promise<string>;
    promptConfirmation(title: string, noConfirm?: boolean): Promise<boolean>;
    sanityCheck(opts?: CommandOpts): Promise<"No note currently open, and no note selected to open." | undefined>;
    execute(opts?: CommandOpts): Promise<CommandOutput>;
}
