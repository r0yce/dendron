import { DLogger, DVault, NoteProps, ReducedDEngine, URI } from "@dendronhq/common-all";
import { Disposable, Event, TextDocument, TextDocumentChangeEvent } from "vscode";
import { ITextDocumentService } from "../ITextDocumentService";
/**
 * This version of TextDocumentService is specific to Web Ext and has the
 * following limitations before feature parity:
 *  - does not call refreshNoteLinksAndAnchors
 *
 * This service keeps client state note state synchronized with the engine
 * state. It also exposes an event that allows callback functionality whenever
 * the engine has finished updating a note state. See
 * {@link ITextDocumentService} See [[Note Sync
 * Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for
 * additional docs
 */
export declare class TextDocumentService implements ITextDocumentService {
    private wsRoot;
    private vaults;
    private engine;
    private L;
    _textDocumentEventHandle: Disposable;
    constructor(textDocumentEvent: Event<TextDocument>, wsRoot: URI, vaults: DVault[], engine: ReducedDEngine, L: DLogger);
    dispose(): void;
    private updateNoteContents;
    /**
     * Callback function for vscode.workspace.OnDidSaveTextDocument. Updates note
     * with contents from document and saves to engine
     * @param document
     * @returns
     */
    private onDidSave;
    /**
     * See {@link ITextDocumentService.processTextDocumentChangeEvent}
     */
    processTextDocumentChangeEvent(event: TextDocumentChangeEvent): Promise<NoteProps | undefined>;
    /**
     * See {@link ITextDocumentService.applyTextDocumentToNoteProps}
     */
    applyTextDocumentToNoteProps(note: NoteProps, textDocument: TextDocument): Promise<NoteProps>;
    /**
     * Returns true if textDocument contains frontmatter. False otherwise.
     */
    static containsFrontmatter(textDocument: TextDocument): boolean;
    private getFrontmatterPosition;
    private noteContentChanged;
    private point2VSCodePosition;
}
