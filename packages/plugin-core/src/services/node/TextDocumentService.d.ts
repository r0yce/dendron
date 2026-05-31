import { NoteProps } from "@dendronhq/common-all";
import { Disposable, Event, TextDocument, TextDocumentChangeEvent } from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ITextDocumentService } from "../ITextDocumentService";
/**
 * This service keeps client state note state synchronized with the engine
 * state. It also exposes an event that allows callback functionality whenever
 * the engine has finished updating a note state. See {@link ITextDocumentService}
 * See [[Note Sync Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for
 * additional docs
 */
export declare class TextDocumentService implements ITextDocumentService {
    private L;
    _textDocumentEventHandle: Disposable;
    _extension: IDendronExtension;
    /**
     *
     * @param ext Instance of IDendronExtension
     * @param textDocumentEvent - Event returning TextDocument, such as
     * vscode.workspace.OnDidSaveTextDocument. This call is not debounced
     */
    constructor(ext: IDendronExtension, textDocumentEvent: Event<TextDocument>);
    dispose(): void;
    private updateNoteContents;
    /**
     * Callback function for vscode.workspace.OnDidSaveTextDocument. Updates note with contents from document and saves to engine
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
    __DO_NOT_USE_IN_PROD_exposePropsForTesting(): {
        onDidSave: (document: TextDocument) => Promise<NoteProps | undefined>;
    };
}
