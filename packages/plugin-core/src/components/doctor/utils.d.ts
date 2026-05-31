import * as vscode from "vscode";
export declare class DoctorUtils {
    static findDuplicateNoteFromDocument(document: vscode.TextDocument): Promise<{
        note: import("@dendronhq/common-all").NoteProps;
        duplicate: import("@dendronhq/common-all").NoteProps;
    } | {
        note: import("@dendronhq/common-all").NoteProps;
        duplicate?: never;
    } | undefined>;
    static findDuplicateNoteAndPromptIfNecessary(document: vscode.TextDocument, source: string): Promise<void>;
    static validateFilenameFromDocumentAndPromptIfNecessary(document: vscode.TextDocument): Promise<boolean>;
}
