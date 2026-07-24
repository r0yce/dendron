/**
 * Schema lookup QuickPick provider.
 *
 * Peeled helpers:
 * - empty qs / create-new → `schemaLookupHelpers`
 * - accept vault/hooks → `lookupProviderAccept` / `lookupProviderHistory`
 */
import {
  NoteLookupUtils,
  NoteQuickInput,
  NoteUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import _ from "lodash";
import { CancellationTokenSource, window } from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { NotePickerUtils } from "../lookup/NotePickerUtils";
import { SchemaPickerUtils } from "../lookup/SchemaPickerUtils";
import {
  ILookupProviderOptsV3,
  ILookupProviderV3,
  OnAcceptHook,
  OnUpdatePickerItemsOpts,
  ProvideOpts,
} from "./LookupProviderV3Interface";
import {
  maybeSelectVaultViaNextPicker,
  runAcceptHooksAndPublish,
} from "./lookupProviderAccept";
import { publishLookupCancel } from "./lookupProviderHistory";
import { wireLookupProvide } from "./lookupProviderWire";
import {
  appendCreateNewSchemaItem,
  fetchSchemaRootPickerItems,
  isMultiLevelSchemaQuery,
} from "./schemaLookupHelpers";
import { DendronQuickPickerV2 } from "./types";
import { PickerUtilsV2 } from "./utils";

export class SchemaLookupProvider implements ILookupProviderV3 {
  private _extension: IDendronExtension;
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;

  constructor(
    public id: string,
    opts: ILookupProviderOptsV3,
    extension: IDendronExtension,
  ) {
    this._extension = extension;
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(opts: ProvideOpts) {
    const { quickpick, token } = opts;
    wireLookupProvide({
      quickpick,
      token,
      onUpdatePickerItems: _.bind(this.onUpdatePickerItems, this),
      onAccept: () =>
        this.onDidAccept({ quickpick, cancellationToken: token })(),
      debounce: { leading: true, maxWait: 200 },
      onAcceptDebounce: "cancel",
      logCtx: "SchemaLookupProvider",
    });
    return;
  }

  /**
   * Takes selection and runs accept, followed by hooks.
   */
  onDidAccept(opts: {
    quickpick: DendronQuickPickerV2;
    cancellationToken: CancellationTokenSource;
  }) {
    return async () => {
      const ctx = "SchemaLookupProvider:onDidAccept";
      const { quickpick: picker, cancellationToken } = opts;
      let selectedItems = NotePickerUtils.getSelection(picker);
      Logger.debug({
        ctx,
        selectedItems: selectedItems.map((item) => NoteUtils.toLogObj(item)),
      });
      if (_.isEmpty(selectedItems)) {
        selectedItems =
          await SchemaPickerUtils.fetchPickerResultsWithCurrentValue({
            picker,
          });
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

      if (isMultiLevelSchemaQuery(picker.value)) {
        window
          .showInformationMessage(
            "It looks like you are trying to create a multi-level [schema](https://wiki.dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html). This is not supported. If you are trying to create a note instead, run the `> Note Lookup` command or click on `Note Lookup`",
            ...["Note Lookup"],
          )
          .then(async (selection) => {
            if (selection === "Note Lookup") {
              await new NoteLookupCommand().run({
                initialValue: picker.value,
              });
            }
          });

        publishLookupCancel(this.id);
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
      });
    };
  }

  async onUpdatePickerItems(opts: OnUpdatePickerItemsOpts) {
    const { picker, token } = opts;
    const ctx = "updatePickerItems";
    picker.busy = true;
    const pickerValue = picker.value;
    const start = process.hrtime();

    const querystring = NoteLookupUtils.slashToDot(pickerValue);
    const queryOrig = NoteLookupUtils.slashToDot(picker.value);
    const ws = this._extension.getDWorkspace();
    let profile: number;

    const engine = ws.engine;
    Logger.info({ ctx, msg: "enter", queryOrig });
    try {
      // if empty string, show all 1st level results
      if (querystring === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        picker.items = await fetchSchemaRootPickerItems({
          engine,
          wsRoot: this._extension.getDWorkspace().wsRoot,
          vaults: ws.vaults,
        });
        return;
      }

      // initialize with current picker items without default items present
      const items: NoteQuickInput[] = [...picker.items];
      let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token?.isCancellationRequested) {
        return;
      }

      // if we entered a different level of hierarchy, re-run search
      updatedItems = await SchemaPickerUtils.fetchPickerResults({
        picker,
        qs: querystring,
      });
      if (token?.isCancellationRequested) {
        return;
      }

      // // check if we have an exact match in the results and keep track for later
      const perfectMatch = _.find(updatedItems, { fname: queryOrig });

      // check if single item query, vscode doesn't surface single letter queries
      // we need this so that suggestions will show up
      // TODO: this might be buggy since we don't apply filter middleware
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      updatedItems = appendCreateNewSchemaItem({
        updatedItems,
        querystring,
        allowNewNote: !!this.opts.allowNewNote,
        hasPerfectMatch: !!perfectMatch,
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
        cancelled: token?.isCancellationRequested,
      });
      AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Update, {
        duration: profile,
      });
    }
  }

  registerOnAcceptHook(hook: OnAcceptHook) {
    this._onAcceptHooks.push(hook);
  }
}
