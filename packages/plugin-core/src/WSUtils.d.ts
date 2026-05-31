import { DVault, NotePropsMeta, SchemaModuleProps } from "@dendronhq/common-all";
import * as vscode from "vscode";
/**
 * Prefer to use WSUtilsV2 instead of this class to prevent circular dependencies.
 * (move methods from this file to WSUtilsV2 as needed).
 * See [[Migration of static  methods to a non-static|dendron://dendron.docs/dev.ref.impactful-change-notice#migration-of-static--methods-to-a-non-static]]
 * */
export declare class WSUtils {
    static showActivateProgress(): void;
    /**
     * Performs a series of step to initialize the workspace
     *  Calls activate workspace
     * - initializes DendronEngine
     * @param mainVault
     */
    static reloadWorkspace(): Promise<unknown>;
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getVaultFromPath(fsPath: string): DVault;
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getNoteFromPath(fsPath: string): Promise<import("@dendronhq/common-all").NoteProps | undefined>;
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getVaultFromDocument(document: vscode.TextDocument): DVault;
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getNoteFromDocument(document: vscode.TextDocument): Promise<import("@dendronhq/common-all").NoteProps | undefined>;
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static getActiveNote(): Promise<import("@dendronhq/common-all").NoteProps | undefined> | undefined;
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    private static openFileInEditorUsingFullFname;
    static openNoteByPath({ vault, fname, }: {
        vault: DVault;
        fname: string;
    }): Promise<vscode.TextEditor>;
    /**
      @deprecated. Use same method in {@link WSUtilsV2}
    **/
    static openNote(note: NotePropsMeta): Promise<vscode.TextEditor>;
    static openSchema(schema: SchemaModuleProps): Promise<vscode.TextEditor>;
}
