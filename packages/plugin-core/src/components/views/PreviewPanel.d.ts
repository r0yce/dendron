import { NoteProps } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ITextDocumentService } from "../../services/ITextDocumentService";
import { IPreviewLinkHandler } from "./IPreviewLinkHandler";
import { PreviewProxy } from "./PreviewProxy";
/**
 * This is the default implementation of PreviewProxy. It contains a singleton
 * of a vscode webviewPanel that renders the note preview. Furthermore, it will
 * automatically handle event subscriptions to know when to update the preview,
 * as well as properly dispose of the resources when the preview has been
 * closed.
 */
export declare class PreviewPanel implements PreviewProxy, vscode.Disposable {
    private _ext;
    private _panel;
    private _textDocumentService;
    private _onDidChangeActiveTextEditor;
    private _onTextChanged;
    private _linkHandler;
    private _lockedEditorNoteId;
    /**
     *
     * @param param0 extension - IDendronExtension implementation. linkHandler -
     * Implementation to handle preview link clicked events
     */
    constructor({ extension, linkHandler, textDocumentService, }: {
        extension: IDendronExtension;
        linkHandler: IPreviewLinkHandler;
        textDocumentService: ITextDocumentService;
    });
    /**
     * Show the preview.
     * @param note - if specified, this will override the preview contents with
     * the contents specified in this parameter. Otherwise, the contents of the
     * preview will follow default behavior (it will show the currently in-focus
     * Dendron note).
     */
    show(note?: NoteProps): Promise<void>;
    hide(): void;
    lock(noteId?: string): Promise<void>;
    unlock(): void;
    isOpen(): boolean;
    isVisible(): boolean;
    isLocked(): boolean;
    /**
     * If the Preview is locked and the active note does not match the locked note.
     */
    isLockedAndDirty(): Promise<boolean>;
    dispose(): void;
    private setupCallbacks;
    /** Rewrites the image URLs to use VSCode's webview URIs, which is required to
     * access files from the preview.
     *
     * The results of this is cached based on the note content hash, so repeated
     * calls should not be excessively expensive.
     */
    private rewriteImageUrls;
    /**
     * Notify preview webview panel to display latest contents
     *
     * @param panel panel to notify
     * @param note note to display
     * @param isFullRefresh If true, sync contents of note with what's being seen in active editor.
     * This will be true in cases where user switches between tabs or opens/closes notes without saving, as contents of notes may not match engine notes.
     * Otherwise display contents of note
     */
    private sendRefreshMessage;
    private sendLockMessage;
    /**
     * If panel is visible, update preview panel with text document changes
     */
    private updatePreviewPanel;
    private initWithNote;
    __DO_NOT_USE_IN_PROD_exposePropsForTesting(): {
        rewriteImageUrls: (note: NoteProps) => {
            body: string;
            id: string;
            title: string;
            desc: string;
            updated: number;
            created: number;
            config?: import("@dendronhq/common-all").NoteLocalConfig;
            fname: string;
            links: import("@dendronhq/common-all").DLink[];
            anchors: {
                [index: string]: import("@dendronhq/common-all").DNoteAnchorPositioned | undefined;
            };
            type: import("@dendronhq/common-all").DNodeType;
            stub?: boolean;
            schemaStub?: boolean;
            parent: import("@dendronhq/common-all").DNodePointer | null;
            children: import("@dendronhq/common-all").DNodePointer[];
            data: any;
            custom?: any;
            schema?: {
                moduleId: string;
                schemaId: string;
            } | undefined;
            vault: import("@dendronhq/common-all").DVault;
            contentHash?: string | undefined;
            color?: string | undefined;
            tags?: string | string[] | undefined;
            image?: import("@dendronhq/common-all").DNodeImage | undefined;
            traits?: string[];
        };
    };
}
