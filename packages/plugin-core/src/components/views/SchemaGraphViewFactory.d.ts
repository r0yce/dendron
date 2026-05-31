import * as vscode from "vscode";
import { DendronExtension } from "../../workspace";
export declare class SchemaGraphViewFactory {
    private static _panel;
    private static _vsCodeCallback;
    static create(ext: DendronExtension): vscode.WebviewPanel;
}
