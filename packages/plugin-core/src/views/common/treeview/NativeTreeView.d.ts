import "reflect-metadata";
import { TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import { Disposable } from "vscode";
import { EngineNoteProvider } from "./EngineNoteProvider";
import { WSUtilsWeb } from "../../../web/utils/WSUtils";
/**
 * Class managing the vscode native version of the Dendron tree view - this is
 * the side panel UI that gives a tree view of the Dendron note hierarchy
 */
export declare class NativeTreeView implements Disposable {
    private _provider;
    private wsUtils;
    private treeView;
    private _handler;
    private _updateLabelTypeHandler;
    private _getExpandableTreeItemsHandler;
    constructor(_provider: EngineNoteProvider, wsUtils: WSUtilsWeb);
    dispose(): void;
    /**
     * Creates the Tree View and shows it in the UI (registers with vscode.window)
     */
    show(): Promise<void>;
    updateLabelType(opts: {
        labelType: TreeViewItemLabelTypeEnum;
    }): void;
    expandAll(): Promise<void>;
    expandTreeItem(id: string): Promise<void>;
    /**
     * Whenever a new note is opened, we move the tree view focus to the newly
     * opened note.
     * @param editor
     * @returns
     */
    private onOpenTextDocument;
}
