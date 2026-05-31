import { FoundRefT } from "../utils/md";
import vscode from "vscode";
export type BacklinkFoundRef = FoundRefT & {
    parentBacklink: Backlink | undefined;
};
export declare enum BacklinkTreeItemType {
    /**
     * Tree item that represents a note, which may contain several backlinks to
     * the current note (1st level)
     */
    noteLevel = "noteLevel",
    /**
     * Tree item that represents a single backlink reference (2nd level)
     */
    referenceLevel = "referenceLevel"
}
export declare class Backlink extends vscode.TreeItem {
    readonly treeItemType: BacklinkTreeItemType;
    singleRef: FoundRefT | undefined;
    refs: BacklinkFoundRef[] | undefined;
    parentBacklink: Backlink | undefined;
    static createRefLevelBacklink(reference: FoundRefT): Backlink;
    static createNoteLevelBacklink(label: string, references: FoundRefT[]): Backlink;
    private constructor();
}
