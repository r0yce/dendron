import { DendronTreeViewKey, DMessage } from "@dendronhq/common-all";
import * as vscode from "vscode";
export declare class SampleView implements vscode.WebviewViewProvider {
    static readonly viewType = DendronTreeViewKey.SAMPLE_VIEW;
    private _view?;
    postMessage(msg: DMessage): void;
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): Promise<void>;
    private _getHtmlForWebview;
}
