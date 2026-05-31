import * as vscode from "vscode";
/**
 * Gets the workspace root of the currently opened folder(s) or workspace in VS Code
 * @returns
 */
export declare function getWSRoot(): Promise<vscode.Uri | undefined>;
/**
 * Go to dirname that {fname} is contained in, going in (deeper into tree) from base.
 * @param maxLvl Default 3, how deep to go down in the file tree. Keep in mind that the tree gets wider and this search becomes exponentially more expensive the deeper we go.
 * @param returnDirPath - return path to directory, default: false
 *
 * One warning: this will not search into folders starting with `.` to avoid searching through things like the `.git` folder.
 */
export declare function findDownTo(opts: {
    base: vscode.Uri;
    fname: string;
    maxLvl?: number;
    returnDirPath?: boolean;
}): Promise<vscode.Uri | undefined>;
