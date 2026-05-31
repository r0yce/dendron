import { DendronTreeViewKey, GraphViewMessage, NoteProps } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
export declare class GraphPanel implements vscode.WebviewViewProvider {
    static readonly viewType = DendronTreeViewKey.GRAPH_PANEL;
    private _view?;
    private _ext;
    private _graphDepth;
    private _showBacklinks;
    private _showOutwardLinks;
    private _showHierarchy;
    constructor(extension: IDendronExtension);
    get graphDepth(): number | undefined;
    set graphDepth(depth: number | undefined);
    get showBacklinks(): boolean | undefined;
    set showBacklinks(displayBacklinks: boolean | undefined);
    get showOutwardLinks(): boolean | undefined;
    set showOutwardLinks(displayOutwardLinks: boolean | undefined);
    get showHierarchy(): boolean | undefined;
    set showHierarchy(displayHierarchy: boolean | undefined);
    private postMessage;
    increaseGraphDepth(): void;
    decreaseGraphDepth(): void;
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext<unknown>, _token: vscode.CancellationToken): Promise<void>;
    onDidReceiveMessageHandler(msg: GraphViewMessage): Promise<void>;
    onActiveTextEditorChangeHandler(): Promise<void>;
    onOpenTextDocument(editor: vscode.TextEditor | undefined): Promise<void>;
    refresh(note?: NoteProps, createStub?: boolean): Promise<void>;
}
