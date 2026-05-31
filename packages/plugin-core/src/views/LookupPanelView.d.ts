import { DMessage, LookupViewMessage } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { Disposable } from "vscode";
import { ILookupViewModel } from "../components/lookup/LookupViewModel";
/**
 * A view that handles the UI state for the Lookup Panel (the webview on a VS
 * Code side panel). This instantiates and then communicates with the React
 * based webview (the true _view_). This class is essentially a proxy for
 * plugin-core to the webview.
 */
export declare class LookupPanelView implements vscode.WebviewViewProvider, Disposable {
    private _view?;
    private _viewModel;
    private _disposables;
    constructor(viewModel: ILookupViewModel);
    dispose(): void;
    private bindToViewModel;
    postMessage(msg: DMessage): void;
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext<unknown>, _token: vscode.CancellationToken): Promise<void>;
    onDidReceiveMessageHandler(msg: LookupViewMessage): Promise<void>;
    private refresh;
}
