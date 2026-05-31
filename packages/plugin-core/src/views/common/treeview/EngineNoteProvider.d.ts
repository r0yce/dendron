import { EngineEventEmitter, type ReducedDEngine, TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import { Disposable, Event, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import { URI } from "vscode-uri";
import { type ITreeViewConfig } from "./ITreeViewConfig";
/**
 * Provides engine event data to generate the views for the native Tree View
 */
export declare class EngineNoteProvider implements TreeDataProvider<string>, Disposable {
    private wsRoot;
    private engine;
    private _engineEvents;
    private _treeViewConfig;
    private _onDidChangeTreeDataEmitter;
    private _onEngineNoteStateChangedDisposable;
    private _tree;
    /**
     * Signals to vscode UI engine that the tree view needs to be refreshed.
     */
    readonly onDidChangeTreeData: Event<string | undefined | void>;
    private setLabelContext;
    /**
     *
     * @param engineEvents - specifies when note state has been changed on the
     * engine
     */
    constructor(wsRoot: URI, engine: ReducedDEngine, _engineEvents: EngineEventEmitter, _treeViewConfig: ITreeViewConfig);
    /**
     * Changes the appearance of the labels in the tree view
     * @param opts
     * @returns
     */
    updateLabelType(opts: {
        labelType: TreeViewItemLabelTypeEnum;
    }): void;
    /**
     * This method should be called prior to calling treeView.reveal(noteId) -
     * this is to ensure that the ancestral chain is present in the tree view's
     * node cache so that the targeted node can be properly revealed in the tree.
     * @param noteId
     */
    prepNodeForReveal(noteId: string): Promise<void>;
    getParent(noteId: string): ProviderResult<string>;
    getChildren(noteId?: string): ProviderResult<string[]>;
    getTreeItem(noteProps: string): TreeItem;
    dispose(): void;
    private setupSubscriptions;
    private addChildrenOfNoteToCache;
    private addParentOfNoteToCache;
    private createTreeNote;
    private createTreeNoteFromProps;
    /**
     *  Derived from common-all's sortNotesAtLevel
     * @param param0
     * @returns
     */
    private sortNotesAtLevel;
}
