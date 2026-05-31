import { ExtensionContext, FileRenameEvent, FileWillRenameEvent, TextDocument, TextDocumentChangeEvent, TextDocumentWillSaveEvent, TextEdit, TextEditor } from "vscode";
import { IDendronExtension } from "./dendronExtensionInterface";
import { ISchemaSyncService } from "./services/SchemaSyncServiceInterface";
import { WindowWatcher } from "./windowWatcher";
/**
 * See [[Workspace Watcher|dendron://dendron.docs/pkg.plugin-core.ref.workspace-watcher]] for more docs
 */
export declare class WorkspaceWatcher {
    /** The documents that have been opened during this session that have not been viewed yet in the editor. */
    private _openedDocuments;
    private _quickDebouncedOnDidChangeTextDocument;
    private _schemaSyncService;
    private _extension;
    private _windowWatcher;
    constructor({ schemaSyncService, extension, windowWatcher, }: {
        schemaSyncService: ISchemaSyncService;
        extension: IDendronExtension;
        windowWatcher: WindowWatcher;
    });
    __DO_NOT_USE_IN_PROD_exposePropsForTesting(): {
        onFirstOpen: (...args: any[]) => any;
    };
    activate(context: ExtensionContext): void;
    onDidSaveTextDocument(document: TextDocument): Promise<void>;
    /** This version of `onDidChangeTextDocument` is debounced for a shorter time, and is useful for UI updates that should happen quickly. */
    quickOnDidChangeTextDocument(event: TextDocumentChangeEvent): Promise<void>;
    onDidOpenTextDocument(document: TextDocument): void;
    /**
     * If note is in workspace, execute {@link onWillSaveNote}
     * @param event
     * @returns
     */
    onWillSaveTextDocument(event: TextDocumentWillSaveEvent): {
        changes: TextEdit[];
    };
    /**
     * When saving a note, do some book keeping
     * - update the `updated` time in frontmatter
     * - update the note metadata in the engine
     *
     * this method needs to be sync since event.WaitUntil can be called
     * in an asynchronous manner.
     * @param event
     * @returns
     */
    private onWillSaveNote;
    private onDidSaveNote;
    /** Do not use this function, please go to `WindowWatcher.onFirstOpen() instead.`
     *
     * Checks if the given document has been opened for the first time during this session, and marks the document as being processed.
     *
     * Certain actions (such as folding and adjusting the cursor) need to be done only the first time a document is opened.
     * While the `WorkspaceWatcher` sees when new documents are opened, the `TextEditor` is not active at that point, and we can not
     * perform these actions. This code allows `WindowWatcher` to check when an editor becomes active whether that editor belongs to an
     * newly opened document.
     *
     * Mind that this method is not idempotent, checking the same document twice will always return false for the second time.
     */
    private getNewlyOpenedDocument;
    /**
     * method to make modifications to the workspace before the file is renamed.
     * It updates all the references to the oldUri
     */
    onWillRenameFiles(args: FileWillRenameEvent): void;
    /**
     * method to make modifications to the workspace after the file is renamed.
     * It updates the title of the note wrt the new fname and refreshes tree view
     */
    onDidRenameFiles(args: FileRenameEvent): Promise<void>;
    /**
     * Dendron will perform changes like moving the cursor when first opening a Dendron note
     * @returns boolean : returns `true` if Dendron made changes during `onFirstOpen` and `false` otherwise
     */
    private onFirstOpen;
    static moveCursorPastFrontmatter(editor: TextEditor): void;
    private foldFrontmatter;
}
