import { EngineEventEmitter, NoteProps } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { TextEditor } from "vscode";
import { DendronExtension } from "../../workspace";
export declare class NoteGraphPanelFactory {
    private static _panel;
    private static _onEngineNoteStateChangedDisposable;
    private static _engineEvents;
    private static _ext;
    private static initWithNote;
    /**
     * These properties temporarily stores the graph theme and depth selected by user and is written
     * back to MetadataService once the panel is disposed.
     */
    private static defaultGraphTheme;
    private static graphDepth;
    static create(ext: DendronExtension, engineEvents: EngineEventEmitter): vscode.WebviewPanel;
    /**
     * Post message to the webview content.
     * @param note
     */
    static refresh(note: NoteProps, createStub?: boolean): Promise<any>;
    /**
     * If the user changes focus, then the newly in-focus Dendron note
     * should be shown in the graph.
     */
    static onOpenTextDocument(editor: TextEditor | undefined): Promise<void>;
}
