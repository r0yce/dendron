/**
 * Lookup picker utilities (PickerUtilsV2 + re-exports).
 *
 * Peeled modules (import from here or directly):
 * - `pickerCreateNew` / `pickerSort` / `pickerFilters` / `pickerVault`
 * - `pickerQuickPick` / `pickerEditorContext` / `pickerFilterResults`
 * - `pickerSentinels` / `pickerDisplay` / `providerAcceptHooks`
 */
/* eslint-disable no-dupe-class-members */
import {
  DEngineClient,
  DNodePropsQuickInputV2,
  DVault,
  NoteProps,
  NoteQuickInput,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  filterByDepth,
  filterCreateNewItem,
  filterDefaultItems,
  filterNonStubs,
  getCreateNewItem,
  getQueryUpToLastDot,
  isCreateNewNotePicked,
  isCreateNewNotePickedForSingle,
  isCreateNewNoteWithTemplatePicked,
  isInputEmpty,
} from "./pickerFilters";
import {
  getFnameForOpenEditor,
  getVaultForOpenEditor,
} from "./pickerEditorContext";
import {
  createDendronQuickPick,
  createDendronQuickPickItem,
  createDendronQuickPickItemFromNote,
  getPickerSelection,
  getPickerValue,
} from "./pickerQuickPick";
import {
  getOrPromptVaultForNewNote,
  getVaultRecommendations,
  promptVault,
  VaultPickerItem,
  isDVaultArray,
} from "./pickerVault";
import { DendronQuickPickerV2, VaultSelectionMode } from "./types";

export const UPDATET_SOURCE = {
  UPDATE_PICKER_FILTER: "UPDATE_PICKER_FILTER",
};

// Vault Recommendation Detail Descriptions (re-export pure constants)
export {
  CONTEXT_DETAIL,
  FULL_MATCH_DETAIL,
  HIERARCHY_MATCH_DETAIL,
} from "./vaultPickerConstants";

export type { VaultPickerItem };
export { isDVaultArray };

export { createNoActiveItem, createMoreResults } from "./pickerSentinels";
export { node2Uri, showDocAndHidePicker } from "./pickerDisplay";
export { filterPickerResults } from "./pickerFilterResults";
export type { OldNewLocation, NewLocation } from "./providerAcceptHooks";
export { ProviderAcceptHooks } from "./providerAcceptHooks";
export { shouldBubbleUpCreateNew } from "./pickerCreateNew";
export { sortBySimilarity } from "./pickerSort";

export class PickerUtilsV2 {
  static createDendronQuickPick = createDendronQuickPick;
  static createDendronQuickPickItem = createDendronQuickPickItem;
  static createDendronQuickPickItemFromNote =
    createDendronQuickPickItemFromNote;
  static getValue = getPickerValue;
  static getSelection = getPickerSelection;

  static filterCreateNewItem = filterCreateNewItem;
  static filterDefaultItems = filterDefaultItems;
  static filterByDepth = filterByDepth;
  /** Reject all items that are stubs */
  static filterNonStubs = filterNonStubs;

  static getFnameForOpenEditor = getFnameForOpenEditor;
  static getVaultForOpenEditor = getVaultForOpenEditor;

  /** @deprecated use `getVaultForOpenEditor` instead, this function no longer prompts anything. */
  static getOrPromptVaultForOpenEditor(): DVault {
    return getVaultForOpenEditor();
  }

  static getQueryUpToLastDot = getQueryUpToLastDot;
  static getCreateNewItem = getCreateNewItem;

  /**
   * Check if this picker still has further pickers
   */
  static hasNextPicker = (
    quickpick: DendronQuickPickerV2,
    opts: {
      selectedItems: readonly DNodePropsQuickInputV2[];
      providerId: string;
    },
  ): quickpick is Required<DendronQuickPickerV2> => {
    const { selectedItems, providerId } = opts;
    const nextPicker = quickpick.nextPicker;
    const isNewPick = isCreateNewNotePicked(selectedItems[0]!);
    const isNewPickAllowed = ["lookup", "dendron.moveHeader"];
    return (
      !_.isUndefined(nextPicker) &&
      (isNewPickAllowed.includes(providerId) ? isNewPick : true)
    );
  };

  static isCreateNewNotePickedForSingle = isCreateNewNotePickedForSingle;
  static isCreateNewNotePicked = isCreateNewNotePicked;
  static isCreateNewNoteWithTemplatePicked = isCreateNewNoteWithTemplatePicked;
  static isInputEmpty = isInputEmpty;

  public static async getOrPromptVaultForNewNote(opts: {
    vault: DVault;
    fname: string;
    vaultSelectionMode?: VaultSelectionMode;
  }): Promise<DVault | undefined> {
    return getOrPromptVaultForNewNote(opts);
  }

  public static promptVault(overrides?: DVault[]): Promise<DVault | undefined>;
  public static promptVault(
    overrides?: VaultPickerItem[],
  ): Promise<DVault | undefined>;
  public static async promptVault(
    overrides?: VaultPickerItem[] | DVault[],
  ): Promise<DVault | undefined> {
    return promptVault(overrides as any);
  }

  static async getVaultRecommendations(opts: {
    vault: DVault;
    vaults: DVault[];
    engine: DEngineClient;
    fname: string;
  }): Promise<VaultPickerItem[]> {
    return getVaultRecommendations(opts);
  }

  static resetPaginationOpts(picker: DendronQuickPickerV2) {
    delete picker.moreResults;
    delete picker.offset;
    delete picker.allResults;
  }

  static noteQuickInputToNote(item: NoteQuickInput): NoteProps {
    const props: NoteProps = _.omit(item, "label", "detail", "alwaysShow");
    return props;
  }
}
