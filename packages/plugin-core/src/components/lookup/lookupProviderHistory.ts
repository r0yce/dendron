/**
 * HistoryService publish helpers for lookup providers (note + schema).
 */
import { HistoryService } from "@dendronhq/engine-server";
import { NoteQuickInput } from "@dendronhq/common-all";

export function publishLookupCancel(providerId: string) {
  HistoryService.instance().add({
    source: "lookupProvider",
    action: "done",
    id: providerId,
    data: { cancel: true },
  });
}

export function publishLookupError(providerId: string, error: unknown) {
  HistoryService.instance().add({
    source: "lookupProvider",
    action: "error",
    id: providerId,
    data: { error },
  });
}

export function publishLookupDone<T>(opts: {
  providerId: string;
  selectedItems: NoteQuickInput[];
  onAcceptHookData: T[];
}) {
  HistoryService.instance().add({
    source: "lookupProvider",
    action: "done",
    id: opts.providerId,
    data: {
      selectedItems: opts.selectedItems,
      onAcceptHookResp: opts.onAcceptHookData,
    },
  });
}
