import { CalendarViewMessage, DendronTreeViewKey, DMessage, NoteProps } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
export declare class CalendarView implements vscode.WebviewViewProvider {
    static readonly viewType = DendronTreeViewKey.CALENDAR_VIEW;
    private _view?;
    private _extension;
    constructor(extension: IDendronExtension);
    postMessage(msg: DMessage): void;
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext<unknown>, _token: vscode.CancellationToken): Promise<void>;
    onDidReceiveMessageHandler(msg: CalendarViewMessage): Promise<void>;
    onActiveTextEditorChangeHandler(): Promise<void>;
    onOpenTextDocument(editor: vscode.TextEditor | undefined): Promise<void>;
    refresh(note?: NoteProps): Promise<void>;
}
