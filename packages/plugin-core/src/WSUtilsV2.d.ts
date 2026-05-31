import { IDendronExtension } from "./dendronExtensionInterface";
import vscode, { TextEditor } from "vscode";
import { DNoteAnchorBasic, DVault, NoteProps, NotePropsMeta, RespV3, SchemaModuleProps } from "@dendronhq/common-all";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
/**
 *
 *  Utilities to work with workspace related functions
 **/
export declare class WSUtilsV2 implements IWSUtilsV2 {
    private extension;
    constructor(extension: IDendronExtension);
    getVaultFromPath(fsPath: string): DVault;
    getNoteFromPath(fsPath: string): Promise<NoteProps | undefined>;
    /**
     * Prefer NOT to use this method and instead get WSUtilsV2 passed in as
     * dependency or use IDendronExtension.wsUtils.
     *
     * This method exists to satisfy static method of WSUtils while refactoring
     * is happening and we are moving method to this class.
     * */
    static instance(): IWSUtilsV2;
    getVaultFromUri(fileUri: vscode.Uri): DVault;
    getNoteFromDocument(document: vscode.TextDocument): Promise<NoteProps | undefined>;
    /**
     * See {@link IWSUtilsV2.promptForNoteAsync}.
     */
    promptForNoteAsync(opts: {
        notes: NoteProps[];
        quickpickTitle: string;
        nonStubOnly?: boolean;
    }): Promise<RespV3<NoteProps | undefined>>;
    getVaultFromDocument(document: vscode.TextDocument): DVault;
    tryGetNoteFromDocument(document: vscode.TextDocument): Promise<NoteProps | undefined>;
    trySelectRevealNonNoteAnchor(editor: TextEditor, anchor: DNoteAnchorBasic): Promise<void>;
    getActiveNote(): Promise<NoteProps | undefined>;
    /** If the text document at `filePath` is open in any editor, return that document. */
    getMatchingTextDocument(filePath: string): vscode.TextDocument | undefined;
    openFileInEditorUsingFullFname(vault: DVault, fnameWithExtension: string): Promise<vscode.TextEditor>;
    openNote(note: NotePropsMeta): Promise<vscode.TextEditor>;
    openSchema(schema: SchemaModuleProps): Promise<vscode.TextEditor>;
}
