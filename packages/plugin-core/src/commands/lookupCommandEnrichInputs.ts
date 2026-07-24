/**
 * Shared HistoryService subscribe + showQuickPick wait for lookup commands.
 */
import { DendronError, ErrorFactory } from "@dendronhq/common-all";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { ILookupProviderV3 } from "../components/lookup/LookupProviderV3Interface";
import {
  DendronQuickPickerV2,
  DendronQuickPickState,
} from "../components/lookup/types";
import { Logger } from "../logger";

export type LookupEnrichGather = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean | undefined;
  fuzzThreshold?: number | undefined;
};

type DoneData = {
  selectedItems: readonly any[];
  cancel?: boolean;
};

/**
 * Note-lookup style enrich: hide cancels only when not pending next pick / fulfilled.
 * Unexpected events clean up without resolving (legacy).
 */
export async function enrichNoteLookupInputs<TResult>(opts: {
  historyId: string;
  gather: LookupEnrichGather;
  logCtx: string;
  logger: { error: (payload: any) => void };
  onCleanup: () => void;
  mapDone: (data: DoneData) => TResult;
}): Promise<TResult | undefined> {
  const { historyId, gather, logCtx, logger, onCleanup, mapDone } = opts;

  return new Promise((resolve) => {
    let promiseResolve = resolve;
    HistoryService.instance().subscribev2("lookupProvider", {
      id: historyId,
      listener: async (event) => {
        if (event.action === "done") {
          const data = event.data as DoneData;
          if (data.cancel) {
            onCleanup();
            promiseResolve(undefined);
            return;
          }
          promiseResolve(mapDone(data));
        } else if (event.action === "changeState") {
          const data = event.data as { action?: string };
          if (data.action === "hide") {
            Logger.debug({
              ctx: logCtx,
              subscribers: HistoryService.instance().subscribersv2,
            });
            if (
              !_.includes(
                [
                  DendronQuickPickState.PENDING_NEXT_PICK,
                  DendronQuickPickState.FULFILLED,
                ],
                gather.quickpick.state,
              )
            ) {
              onCleanup();
              promiseResolve(undefined);
            }
          }
          return;
        } else if (event.action === "error") {
          const error = event.data.error as DendronError;
          logger.error({ error });
          onCleanup();
          promiseResolve(undefined);
        } else {
          const error = ErrorFactory.createUnexpectedEventError({ event });
          logger.error({ error });
          onCleanup();
          // legacy: no resolve on unexpected
        }
      },
    });

    gather.controller.showQuickPick({
      provider: gather.provider,
      quickpick: gather.quickpick,
      nonInteractive: gather.noConfirm,
      fuzzThreshold: gather.fuzzThreshold,
    });
  });
}

/**
 * Schema-lookup style enrich: simpler hide cancel; always remove history on event.
 */
export async function enrichSchemaLookupInputs<TResult>(opts: {
  historyId: string;
  gather: LookupEnrichGather;
  logCtx: string;
  logger: { error: (payload: any) => void; info?: (payload: any) => void };
  mapDone: (data: DoneData) => TResult;
}): Promise<TResult | undefined> {
  const { historyId, gather, logCtx, logger, mapDone } = opts;

  return new Promise((resolve) => {
    HistoryService.instance().subscribev2("lookupProvider", {
      id: historyId,
      listener: async (event) => {
        try {
          if (event.action === "done") {
            const data = event.data as DoneData;
            if (data.cancel) {
              resolve(undefined);
            } else {
              resolve(mapDone(data));
            }
          } else if (event.action === "error") {
            const error = event.data.error as DendronError;
            logger.error({ error });
            resolve(undefined);
          } else if (
            event.data &&
            event.action === "changeState" &&
            event.data.action === "hide"
          ) {
            logger.info?.({
              ctx: logCtx,
              msg: `changeState.hide event received.`,
            });
            resolve(undefined);
          } else {
            const error = ErrorFactory.createUnexpectedEventError({ event });
            logger.error({ error });
          }
        } finally {
          HistoryService.instance().remove(historyId, "lookupProvider");
        }
      },
    });

    gather.controller.showQuickPick({
      provider: gather.provider,
      quickpick: gather.quickpick,
      nonInteractive: gather.noConfirm,
    });
  });
}
