import { DendronEditorViewKey, DendronTreeViewKey } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { URI } from "vscode-uri";
/**
 * Forked version of WebViewUtils that works in the web ext.
 * TODO: Consolidate back
 */
export declare class WebViewUtils {
    private wsRoot;
    private port;
    private extensionUri;
    constructor(wsRoot: URI, port: number, extensionUri: URI);
    private getAssetUri;
    private getClientAPIRootUrl;
    /**
     * Get root uri where web view assets are store
     * When running in development, this is in the build folder of `dendron-plugin-views`
     * @returns
     */
    getViewRootUri(): URI;
    getJsAndCss(): {
        jsSrc: vscode.Uri;
        cssSrc: vscode.Uri;
    };
    getLocalResourceRoots(): URI[];
    /**
     *
     * @param panel: required to convert asset URLs to VSCode Webview Extension format
     * @returns
     */
    getWebviewContent({ name, jsSrc, cssSrc, panel, initialTheme, }: {
        name: string;
        jsSrc: vscode.Uri;
        cssSrc: vscode.Uri;
        panel: vscode.WebviewPanel | vscode.WebviewView;
        initialTheme?: string;
    }): Promise<string>;
    prepareTreeView({ key, webviewView, }: {
        key: DendronTreeViewKey;
        webviewView: vscode.WebviewView;
    }): Promise<void>;
    /**
     * @deprecated Use `{@link WebviewUtils.getWebviewContent}`
     * @param param0
     * @returns
     */
    genHTMLForView: ({ title, view, }: {
        title: string;
        view: DendronTreeViewKey | DendronEditorViewKey;
    }) => Promise<string>;
    /**
     *
     * @param param0
     * @returns
     */
    private genVSCodeHTMLIndex;
}
