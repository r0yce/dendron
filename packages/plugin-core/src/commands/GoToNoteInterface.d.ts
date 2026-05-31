import { DNoteAnchorBasic, DVault, NoteProps } from "@dendronhq/common-all";
import { Position, ViewColumn } from "vscode";
export declare enum TargetKind {
    NOTE = "note",
    NON_NOTE = "nonNote",
    LINK = "link"
}
export type GoToNoteCommandOpts = {
    qs?: string;
    vault?: DVault;
    anchor?: DNoteAnchorBasic;
    overrides?: Partial<NoteProps>;
    kind?: TargetKind;
    /**
     * What {@link vscode.ViewColumn} to open note in
     */
    column?: ViewColumn;
    /** added for contextual UI analytics. */
    source?: string;
    /**
     * the note which go to originates from.
     * this is populated in the process of running the command
     * and should not be passed in outside of tests.
     */
    originNote?: NoteProps;
};
export { GoToNoteCommandOpts as GotoNoteCommandOpts };
export declare enum GotoFileType {
    BINARY = "binary",
    TEXT = "text"
}
export type GoToNoteCommandOutput = {
    kind: TargetKind.NOTE;
    note: NoteProps;
    pos?: Position;
    source?: string;
} | {
    kind: TargetKind.NON_NOTE;
    fullPath: string;
    type: GotoFileType;
} | {
    kind: TargetKind.LINK;
    fullPath: string;
    fromProxy: boolean;
} | undefined;
