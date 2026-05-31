import * as vscode from "vscode";
export declare class StartupPrompts {
    static showLapsedUserMessageIfNecessary(opts: {
        assetUri: vscode.Uri;
    }): Promise<void>;
    static shouldDisplayLapsedUserMsg(): boolean;
    static showLapsedUserMessage(assetUri: vscode.Uri): Promise<void>;
}
