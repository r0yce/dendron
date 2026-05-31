import { DEngineClient, DNodeProps, DNodePropsQuickInputV2, DNoteLoc, DVault, NoteProps, NoteQuickInput, TransformedQueryString } from "@dendronhq/common-all";
import { QuickPickItem, Uri } from "vscode";
import type { CreateQuickPickOpts } from "./LookupControllerV3Interface";
import { OnAcceptHook } from "./LookupProviderV3Interface";
import { DendronQuickPickerV2, VaultSelectionMode } from "./types";
export declare const UPDATET_SOURCE: {
    UPDATE_PICKER_FILTER: string;
};
export declare const CONTEXT_DETAIL = "current note context";
export declare const HIERARCHY_MATCH_DETAIL = "hierarchy match";
export declare const FULL_MATCH_DETAIL = "hierarchy match and current note context";
export type VaultPickerItem = {
    vault: DVault;
    label: string;
} & Partial<Omit<QuickPickItem, "label">>;
export declare function createNoActiveItem(vault: DVault): DNodePropsQuickInputV2;
export declare function createMoreResults(): DNodePropsQuickInputV2;
export declare function node2Uri(node: DNodeProps): Uri;
export declare function showDocAndHidePicker(uris: Uri[], picker: DendronQuickPickerV2): Promise<Uri[]>;
export type OldNewLocation = {
    oldLoc: DNoteLoc;
    newLoc: DNoteLoc & {
        note?: NoteProps;
    };
};
export type NewLocation = {
    newLoc: DNoteLoc & {
        note?: NoteProps;
    };
};
export declare class ProviderAcceptHooks {
    /**
     * Returns current location and new location for note
     * @param param0
     * @returns
     */
    static oldNewLocationHook: OnAcceptHook;
    static NewLocationHook: OnAcceptHook;
}
export declare class PickerUtilsV2 {
    static createDendronQuickPick(opts: CreateQuickPickOpts): DendronQuickPickerV2;
    static createDendronQuickPickItem(opts: DNodePropsQuickInputV2): DNodePropsQuickInputV2;
    static createDendronQuickPickItemFromNote(opts: NoteProps): DNodePropsQuickInputV2;
    static getValue(picker: DendronQuickPickerV2): string;
    static getSelection(picker: DendronQuickPickerV2): DNodePropsQuickInputV2[];
    static filterCreateNewItem: (items: DNodePropsQuickInputV2[]) => DNodePropsQuickInputV2[];
    static filterDefaultItems: (items: DNodePropsQuickInputV2[]) => DNodePropsQuickInputV2[];
    /**
     * Reject all items that are over a given level
     * @param items
     * @param lvl
     */
    static filterByDepth: (items: DNodePropsQuickInputV2[], depth: number) => DNodePropsQuickInputV2[];
    /** Reject all items that are stubs */
    static filterNonStubs(items: DNodePropsQuickInputV2[]): DNodePropsQuickInputV2[];
    static getFnameForOpenEditor(): string | undefined;
    /**
     * Defaults to first vault if current note is not part of a vault
     * @returns
     */
    static getVaultForOpenEditor(fsPath?: string): DVault;
    /** @deprecated use `getVaultForOpenEditor` instead, this function no longer prompts anything. */
    static getOrPromptVaultForOpenEditor(): DVault;
    static getQueryUpToLastDot: (query: string) => string;
    static getCreateNewItem: (items: readonly DNodePropsQuickInputV2[]) => DNodePropsQuickInputV2 | undefined;
    /**
     * Check if this picker still has further pickers
     */
    static hasNextPicker: (quickpick: DendronQuickPickerV2, opts: {
        selectedItems: readonly DNodePropsQuickInputV2[];
        providerId: string;
    }) => quickpick is Required<DendronQuickPickerV2>;
    static isCreateNewNotePickedForSingle(node: DNodePropsQuickInputV2): boolean;
    static isCreateNewNotePicked(node: DNodePropsQuickInputV2): boolean;
    static isCreateNewNoteWithTemplatePicked(node: DNodePropsQuickInputV2): boolean;
    static isInputEmpty(value?: string): value is undefined;
    static getOrPromptVaultForNewNote({ vault, fname, vaultSelectionMode, }: {
        vault: DVault;
        fname: string;
        vaultSelectionMode?: VaultSelectionMode;
    }): Promise<DVault | undefined>;
    static promptVault(overrides?: DVault[]): Promise<DVault | undefined>;
    static promptVault(overrides?: VaultPickerItem[]): Promise<DVault | undefined>;
    /**
     * Determine which vault(s) are the most appropriate to create this note in.
     * Vaults determined as better matches appear earlier in the returned array
     * @param
     * @returns
     */
    static getVaultRecommendations({ vault, vaults, engine, fname, }: {
        vault: DVault;
        vaults: DVault[];
        engine: DEngineClient;
        fname: string;
    }): Promise<VaultPickerItem[]>;
    static resetPaginationOpts(picker: DendronQuickPickerV2): void;
    static noteQuickInputToNote(item: NoteQuickInput): NoteProps;
}
export declare const filterPickerResults: ({ itemsToFilter, transformedQuery, }: {
    itemsToFilter: NoteProps[];
    transformedQuery: TransformedQueryString;
}) => NoteProps[];
/** This function presumes that 'CreateNew' should be shown and determines whether
 *  CreateNew should be at the top of the look up results or not. */
export declare function shouldBubbleUpCreateNew({ numberOfExactMatches, querystring, bubbleUpCreateNew, }: {
    numberOfExactMatches: number;
    querystring: string;
    bubbleUpCreateNew?: boolean;
}): boolean;
/**
 * Sorts the given candidates notes by similarity to the query string in
 * descending order (the most similar come first) */
export declare function sortBySimilarity(candidates: NoteProps[], query: string): NoteProps[];
