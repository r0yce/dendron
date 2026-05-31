import { NoteProps } from "@dendronhq/common-all";
export declare enum ProceedCancel {
    PROCEED = "proceed",
    CANCEL = "cancel"
}
export declare class QuickPickUtil {
    /** Shows quick pick with proceed/cancel view which
     *  will be blocking until user picks an answer. */
    static showProceedCancel(): Promise<ProceedCancel>;
    /**
     *  Show a quick pick with the given notes as choices. Returns the chosen note
     *  or undefined if user cancelled the note selection.
     *  */
    static showChooseNote(notes: NoteProps[]): Promise<NoteProps | undefined>;
}
