/**
 * Initialize LookupViewModel from pressed QuickPick buttons.
 * Extracted from LookupControllerV3 for maintainability.
 */
import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { ButtonType, DendronBtn } from "./ButtonTypes";
import { ILookupViewModel } from "./LookupViewModel";
import { VaultSelectionMode } from "./types";

function getButtonFromArray(type: ButtonType, buttons: DendronBtn[]) {
  return _.find(buttons, (value) => value.type === type);
}

/**
 *  Adjust View State based on what the initial button state is
 */
export function initializeViewStateFromButtons(opts: {
  buttons: DendronBtn[];
  viewModel: ILookupViewModel;
}): void {
  const { buttons, viewModel } = opts;

  if (
    getButtonFromArray(LookupSelectionTypeEnum.selection2Items, buttons)
      ?.pressed
  ) {
    viewModel.selectionState.value = LookupSelectionTypeEnum.selection2Items;
  } else if (
    getButtonFromArray(LookupSelectionTypeEnum.selection2link, buttons)?.pressed
  ) {
    viewModel.selectionState.value = LookupSelectionTypeEnum.selection2link;
  } else if (
    getButtonFromArray(LookupSelectionTypeEnum.selectionExtract, buttons)
      ?.pressed
  ) {
    viewModel.selectionState.value = LookupSelectionTypeEnum.selectionExtract;
  }

  if (getButtonFromArray(LookupNoteTypeEnum.scratch, buttons)?.pressed) {
    viewModel.nameModifierMode.value = LookupNoteTypeEnum.scratch;
  } else if (
    getButtonFromArray(LookupNoteTypeEnum.journal, buttons)?.pressed
  ) {
    viewModel.nameModifierMode.value = LookupNoteTypeEnum.journal;
  } else if (getButtonFromArray(LookupNoteTypeEnum.task, buttons)?.pressed) {
    viewModel.nameModifierMode.value = LookupNoteTypeEnum.task;
  }

  viewModel.vaultSelectionMode.value = getButtonFromArray(
    "selectVault",
    buttons
  )?.pressed
    ? VaultSelectionMode.alwaysPrompt
    : VaultSelectionMode.smart;

  viewModel.isMultiSelectEnabled.value = !!getButtonFromArray(
    "multiSelect",
    buttons
  )?.pressed;

  viewModel.isCopyNoteLinkEnabled.value = !!getButtonFromArray(
    "copyNoteLink",
    buttons
  )?.pressed;

  viewModel.isApplyDirectChildFilter.value = !!getButtonFromArray(
    "directChildOnly",
    buttons
  )?.pressed;

  viewModel.isSplitHorizontally.value = !!getButtonFromArray(
    "horizontal",
    buttons
  )?.pressed;
}
