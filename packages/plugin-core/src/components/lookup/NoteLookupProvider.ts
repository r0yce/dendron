/**
 * Note lookup QuickPick provider — update items, accept, hooks.
 *
 * Peeled helpers:
 * - empty qs → `noteLookupEmptyQuery`
 * - create-new rows → `noteLookupCreateNewItems` / `pickerCreateNewPolicy`
 * - schema completions → `noteLookupSchemaCompletions`
 * - accept vault/hooks → `lookupProviderAccept` / `lookupProviderHistory`
 */
import {
  LookupEvents,
  NoteLookupUtils,
  NoteQuickInput,
  NoteUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import _ from "lodash";
import { CancellationTokenSource, window } from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { WorkspaceModesService } from "../../services/WorkspaceModesService";
import { NotePickerUtils } from "./NotePickerUtils";
import { IDendronQuickInputButton } from "./ButtonTypes";
import {
  CREATE_NEW_LABEL,
  CREATE_NEW_NOTE_DETAIL,
  CREATE_NEW_WITH_TEMPLATE_LABEL,
} from "./constants";
import {
  ILookupProviderOptsV3,
  ILookupProviderV3,
  OnAcceptHook,
  OnUpdatePickerItemsOpts,
} from "./LookupProviderV3Interface";
import {
  maybeSelectVaultViaNextPicker,
  runAcceptHooksAndPublish,
  syncCreateNewFnameFromPickerValue,
} from "./lookupProviderAccept";
import { appendSchemaCompletions } from "./noteLookupSchemaCompletions";
import { appendCreateNewNoteItems } from "./noteLookupCreateNewItems";
import { fetchEmptyNoteQueryItems } from "./noteLookupEmptyQuery";
import { shouldRejectLookupItem } from "./pickerCreateNewPolicy";
import { DendronQuickPickerV2 } from "./types";
import { PickerUtilsV2 } from "./utils";

export class NoteLookupProvider implements ILookupProviderV3 {
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;
  private extension: IDendronExtension;

  constructor(
    public id: string,
    opts: ILookupProviderOptsV3,
    extension: IDendronExtension,
  ) {
    this.extension = extension;
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(opts: {
    quickpick: DendronQuickPickerV2;
    token: CancellationTokenSource;
    fuzzThreshold: number;
  }) {
    const ctx = "NoteLookupProvider.provide";
    Logger.info({ ctx, msg: "enter" });

    const { quickpick, token } = opts;
    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        const ctx = "NoteLookupProvider.onUpdateDebounced";
        Logger.debug({ ctx, msg: "enter" });
        const out = onUpdatePickerItems({
          picker: quickpick,
          token: token.token,
        } as OnUpdatePickerItemsOpts);
        Logger.debug({ ctx, msg: "exit" });
        return out;
      },
      100,
      {
        // Use trailing to make sure we get the latest letters typed by the user
        // before accepting.
        leading: false,
      },
    );
    quickpick.onDidChangeValue(onUpdateDebounced);

    quickpick.onDidAccept(async () => {
      const ctx = "quickpick:onDidAccept";
      Logger.info({
        ctx,
        msg: "enter",
        quickpick: quickpick.value,
      });
      await onUpdateDebounced.flush();
      if (_.isEmpty(quickpick.selectedItems)) {
        Logger.debug({
          ctx,
          msg: "no selected items",
          quickpick: quickpick.value,
        });
        await onUpdatePickerItems({
          picker: quickpick,
          token: new CancellationTokenSource().token,
        });
      }

      syncCreateNewFnameFromPickerValue(quickpick);
      this.onDidAccept({ quickpick, cancellationToken: token })();
    });
    Logger.info({ ctx, msg: "exit" });
    return;
  }

  shouldRejectItem(opts: { item: NoteQuickInput }) {
    return shouldRejectLookupItem(opts);
  }

  /**
   * Takes selection and runs accept, followed by hooks.
   */
  onDidAccept(opts: {
    quickpick: DendronQuickPickerV2;
    cancellationToken: CancellationTokenSource;
  }) {
    return async () => {
      const ctx = "NoteLookupProvider:onDidAccept";
      const { quickpick: picker, cancellationToken } = opts;

      picker.buttons.forEach((button) => {
        AnalyticsUtils.track(LookupEvents.LookupModifiersSetOnAccept, {
          command: this.id,
          type: (button as unknown as IDendronQuickInputButton).type,
          pressed: (button as unknown as IDendronQuickInputButton).pressed,
        });
      });

      let selectedItems = NotePickerUtils.getSelection(picker);
      const { preAcceptValidators } = this.opts;
      if (preAcceptValidators) {
        const isValid = preAcceptValidators.every((validator) => {
          return validator(selectedItems);
        });
        if (!isValid) return;
      }
      Logger.debug({
        ctx,
        selectedItems: selectedItems.map((item) => NoteUtils.toLogObj(item)),
      });
      // NOTE: if user presses <ENTER> before picker has a chance to process, this will be `[]`
      // In this case we want to calculate picker item from current value
      if (_.isEmpty(selectedItems)) {
        Logger.debug({
          ctx,
          msg: "no selected items, calculating from picker value",
          value: picker.value,
        });
        selectedItems = await NotePickerUtils.fetchPickerResultsNoInput({
          picker,
        });
        Logger.debug({
          ctx,
          msg: "selected items from picker value",
          selectedItems: selectedItems.map((item) => NoteUtils.toLogObj(item)),
        });
      }

      // validates fname.
      if (selectedItems.length === 1) {
        const item = selectedItems[0]!;
        const result = this.shouldRejectItem({ item });
        if (result.shouldReject) {
          window.showErrorMessage(result.reason);
          return;
        }
      }

      const vaultOk = await maybeSelectVaultViaNextPicker({
        picker,
        selectedItems,
        providerId: this.id,
        ctx,
      });
      if (!vaultOk) {
        return;
      }

      await runAcceptHooksAndPublish({
        picker,
        selectedItems,
        providerId: this.id,
        onAcceptHooks: this._onAcceptHooks,
        cancellationToken,
        ...(this.opts.noHidePickerOnAccept !== undefined
          ? { noHidePickerOnAccept: this.opts.noHidePickerOnAccept }
          : {}),
        setFulfilledState: true,
      });
    };
  }

  //  ^hlj1vvw48s2v
  async onUpdatePickerItems(opts: OnUpdatePickerItemsOpts) {
    const { picker, token, fuzzThreshold } = opts;
    const ctx = "NoteLookupProvider:updatePickerItems";
    picker.busy = true;
    let pickerValue = picker.value;
    const start = process.hrtime();

    // Just activated picker's have special behavior:
    //
    // We slice the postfix off until the first dot to show all results at the same
    // level so that when a user types `foo.one`, they will see all results in `foo.*`
    if (
      picker._justActivated &&
      !picker.nonInteractive &&
      !this.opts.forceAsIsPickerValueUsage
    ) {
      pickerValue = NoteLookupUtils.getQsForCurrentLevel(pickerValue);
    }

    const transformedQuery = NoteLookupUtils.transformQueryString({
      query: pickerValue,
      onlyDirectChildren: picker.showDirectChildrenOnly,
    });

    const queryOrig = NoteLookupUtils.slashToDot(picker.value);
    const ws = this.extension.getDWorkspace();
    let profile: number;
    const queryUpToLastDot =
      queryOrig.lastIndexOf(".") >= 0
        ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
        : undefined;

    const engine = ws.engine;
    Logger.debug({
      ctx,
      msg: "enter",
      queryOrig,
      justActivated: picker._justActivated,
      prevQuickpickValue: picker.prevQuickpickValue,
    });

    try {
      if (picker.value === picker.prevQuickpickValue) {
        if (!opts.forceUpdate) {
          Logger.debug({ ctx, msg: "picker value did not change" });
          return;
        }
      }

      if (picker.itemsFromSelection) {
        picker.items = picker.itemsFromSelection;
        if (picker.selectAll) {
          picker.selectedItems = picker.items;
        }
        return;
      }

      // if empty string, show all 1st level results
      if (transformedQuery.queryString === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        picker.items = await fetchEmptyNoteQueryItems({
          engine,
          extraItems: this.opts.extraItems,
        });
        return;
      }

      // initialize with current picker items without default items present
      const items: NoteQuickInput[] = [...picker.items];
      let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token?.isCancellationRequested) {
        return;
      }

      updatedItems = await NotePickerUtils.fetchPickerResults({
        picker,
        transformedQuery,
        originalQS: queryOrig,
      });

      // Vault focus scopes results; create-new rows always kept (see filterQuickPickItemsByFocus).
      updatedItems = WorkspaceModesService.filterQuickPickItemsByFocus(
        updatedItems,
        {
          alwaysKeepLabels: [CREATE_NEW_LABEL, CREATE_NEW_WITH_TEMPLATE_LABEL],
          alwaysKeepDetails: [CREATE_NEW_NOTE_DETAIL],
        },
      );

      if (token?.isCancellationRequested) {
        return;
      }

      // check if single item query, vscode doesn't surface single letter queries
      // we need this so that suggestions will show up
      // TODO: this might be buggy since we don't apply filter middleware
      if (
        picker.activeItems.length === 0 &&
        transformedQuery.queryString.length === 1
      ) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      // add schema completions for hierarchical paths
      {
        const { wsRoot, vaults } = this.extension.getDWorkspace();
        updatedItems = await appendSchemaCompletions({
          queryUpToLastDot,
          wasMadeFromWikiLink: !!transformedQuery.wasMadeFromWikiLink,
          engine,
          vault: PickerUtilsV2.getVaultForOpenEditor(),
          wsRoot,
          vaults,
          existingItems: updatedItems,
          originalQuery: transformedQuery.originalQuery,
        });
      }

      // filter the results through optional middleware
      if (picker.filterMiddleware) {
        updatedItems = picker.filterMiddleware(updatedItems);
      }

      // if new notes are allowed and we didn't get a perfect match, append Create New
      // NOTE: order matters. we always pick the first item in single select mode
      Logger.debug({ ctx, msg: "active != qs" });
      updatedItems = appendCreateNewNoteItems({
        updatedItems,
        queryOrig,
        allowNewNote: !!this.opts.allowNewNote,
        allowNewNoteWithTemplate: !!this.opts.allowNewNoteWithTemplate,
        canSelectMany: !!picker.canSelectMany,
        wasMadeFromWikiLink: !!transformedQuery.wasMadeFromWikiLink,
        vaultCount: this.extension.getDWorkspace().engine.vaults.length,
        onCreateDefined: picker.onCreate !== undefined,
        config: ws.config,
      });

      // check fuzz threshold. tune fuzzyness. currently hardcoded
      // TODO: in the future this should be done in the engine
      if (fuzzThreshold === 1) {
        updatedItems = updatedItems.filter((ent) => ent.fname === picker.value);
      }

      // We do NOT want quick pick to filter out items since it does not match with FuseJS.
      updatedItems.forEach((item) => {
        item.alwaysShow = true;
      });

      picker.items = updatedItems;
    } catch (err: unknown) {
      window.showErrorMessage(String(err));
      throw err instanceof Error ? err : new Error(String(err), { cause: err });
    } finally {
      profile = getDurationMilliseconds(start);
      picker.busy = false;
      picker._justActivated = false;
      picker.prevValue = picker.value;
      picker.prevQuickpickValue = picker.value;
      Logger.info({
        ctx,
        msg: "exit",
        queryOrig,
        profile,
        numItems: picker.items.length,
        cancelled: token?.isCancellationRequested,
      });
      AnalyticsUtils.track(VSCodeEvents.NoteLookup_Update, {
        duration: profile,
      });
    }
  }

  registerOnAcceptHook(hook: OnAcceptHook) {
    this._onAcceptHooks.push(hook);
  }
}
