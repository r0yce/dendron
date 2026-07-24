/**
 * Dendron QuickPick factory helpers.
 * Extracted from PickerUtilsV2 for maintainability.
 */
import {
  DNodePropsQuickInputV2,
  NoteProps,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Uri, window } from "vscode";
import type { CreateQuickPickOpts } from "./LookupControllerV3Interface";
import { TabUtils } from "./TabUtils";
import { DendronQuickPickerV2, DendronQuickPickState } from "./types";

export function createDendronQuickPick(
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
  quickPick.showNote = async (uri: Uri) => {
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

export function createDendronQuickPickItem(
  opts: DNodePropsQuickInputV2
): DNodePropsQuickInputV2 {
  return {
    ...opts,
  };
}

export function createDendronQuickPickItemFromNote(
  opts: NoteProps
): DNodePropsQuickInputV2 {
  return {
    ...opts,
    label: opts.fname,
  };
}

export function getPickerValue(picker: DendronQuickPickerV2) {
  return picker.value;
}

export function getPickerSelection(
  picker: DendronQuickPickerV2
): DNodePropsQuickInputV2[] {
  return [...picker.selectedItems];
}
