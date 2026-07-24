/**
 * Tear down note lookup controller / history / context.
 */
import { HistoryService } from "@dendronhq/engine-server";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { DendronContext } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";

export function cleanupNoteLookup(opts: {
  controller: ILookupControllerV3 | undefined;
  clearController: () => void;
  historyProviderId?: string;
}): void {
  const ctx = "NoteLookupCommand:cleanup";
  Logger.debug({ ctx, msg: "enter" });
  if (opts.controller) {
    opts.controller.onHide();
  }
  opts.clearController();
  HistoryService.instance().remove(
    opts.historyProviderId ?? "lookup",
    "lookupProvider",
  );
  VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
}
