/**
 * Lookup picker utilities (PickerUtilsV2 + free helpers).
 *
 * Peeled modules (import from here or directly):
 * - `pickerCreateNew.ts` — shouldBubbleUpCreateNew
 * - `pickerSort.ts` — sortBySimilarity
 *
 * Prefer extracting more vault-picker helpers here before growing this file.
 */
/* eslint-disable no-dupe-class-members */
import {
  DendronError,
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DNoteLoc,
  DVault,
  NoteProps,
  NoteQuickInput,
  OrderedMatcher,
  RenameNoteOpts,
  RespV2,
  TransformedQueryString,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _, { orderBy } from "lodash";
import path from "path";
import { QuickPickItem, TextEditor, Uri, ViewColumn, window } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronBtn, getButtonCategory } from "./ButtonTypes";
import {
  CREATE_NEW_LABEL,
  CREATE_NEW_NOTE_DETAIL,
  MORE_RESULTS_LABEL,
} from "./constants";
import type { CreateQuickPickOpts } from "./LookupControllerV3Interface";
import { OnAcceptHook } from "./LookupProviderV3Interface";
import { TabUtils } from "./TabUtils";
import {
  DendronQuickPickerV2,
  DendronQuickPickState,
  VaultSelectionMode,
} from "./types";
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
  getOrPromptVaultForNewNote,
  getVaultRecommendations,
  promptVault,
} from "./pickerVault";

export const UPDATET_SOURCE = {
  UPDATE_PICKER_FILTER: "UPDATE_PICKER_FILTER",
};

// Vault Recommendation Detail Descriptions
export const CONTEXT_DETAIL = "current note context";
export const HIERARCHY_MATCH_DETAIL = "hierarchy match";
export const FULL_MATCH_DETAIL = "hierarchy match and current note context";

export type VaultPickerItem = { vault: DVault; label: string } & Partial<
  Omit<QuickPickItem, "label">
>;

export function isDVaultArray(
  overrides?: VaultPickerItem[] | DVault[]
): overrides is DVault[] {
  return _.some(
    overrides,
    (item) => (item as VaultPickerItem).vault === undefined
  );
}

export function createNoActiveItem(vault: DVault): DNodePropsQuickInputV2 {
  const props = DNodeUtils.create({
    fname: CREATE_NEW_LABEL,
    type: "note",
    vault,
  });
  return {
    ...props,
    label: CREATE_NEW_LABEL,
    detail: CREATE_NEW_NOTE_DETAIL,
    alwaysShow: true,
  };
}

export function createMoreResults(): DNodePropsQuickInputV2 {
  // Sentinel "more results" partial for lookup UI (intentionally incomplete vs full DNodePropsQuickInputV2). Cast documented per final burn (2026-06-01); no bare @ts. (Legacy pattern shared with NotePickerUtils sentinels.)
  return {
    label: MORE_RESULTS_LABEL,
    detail: "",
    alwaysShow: true,
  } as DNodePropsQuickInputV2;
}

export function node2Uri(node: DNodeProps): Uri {
  const ext = node.type === "note" ? ".md" : ".yml";
  const nodePath = node.fname + ext;
  const { wsRoot } = ExtensionProvider.getDWorkspace();
  const vault = node.vault;
  const vpath = vault2Path({ wsRoot, vault });
  return Uri.file(path.join(vpath, nodePath));
}

export async function showDocAndHidePicker(
  uris: Uri[],
  picker: DendronQuickPickerV2
) {
  const ctx = "showDocAndHidePicker";
  const maybeSplitSelection = _.find(picker.buttons, (ent: DendronBtn) => {
    return getButtonCategory(ent) === "split" && ent.pressed;
  });
  let viewColumn = ViewColumn.Active;
  if (maybeSplitSelection) {
    const splitType = (maybeSplitSelection as DendronBtn).type;
    if (splitType === "horizontal") {
      viewColumn = ViewColumn.Beside;
    } else {
      // TODO: close current button
      // await commands.executeCommand("workbench.action.splitEditorDown");
    }
  }

  await Promise.all(
    uris.map(async (uri) => {
      return window.showTextDocument(uri, { viewColumn }).then(
        () => {
          Logger.info({ ctx, msg: "showTextDocument", fsPath: uri.fsPath });
          picker.hide();
          return;
        },
        (err) => {
          Logger.error({ ctx, error: err, msg: "exit" });
          throw err;
        }
      );
    })
  );
  return uris;
}

export type OldNewLocation = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc & { note?: NoteProps };
};

export type NewLocation = {
  newLoc: DNoteLoc & { note?: NoteProps };
};

export class ProviderAcceptHooks {
  /**
   * Returns current location and new location for note
   * @param param0
   * @returns
   */
  static oldNewLocationHook: OnAcceptHook = async ({
    quickpick,
    selectedItems,
  }): Promise<RespV2<OldNewLocation>> => {
    // setup vars
    const oldVault = PickerUtilsV2.getVaultForOpenEditor();
    const newVault = quickpick.vault ? quickpick.vault : oldVault;
    const engine = ExtensionProvider.getEngine();

    // get old note
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const oldUri: Uri = editor.document.uri;
    const oldFname = DNodeUtils.fname(oldUri.fsPath);

    const selectedItem = selectedItems[0]!;
    const fname = PickerUtilsV2.isCreateNewNotePickedForSingle(selectedItem)
      ? quickpick.value
      : selectedItem.fname;

    // get new note
    const newNote = (await engine.findNotesMeta({ fname, vault: newVault }))[0];
    const isStub = newNote?.stub;
    if (newNote && !isStub) {
      const vaultName = VaultUtils.getName(newVault);
      const errMsg = `${vaultName}/${quickpick.value} exists`;
      window.showErrorMessage(errMsg);
      return {
        error: new DendronError({ message: errMsg }),
      };
    }
    const data: RenameNoteOpts = {
      oldLoc: {
        fname: oldFname,
        vaultName: VaultUtils.getName(oldVault),
      },
      newLoc: {
        fname: quickpick.value,
        vaultName: VaultUtils.getName(newVault),
      },
    };
    return { data, error: null };
  };

  static NewLocationHook: OnAcceptHook = async ({
    quickpick,
  }): Promise<RespV2<NewLocation>> => {
    const activeEditorVault = PickerUtilsV2.getVaultForOpenEditor();
    const newVault = quickpick.vault ? quickpick.vault : activeEditorVault;

    const data = {
      newLoc: {
        fname: quickpick.value,
        vaultName: VaultUtils.getName(newVault),
      },
    };

    return { data, error: null };
  };
}

export class PickerUtilsV2 {
  static createDendronQuickPick(
    opts: CreateQuickPickOpts
  ): DendronQuickPickerV2 {
    const { title, placeholder, ignoreFocusOut, initialValue } = _.defaults(
      opts,
      {
        ignoreFocusOut: true,
      }
    );
    const quickPick =
      window.createQuickPick<DNodePropsQuickInputV2>() as DendronQuickPickerV2;
    quickPick.title = title;
    quickPick.state = DendronQuickPickState.IDLE;
    quickPick.nonInteractive = opts.nonInteractive;
    quickPick.placeholder = placeholder;
    quickPick.ignoreFocusOut = ignoreFocusOut;
    quickPick._justActivated = true;
    quickPick.canSelectMany = false;
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;
    quickPick.sortByLabel = false;
    quickPick.showNote = async (uri) => {
      let viewColumn;

      // if current tab is a preview, open note in a different view
      if (TabUtils.tabAPIAvailable()) {
        const allTabGroups = TabUtils.getAllTabGroups();
        const activeTabGroup = allTabGroups.activeTabGroup;
        if (
          activeTabGroup.activeTab &&
          TabUtils.isPreviewTab(activeTabGroup.activeTab)
        ) {
          const nonPreviewTabGroup = _.find(
            allTabGroups.all,
            (tb) => tb.viewColumn !== activeTabGroup.viewColumn
          );
          if (nonPreviewTabGroup) {
            viewColumn = nonPreviewTabGroup.viewColumn;
          }
        }
      }
      return window.showTextDocument(
        uri,
        viewColumn !== undefined ? { viewColumn } : undefined
      );
    };
    if (initialValue !== undefined) {
      quickPick.rawValue = initialValue;
      quickPick.prefix = initialValue;
      quickPick.value = initialValue;
    }
    return quickPick;
  }

  static createDendronQuickPickItem(
    opts: DNodePropsQuickInputV2
  ): DNodePropsQuickInputV2 {
    return {
      ...opts,
    };
  }

  static createDendronQuickPickItemFromNote(
    opts: NoteProps
  ): DNodePropsQuickInputV2 {
    return {
      ...opts,
      label: opts.fname,
    };
  }

  static getValue(picker: DendronQuickPickerV2) {
    return picker.value;
  }

  static getSelection(picker: DendronQuickPickerV2): DNodePropsQuickInputV2[] {
    return [...picker.selectedItems];
  }

  static filterCreateNewItem = filterCreateNewItem;
  static filterDefaultItems = filterDefaultItems;
  static filterByDepth = filterByDepth;
  /** Reject all items that are stubs */
  static filterNonStubs = filterNonStubs;

  static getFnameForOpenEditor(): string | undefined {
    const activeEditor = VSCodeUtils.getActiveTextEditor();
    if (activeEditor) {
      return path.basename(activeEditor.document.fileName, ".md");
    }
    return;
  }

  /**
   * Defaults to first vault if current note is not part of a vault
   * @returns
   */
  static getVaultForOpenEditor(fsPath?: string): DVault {
    const ctx = "getVaultForOpenEditor";
    const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();

    let vault: DVault;
    const activeDocument = VSCodeUtils.getActiveTextEditor()?.document;
    const fpath = fsPath || activeDocument?.uri.fsPath;
    if (
      fpath &&
      WorkspaceUtils.isPathInWorkspace({
        wsRoot,
        vaults,
        fpath,
      })
    ) {
      Logger.info({ ctx, activeDocument: fpath });
      vault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath: fpath,
      });
    } else {
      Logger.info({ ctx, msg: "no active doc" });
      vault = vaults[0]!;
    }
    // TODO: remove
    Logger.info({ ctx, msg: "exit", vault });
    return vault;
  }

  /** @deprecated use `getVaultForOpenEditor` instead, this function no longer prompts anything. */
  static getOrPromptVaultForOpenEditor(): DVault {
    return PickerUtilsV2.getVaultForOpenEditor();
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
    }
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
    overrides?: VaultPickerItem[]
  ): Promise<DVault | undefined>;
  public static async promptVault(
    overrides?: VaultPickerItem[] | DVault[]
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

function countDots(subStr: string) {
  return Array.from(subStr).filter((ch) => ch === ".").length;
}

function sortForQueryEndingWithDot(
  transformedQuery: TransformedQueryString,
  itemsToFilter: NoteProps[]
) {
  const lowercaseQuery = transformedQuery.originalQuery.toLowerCase();

  // If the user enters the query 'data.' we want to keep items that have 'data.'
  // and sort the results in the along the following order:
  //
  // ```
  // data.driven                  (data. has clean-match, grandchild-free, 1st in hierarchy)
  // level1.level2.data.integer   (data. has clean-match, grandchild-free, 3rd in hierarchy)
  // l1.l2.l3.data.bool           (data. has clean-match, grandchild-free, 4th in hierarchy)
  // l1.with-data.and-child       (data. has partial match 2nd level)
  // l1.l2.with-data.and-child    (data. has partial match 3rd level)
  // level1.level2.data.integer.has-grandchild
  // l1.l2.with-data.and-child.has-grandchild
  // data.stub (Stub notes come at the end).
  // ```

  const itemsWithMetadata = itemsToFilter
    .map((item) => {
      // Firstly pre-process the items in attempt to find the match.
      const lowercaseFName = item.fname.toLowerCase();
      const matchIndex = lowercaseFName.indexOf(lowercaseQuery);
      return { matchIndex, item };
    })
    // Filter out items without a match.
    .filter((item) => item.matchIndex !== -1)
    // Filter out items where the match is at the end (match does not have children)
    .filter(
      (item) =>
        !(item.matchIndex + lowercaseQuery.length === item.item.fname.length)
    )
    .map((item) => {
      // Meaning the match takes up entire level of the hierarchy.
      // 'one.two-hi.three'->'two-hi.' is clean match while 'o-hi.' is a
      // match but not a clean one.
      const isCleanMatch =
        item.matchIndex === 0 ||
        item.item.fname.charAt(item.matchIndex - 1) === ".";

      const dotsBeforeMatch = countDots(
        item.item.fname.substring(0, item.matchIndex)
      );
      const dotsAfterMatch = countDots(
        item.item.fname.substring(item.matchIndex + lowercaseQuery.length)
      );
      const isStub = item.item.stub;
      const zeroGrandchildren = dotsAfterMatch === 0;
      return {
        isStub,
        dotsBeforeMatch,
        dotsAfterMatch,
        zeroGrandchildren,
        isCleanMatch,
        ...item,
      };
    });

  const sortOrder: { fieldName: string; order: "asc" | "desc" }[] = [
    { fieldName: "isStub", order: "desc" },
    { fieldName: "zeroGrandchildren", order: "desc" },
    { fieldName: "isCleanMatch", order: "desc" },
    { fieldName: "dotsAfterMatch", order: "asc" },
    { fieldName: "dotsBeforeMatch", order: "asc" },
  ];

  return orderBy(
    itemsWithMetadata,
    sortOrder.map((it) => it.fieldName),
    sortOrder.map((it) => it.order)
  ).map((item) => item.item);
}

export const filterPickerResults = ({
  itemsToFilter,
  transformedQuery,
}: {
  itemsToFilter: NoteProps[];
  transformedQuery: TransformedQueryString;
}): NoteProps[] => {
  // If we have specific vault name within the query then keep only those results
  // that match the specific vault name.
  if (transformedQuery.vaultName) {
    itemsToFilter = itemsToFilter.filter(
      (item) => VaultUtils.getName(item.vault) === transformedQuery.vaultName
    );
  }

  // Ending the query with a dot adds special processing of showing matched descendents.
  if (transformedQuery.originalQuery.endsWith(".")) {
    itemsToFilter = sortForQueryEndingWithDot(transformedQuery, itemsToFilter);
  }

  if (transformedQuery.splitByDots && transformedQuery.splitByDots.length > 0) {
    const matcher = new OrderedMatcher(transformedQuery.splitByDots);

    itemsToFilter = itemsToFilter.filter((item) => matcher.isMatch(item.fname));
  }

  if (transformedQuery.wasMadeFromWikiLink) {
    // If we are dealing with a wiki link we want to show only the exact matches
    // for the link instead some fuzzy/partial matches.
    itemsToFilter = itemsToFilter.filter(
      (item) => item.fname === transformedQuery.queryString
    );
  }

  return itemsToFilter;
};

// Re-export peeled helpers (stable import path: components/lookup/utils)
export { shouldBubbleUpCreateNew } from "./pickerCreateNew";
export { sortBySimilarity } from "./pickerSort";

