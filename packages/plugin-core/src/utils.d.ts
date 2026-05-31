import ogs from "open-graph-scraper";
import * as vscode from "vscode";
export declare class DisposableStore {
    private _toDispose;
    add(dis: vscode.Disposable): void;
    dispose(): void;
}
export declare const clipboard: vscode.Clipboard;
export declare const showMessage: {
    info: typeof vscode.window.showInformationMessage;
    warning: typeof vscode.window.showWarningMessage;
};
export declare const getOpenGraphMetadata: (opts: ogs.Options) => Promise<ogs.SuccessResult | ogs.ErrorResult>;
