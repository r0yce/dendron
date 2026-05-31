import { DendronEditorViewKey, DendronTreeViewKey } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
export declare class WebViewUtils {
    /**
     * Get root uri where web view assets are store
     * When running in development, this is in the build folder of `dendron-plugin-views`
     * @returns
     */
    static getViewRootUri(): vscode.Uri;
    static getJsAndCss(): {
        jsSrc: vscode.Uri;
        cssSrc: vscode.Uri;
    };
    static getLocalResourceRoots(context: vscode.ExtensionContext): vscode.Uri[];
    /**
     *
     * @param panel: required to convert asset URLs to VSCode Webview Extension format
     * @returns
     */
    static getWebviewContent({ name, jsSrc, cssSrc, port, wsRoot, panel, initialTheme, }: {
        name: string;
        jsSrc: vscode.Uri;
        cssSrc: vscode.Uri;
        port: number;
        wsRoot: string;
        panel: vscode.WebviewPanel | vscode.WebviewView;
        initialTheme?: string;
    }): Promise<string>;
    static prepareTreeView({ ext, key, webviewView, }: {
        ext: IDendronExtension;
        key: DendronTreeViewKey;
        webviewView: vscode.WebviewView;
    }): Promise<void>;
    /**
     * @deprecated Use `{@link WebviewUtils.getWebviewContent}`
     * @param param0
     * @returns
     */
    static genHTMLForView: ({ title, view, }: {
        title: string;
        view: DendronTreeViewKey | DendronEditorViewKey;
    }) => Promise<string>;
    static genHTMLForTreeView: ({ title, view, }: {
        title: string;
        view: DendronTreeViewKey;
    }) => Promise<string>;
    static genHTMLForWebView: ({ title, view, }: {
        title: string;
        view: DendronEditorViewKey;
    }) => Promise<string>;
    /** Opens the given panel, and measures how long it stays open.
     *
     * Call this function **before** you open the panel with `panel.reveal()`.
     * This function will open the panel for you.
     *
     * @param panel The panel, must not have been opened yet.
     * @param onClose A callback that will run once the webview is closed. The duration given is in milliseconds.
     */
    static openWebviewAndMeasureTimeOpen(panel: vscode.WebviewPanel, onClose: (duration: number) => void): void;
}
