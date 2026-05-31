import { DNoteAnchorBasic, NotePropsMeta } from "@dendronhq/common-all";
import { Position } from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
import { GotoFileType, GoToNoteCommandOpts, GoToNoteCommandOutput } from "./GoToNoteInterface";
export declare const findAnchorPos: (opts: {
    anchor: DNoteAnchorBasic;
    note: NotePropsMeta;
}) => Position;
/**
 * Open or create a note. See {@link GotoNoteCommand.execute} for details
 */
export declare class GotoNoteCommand extends BasicCommand<GoToNoteCommandOpts, GoToNoteCommandOutput> {
    key: string;
    private extension;
    private wsUtils;
    constructor(extension: IDendronExtension);
    private getQs;
    private maybeSetOptsFromExistingNote;
    private maybeSetOptsFromNonNote;
    private setOptsFromNewNote;
    private processInputs;
    /**
     *
     * Warning about `opts`! If `opts.qs` is provided but `opts.vault` is empty,
     * it will default to the current vault. If `opts.qs` is not provided, it will
     * read the selection from the current document as a link to get it. If both
     * `opts.qs` and `opts.vault` is empty, both will be read from the selected link.
     *
     * @param opts.qs - query string. should correspond to {@link NoteProps.fname}
     * @param opts.vault - {@link DVault} for note
     * @param opts.anchor - a {@link DNoteAnchor} to navigate to
     * @returns
     */
    execute(opts: GoToNoteCommandOpts): Promise<GoToNoteCommandOutput>;
    addAnalyticsPayload(opts?: GoToNoteCommandOpts, resp?: GoToNoteCommandOutput): {
        fileType: GotoFileType | undefined;
        source: import("@dendronhq/common-all").ContextualUIEvents;
    } | {
        fileType: GotoFileType | undefined;
        source?: never;
    };
    private displayInvalidFilenameError;
    /**
     * Given an origin note and a newly created note,
     * add a backlink that points to the origin note
     * to newly created note's link metadata
     */
    private addBacklinkPointingToOrigin;
}
