/**
 * Shared QuickPick provide() wiring (debounced update + accept) for
 * note and schema lookup providers.
 */
import _ from "lodash";
import { CancellationTokenSource } from "vscode";
import { Logger } from "../../logger";
import { OnUpdatePickerItemsOpts } from "./LookupProviderV3Interface";
import { DendronQuickPickerV2 } from "./types";

export type WireLookupProvideOpts = {
  quickpick: DendronQuickPickerV2;
  token: CancellationTokenSource;
  onUpdatePickerItems: (opts: OnUpdatePickerItemsOpts) => unknown;
  /** Invoked after debounce settle + optional empty-selection refresh. */
  onAccept: () => void;
  debounceMs?: number;
  /** Note uses trailing-only; schema uses leading + maxWait. */
  debounce: {
    leading: boolean;
    maxWait?: number;
  };
  /** Note flushes pending updates; schema cancels them. */
  onAcceptDebounce: "flush" | "cancel";
  beforeAccept?: (quickpick: DendronQuickPickerV2) => void;
  logCtx: string;
};

/**
 * Bind onDidChangeValue + onDidAccept with debounced picker updates.
 */
export function wireLookupProvide(opts: WireLookupProvideOpts): void {
  const {
    quickpick,
    token,
    onUpdatePickerItems,
    onAccept,
    debounceMs = 100,
    debounce: debounceOpts,
    onAcceptDebounce,
    beforeAccept,
    logCtx,
  } = opts;

  const onUpdateDebounced = _.debounce(
    () => {
      Logger.debug({ ctx: `${logCtx}.onUpdateDebounced`, msg: "enter" });
      const out = onUpdatePickerItems({
        picker: quickpick,
        token: token.token,
      } as OnUpdatePickerItemsOpts);
      Logger.debug({ ctx: `${logCtx}.onUpdateDebounced`, msg: "exit" });
      return out;
    },
    debounceMs,
    {
      leading: debounceOpts.leading,
      ...(debounceOpts.maxWait !== undefined
        ? { maxWait: debounceOpts.maxWait }
        : {}),
    }
  );

  quickpick.onDidChangeValue(onUpdateDebounced);

  quickpick.onDidAccept(async () => {
    Logger.info({
      ctx: `${logCtx}:onDidAccept`,
      msg: "enter",
      quickpick: quickpick.value,
    });

    if (onAcceptDebounce === "flush") {
      await onUpdateDebounced.flush();
    } else {
      onUpdateDebounced.cancel();
    }

    if (_.isEmpty(quickpick.selectedItems)) {
      Logger.debug({
        ctx: `${logCtx}:onDidAccept`,
        msg: "no selected items",
        quickpick: quickpick.value,
      });
      await onUpdatePickerItems({
        picker: quickpick,
        token: new CancellationTokenSource().token,
      });
    }

    beforeAccept?.(quickpick);
    onAccept();
  });
}
