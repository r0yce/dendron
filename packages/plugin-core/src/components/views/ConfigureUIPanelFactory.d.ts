import * as vscode from "vscode";
import { DendronExtension } from "../../workspace";
export declare class ConfigureUIPanelFactory {
    private static panel;
    static create(ext: DendronExtension): vscode.WebviewPanel;
}
