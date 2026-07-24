/**
 * Shared accept-flow helpers for note/schema lookup providers.
 */
import { NoteQuickInput } from "@dendronhq/common-all";
import _ from "lodash";
import { CancellationTokenSource } from "vscode";
import { Logger } from "../../logger";
import { CREATE_NEW_LABEL, CREATE_NEW_WITH_TEMPLATE_LABEL } from "./constants";
import { OnAcceptHook } from "./LookupProviderV3Interface";
import {
  publishLookupCancel,
  publishLookupDone,
  publishLookupError,
} from "./lookupProviderHistory";
import { DendronQuickPickerV2, DendronQuickPickState } from "./types";
import { PickerUtilsV2 } from "./utils";

/**
 * When Create New is selected, keep fname in sync with the typed value
 * (debounce can leave them briefly out of sync).
 */
export function syncCreateNewFnameFromPickerValue(
  quickpick: DendronQuickPickerV2,
): void {
  if (
    quickpick.selectedItems.length === 1 &&
    [CREATE_NEW_LABEL, CREATE_NEW_WITH_TEMPLATE_LABEL].includes(
      quickpick.selectedItems[0]!.label,
    )
  ) {
    quickpick.selectedItems[0]!.fname = quickpick.value;
  }
}

/**
 * Run next vault picker when the provider requires it.
 * Returns false if the user cancelled vault selection.
 */
export async function maybeSelectVaultViaNextPicker(opts: {
  picker: DendronQuickPickerV2;
  selectedItems: readonly NoteQuickInput[];
  providerId: string;
  ctx: string;
}): Promise<boolean> {
  const { picker, selectedItems, providerId, ctx } = opts;
  if (
    !PickerUtilsV2.hasNextPicker(picker, {
      selectedItems,
      providerId,
    })
  ) {
    return true;
  }

  Logger.debug({ ctx, msg: "nextPicker:pre" });
  picker.state = DendronQuickPickState.PENDING_NEXT_PICK;

  picker.vault = await picker.nextPicker!({ note: selectedItems[0]! });
  if (_.isUndefined(picker.vault)) {
    publishLookupCancel(providerId);
    return false;
  }
  return true;
}

/**
 * Run on-accept hooks and publish done/error history events.
 */
export async function runAcceptHooksAndPublish(opts: {
  picker: DendronQuickPickerV2;
  selectedItems: NoteQuickInput[];
  providerId: string;
  onAcceptHooks: OnAcceptHook[];
  cancellationToken: CancellationTokenSource;
  noHidePickerOnAccept?: boolean;
  /** When true, set FULFILLED state before hide (note lookup). */
  setFulfilledState?: boolean;
}): Promise<void> {
  const {
    picker,
    selectedItems,
    providerId,
    onAcceptHooks,
    cancellationToken,
    noHidePickerOnAccept,
    setFulfilledState,
  } = opts;

  cancellationToken.cancel();

  if (!noHidePickerOnAccept) {
    if (setFulfilledState) {
      picker.state = DendronQuickPickState.FULFILLED;
    }
    picker.hide();
  }

  const onAcceptHookResp = await Promise.all(
    onAcceptHooks.map((hook) => hook({ quickpick: picker, selectedItems })),
  );
  const errors = _.filter(onAcceptHookResp, (ent) => ent.error);
  if (!_.isEmpty(errors)) {
    publishLookupError(providerId, errors[0]);
  } else {
    publishLookupDone({
      providerId,
      selectedItems,
      onAcceptHookData: _.map(onAcceptHookResp, (ent) => ent.data!),
    });
  }
}
