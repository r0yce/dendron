import * as vscode from "vscode";
/**
 * video formats are supported above vscode version 1.71. For users below this version,
 * we render gif in welcome page
 */
export declare enum WelcomePageMedia {
    "gif" = "gif",
    "video" = "video"
}
export declare function showWelcome(assetUri: vscode.Uri): void;
