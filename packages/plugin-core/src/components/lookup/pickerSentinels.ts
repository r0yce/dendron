/**
 * Sentinel QuickPick items for lookup (Create New / More Results).
 */
import {
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
} from "@dendronhq/common-all";
import {
  CREATE_NEW_LABEL,
  CREATE_NEW_NOTE_DETAIL,
  MORE_RESULTS_LABEL,
} from "./constants";

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
