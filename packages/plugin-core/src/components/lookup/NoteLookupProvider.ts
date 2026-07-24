import {
  ConfigUtils,
  LookupEvents,
  NoteLookupUtils,
  NoteQuickInput,
  NoteUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { CancellationTokenSource, window } from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
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
  NoteLookupProviderSuccessResp,
  OnAcceptHook,
  OnUpdatePickerItemsOpts,
} from "./LookupProviderV3Interface";
import { appendSchemaCompletions } from "./noteLookupSchemaCompletions";
import {
  countExactFnameMatches,
  shouldAddCreateNewOption,
  shouldRejectLookupItem,
} from "./pickerCreateNewPolicy";
import { DendronQuickPickerV2, DendronQuickPickState } from "./types";
import {
  OldNewLocation,
  PickerUtilsV2,
  shouldBubbleUpCreateNew,
} from "./utils";
import { WorkspaceModesService } from "../../services/WorkspaceModesService";

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

      // NOTE: sometimes, even with debouncing, the value of a new item is not the same as the selectedItem. this makes sure that the value is in sync
      if (
        quickpick.selectedItems.length === 1 &&
        [CREATE_NEW_LABEL, CREATE_NEW_WITH_TEMPLATE_LABEL].includes(
          quickpick.selectedItems[0]!.label,
        )
      ) {
        quickpick.selectedItems[0]!.fname = quickpick.value;
      }
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
   * @param opts
   * @returns
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

      // when doing lookup, opening existing notes don't require vault picker
      if (
        PickerUtilsV2.hasNextPicker(picker, {
          selectedItems,
          providerId: this.id,
        })
      ) {
        Logger.debug({ ctx, msg: "nextPicker:pre" });
        picker.state = DendronQuickPickState.PENDING_NEXT_PICK;

        picker.vault = await picker.nextPicker!({ note: selectedItems[0]! });
        // check if we exited from selecting a vault
        if (_.isUndefined(picker.vault)) {
          HistoryService.instance().add({
            source: "lookupProvider",
            action: "done",
            id: this.id,
            data: { cancel: true },
          });
          return;
        }
      }
      // last chance to cancel
      cancellationToken.cancel();

      if (!this.opts.noHidePickerOnAccept) {
        picker.state = DendronQuickPickState.FULFILLED;
        picker.hide();
      }
      const onAcceptHookResp = await Promise.all(
        this._onAcceptHooks.map((hook) =>
          hook({ quickpick: picker, selectedItems }),
        ),
      );
      const errors = _.filter(onAcceptHookResp, (ent) => ent.error);
      if (!_.isEmpty(errors)) {
        HistoryService.instance().add({
          source: "lookupProvider",
          action: "error",
          id: this.id,
          data: { error: errors[0] },
        });
      } else {
        HistoryService.instance().add({
          source: "lookupProvider",
          action: "done",
          id: this.id,
          data: {
            selectedItems,
            onAcceptHookResp: _.map(onAcceptHookResp, (ent) => ent.data!),
          } as NoteLookupProviderSuccessResp<OldNewLocation>,
        });
      }
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
        let items = await NotePickerUtils.fetchRootQuickPickResults({
          engine,
        });
        // Sprint 5: vault focus scopes lookup roots
        items = WorkspaceModesService.filterNotesByFocus(items as any) as any;
        const extraItems = this.opts.extraItems;
        if (extraItems) {
          items.unshift(...extraItems);
        }
        picker.items = items;
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

      // if new notes are allowed and we didn't get a perfect match, append `Create New` option
      // to picker results
      // NOTE: order matters. we always pick the first item in single select mode
      Logger.debug({ ctx, msg: "active != qs" });

      // If each of the vaults in the workspace already have exact match of the file name
      // then we should not allow create new option.
      const numberOfExactMatches = countExactFnameMatches(
        updatedItems,
        queryOrig,
      );
      const shouldAddCreateNew = shouldAddCreateNewOption({
        allowNewNote: !!this.opts.allowNewNote,
        queryOrig,
        canSelectMany: !!picker.canSelectMany,
        wasMadeFromWikiLink: !!transformedQuery.wasMadeFromWikiLink,
        numberOfExactMatches,
        vaultCount: this.extension.getDWorkspace().engine.vaults.length,
      });

      if (shouldAddCreateNew) {
        const entryCreateNew = NotePickerUtils.createNoActiveItem({
          fname: queryOrig,
          detail: CREATE_NEW_NOTE_DETAIL,
        });
        const newItems = [entryCreateNew];

        // should not add `Create New with Template` if the quickpick
        // 1. has an onCreate defined (i.e. task note), or
        const onCreateDefined = picker.onCreate !== undefined;

        const shouldAddCreateNewWithTemplate =
          this.opts.allowNewNoteWithTemplate && !onCreateDefined;
        if (shouldAddCreateNewWithTemplate) {
          const entryCreateNewWithTemplate =
            NotePickerUtils.createNewWithTemplateItem({
              fname: queryOrig,
            });
          newItems.push(entryCreateNewWithTemplate);
        }

        const bubbleUpCreateNew = ConfigUtils.getLookup(ws.config).note
          .bubbleUpCreateNew;
        if (
          shouldBubbleUpCreateNew({
            numberOfExactMatches,
            querystring: queryOrig,
            bubbleUpCreateNew,
          })
        ) {
          updatedItems = newItems.concat(updatedItems);
        } else {
          updatedItems = updatedItems.concat(newItems);
        }
      }

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
