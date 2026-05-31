import * as vscode from "vscode";
import { IFeatureShowcaseMessage } from "../showcase/IFeatureShowcaseMessage";
/**
 * Side Panel webview that shows the tip of the day
 * TODO: Add functionality
 *  - let user rotate tips
 */
export default class TipOfTheDayWebview implements vscode.WebviewViewProvider {
    private _webview;
    private _tips;
    private _curTipIndex;
    private BUTTON_CLICKED_MSG;
    private TIP_SHOWN_MSG;
    private get _currentTip();
    /**
     * The set of tips to show the user.
     * @param tips
     */
    constructor(tips: IFeatureShowcaseMessage[]);
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext<unknown>, _token: vscode.CancellationToken): void;
    private showNextTip;
    /**
     * TODO: add some functionality to allow users to show a new time / prev tip.
     */
    private getContent;
}
