import { DEngineClient, DNoteAnchorBasic, DVault, NoteProps } from "@dendronhq/common-all";
import vscode, { Position, Selection, TextDocument, TextEditor, TextEditorEdit, ViewColumn } from "vscode";
import { TargetKind } from "../commands/GoToNoteInterface";
export type ProcessSelectionOpts = {
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
};
/**
 * Utility methods that take the {@link vscode.editor} and / or its components
 * and retrieve / modify the content of it.
 *
 * If you are creating a utility that does something common when using the active text editor,
 * consider adding them here.
 */
export declare class EditorUtils {
    /** Finds the header at the specified line, if any.
     *
     * @param editor the editor that has the document containing the header open
     * @param position the line where the header should be checked for
     * @returns the header text, or undefined if there wasn't a header
     */
    static getHeaderAt({ document, position, engine: _engine, }: {
        document: TextDocument;
        position: Position;
        engine?: DEngineClient;
    }): undefined | string;
    /** Finds the block anchor at the end of the specified line, if any.
     *
     * @param editor the editor that has the document containing the anchor open
     * @param position the line where the anchor should be checked for
     * @returns the anchor (with ^), or undefined if there wasn't an anchor
     */
    static getBlockAnchorAt({ editor, position, }: {
        editor: TextEditor;
        position: Position;
        engine?: DEngineClient;
    }): string | undefined;
    /** Add a block anchor at the end of the specified line. The anchor is randomly generated if not supplied.
     *
     * If there is already an anchor at the end of this line, then this function doesn't actually insert an anchor but returns that anchor instead.
     *
     * @param editBuilder parameter of the callback in `editor.edit`
     * @param editor the editor that the editBuilder belongs to
     * @param position the line where the anchor will be inserted
     * @param anchor anchor id to insert (without ^), randomly generated if undefined
     * @returns the anchor that has been added (with ^)
     */
    static addOrGetAnchorAt(opts: {
        editBuilder: TextEditorEdit;
        editor: TextEditor;
        position: Position;
        anchor?: string;
        engine: DEngineClient;
    }): string;
    /** Finds the header or block anchor at the end of the specified line, if any.
     *
     * @param editor the editor that has the document containing the anchor open
     * @param position the line where the anchor should be checked for
     * @returns the anchor (with ^), or undefined if there wasn't an anchor
     */
    static getAnchorAt(args: {
        editor: TextEditor;
        position: Position;
        engine: DEngineClient;
    }): string | undefined;
    static getSelectionAnchors(opts: {
        editor: TextEditor;
        selection?: Selection | undefined;
        doStartAnchor?: boolean | undefined;
        doEndAnchor?: boolean | undefined;
        engine: DEngineClient;
    }): Promise<{
        startAnchor?: string;
        endAnchor?: string;
    }>;
    /**
     * Utility method to check if the selected text is a broken wikilink
     */
    static isBrokenWikilink({ editor, selection, note, engine, }: {
        editor: TextEditor;
        selection: vscode.Selection;
        note: NoteProps;
        engine: DEngineClient;
    }): Promise<boolean>;
    /**
     * NOTE: this method requires that `ExtensionProvider` be available and can provide a workspace
     */
    static getLinkFromSelectionWithWorkspace(): Promise<{
        alias: string;
        value: string;
        vaultName: string | undefined;
        anchorHeader: DNoteAnchorBasic | undefined;
    } | undefined>;
    /**
     * Given a document, get the end position of the frontmatter
     * if zeroIndex is true, the document's first line is 0
     * otherwise, it is 1 (default)
     */
    static getFrontmatterPosition(opts: {
        document: vscode.TextDocument;
        zeroIndex?: boolean;
    }): Promise<vscode.Position | false>;
    /**
     * Given a text editor, determine if any of the selection
     * contains part of the frontmatter.
     * if given editor holds a document that doesn't have frontmatter,
     * it will throw an error
     */
    static selectionContainsFrontmatter(opts: {
        editor: vscode.TextEditor;
    }): Promise<boolean>;
}
