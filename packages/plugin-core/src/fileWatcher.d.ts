import { DVault, WorkspaceOpts } from "@dendronhq/common-all";
import { FileWatcherAdapter } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { Logger } from "./logger";
export declare class FileWatcher {
    watchers: {
        vault: DVault;
        watcher: FileWatcherAdapter;
    }[];
    /**
     * Should watching be paused
     */
    pause: boolean;
    L: typeof Logger;
    constructor(opts: {
        workspaceOpts: WorkspaceOpts;
    });
    static watcherType(opts: WorkspaceOpts): "plugin" | "engine";
    activate(context: vscode.ExtensionContext): void;
    onDidCreate(fsPath: string): Promise<void>;
    onDidDelete(fsPath: string): Promise<void>;
}
export declare class PluginFileWatcher implements FileWatcherAdapter {
    private watcher;
    constructor(pattern: vscode.GlobPattern);
    onDidCreate(callback: (filePath: string) => void): vscode.Disposable;
    onDidDelete(callback: (filePath: string) => void): vscode.Disposable;
    onDidChange(callback: (filePath: string) => void): vscode.Disposable;
}
