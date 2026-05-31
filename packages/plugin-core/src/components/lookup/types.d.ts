import { DNodePropsQuickInputV2, DNodeProps, NoteProps, DVault, NoteQuickInput } from "@dendronhq/common-all";
import { QuickPick, TextEditor, Uri } from "vscode";
import { DendronBtn } from "./ButtonTypes";
export type FilterQuickPickFunction = (items: NoteQuickInput[]) => NoteQuickInput[];
type ModifyPickerValueFunc = (value?: string) => {
    noteName: string;
    prefix: string;
};
type SelectionProcessFunc = (note: NoteProps) => Promise<NoteProps | undefined>;
type CopyNoteLinkFunc = (items: NoteProps[]) => Promise<void> | undefined;
export declare enum DendronQuickPickState {
    /**
     * Default state
     */
    IDLE = "IDLE",
    /**
     * Finished taking request
     */
    FULFILLED = "FULFILLED",
    /**
     * About to show a new picker. Old picker will be hidden but we are still gathering further input
     */
    PENDING_NEXT_PICK = "PENDING_NEXT_PICK"
}
export type DendronQuickPickItemV2 = QuickPick<DNodePropsQuickInputV2>;
export type DendronQuickPickerV2 = DendronQuickPickItemV2 & {
    _justActivated?: boolean | undefined;
    /**
     * Quickpick will hide results that aren't matched by VSCode internal filter.
     * Setting this true will always show ALL results that lookup returns
     */
    alwaysShowAll?: boolean | undefined;
    state: DendronQuickPickState;
    /**
     * Buttons control modifiers for lookup
     */
    buttons: DendronBtn[];
    nonInteractive?: boolean | undefined;
    prev?: {
        activeItems: any;
        items: any;
    } | undefined;
    /**
     * Used by {@link DendronBtn} to store tmp state
     */
    prevValue?: string | undefined;
    /**
     * Previous value in quickpick
     */
    prevQuickpickValue?: string | undefined;
    /**
     * Value before being modified
     */
    rawValue: string;
    prefix: string;
    noteModifierValue?: string | undefined;
    selectionModifierValue?: string | undefined;
    onCreate?: ((note: DNodeProps) => Promise<DNodeProps | undefined>) | undefined;
    showDirectChildrenOnly?: boolean | undefined;
    offset?: number | undefined;
    moreResults?: boolean | undefined;
    allResults?: DNodeProps[] | undefined;
    /**
     * Should VSCode managing sorting of results?
     * Supported in VSCode but not added to the type definition files, see https://github.com/microsoft/vscode/issues/73904#issuecomment-680298036
     */
    sortByLabel?: boolean | undefined;
    /**
     * Vault for newly created note. If not specified in picker,
     * will be prmpted
     */
    vault?: DVault | undefined;
    /**
     * Filter results through filter middleware
     */
    filterMiddleware?: FilterQuickPickFunction | undefined;
    /**
     * Modify picker value
     */
    modifyPickerValueFunc?: ModifyPickerValueFunc | undefined;
    /**
     * Method to process selected text in active note.
     */
    selectionProcessFunc?: SelectionProcessFunc | undefined;
    /**
     *
     */
    itemsFromSelection?: DNodePropsQuickInputV2[] | undefined;
    /**
     * select all when quickpick is created and canSelectMany
     * NOTE: this is only used with multiSelect + selection2Items
     */
    selectAll?: boolean | undefined;
    /**
     * Method to copy note link
     */
    copyNoteLinkFunc?: CopyNoteLinkFunc | undefined;
    /**
     * Should show a subsequent picker?
     */
    nextPicker?: ((opts: any) => any) | undefined;
    /**
     * TODO: should be required
     */
    showNote?: ((uri: Uri) => Promise<TextEditor>) | undefined;
};
export declare enum VaultSelectionMode {
    /**
     * Never prompt the user. Useful for testing
     */
    auto = 0,
    /**
     * Tries to determine the vault automatically, but will prompt the user if
     * there is ambiguity
     */
    smart = 1,
    /**
     * Always prompt the user if there is more than one vault
     */
    alwaysPrompt = 2
}
export {};
