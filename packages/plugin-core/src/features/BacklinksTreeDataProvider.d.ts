import { BacklinkPanelSortOrder, DendronConfig, EngineEventEmitter } from "@dendronhq/common-all";
import { CancellationToken, Disposable, Event, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import { Backlink } from "./Backlink";
/**
 * Provides the data to support the backlinks tree view panel
 */
export default class BacklinksTreeDataProvider implements TreeDataProvider<Backlink>, Disposable {
    private readonly MAX_LINES_OF_CONTEX̣T;
    private readonly FRONTMATTER_TAG_CONTEXT_PLACEHOLDER;
    private _onDidChangeTreeDataEmitter;
    private _onEngineNoteStateChangedDisposable;
    private _onDidChangeActiveTextEditorDisposable;
    private _engineEvents;
    private _sortOrder;
    readonly _isLinkCandidateEnabled: boolean | undefined;
    /**
     * Signals to vscode UI engine that the backlinks view needs to be refreshed.
     */
    readonly onDidChangeTreeData: Event<Backlink | undefined | void>;
    /**
     *
     * @param engineEvents - specifies when note state has been changed on the
     * engine
     */
    constructor(engineEvents: EngineEventEmitter, config: DendronConfig);
    /**
     * How items are sorted in the backlink panel
     */
    get sortOrder(): BacklinkPanelSortOrder;
    /**
     * Update the sort order of the backlinks panel. This will also save the
     * update into metadata service for persistence.
     */
    set sortOrder(sortOrder: BacklinkPanelSortOrder);
    getTreeItem(element: Backlink): Backlink;
    getParent(element: Backlink): ProviderResult<Backlink>;
    getChildren(element?: Backlink): Promise<Backlink[]>;
    /**
     * Implementing this method allows us to asynchronously calculate hover
     * contents ONLY when the user actually hovers over an item. Lazy loading this
     * data allows us to speed up the initial load time of the backlinks panel.
     * @param _item
     * @param element
     * @param _token
     * @returns
     */
    resolveTreeItem(_item: TreeItem, element: Backlink, _token: CancellationToken): ProviderResult<TreeItem>;
    dispose(): void;
    private setupSubscriptions;
    /**
     * Tells VSCode to refresh the backlinks view. Debounced to fire every 250 ms
     */
    private refreshBacklinks;
    /**
     * Takes found references corresponding to a single note and turn them into
     * TreeItems
     * @param refs list of found references (for a single note)
     * @param fsPath fsPath of current note
     * @param parent parent backlink of these refs.
     * @returns list of TreeItems of found references
     */
    private getAllBacklinksInNoteFromRefs;
    /**
     * Return the array of notes that have backlinks to the current note ID as
     * Backlink TreeItem objects
     * @param noteId - note ID for which to get backlinks for
     * @param isLinkCandidateEnabled
     * @param sortOrder
     * @returns
     */
    private getAllBacklinkedNotes;
    private shallowFirstPathSort;
    /**
     * This tooltip will return a markdown string that has several components:
     * 1. A header section containing title, created, and updated times
     * 2. A concatenated list of references with some lines of surrounding context
     *    for each one.
     * @param references
     * @returns
     */
    private getTooltipForNoteLevelTreeItem;
    private getSurroundingContextForRef;
}
