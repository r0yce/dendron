/**
 * Note lookup command — thin shell over modular helpers.
 *
 * Modular peels:
 * - gather: `noteLookupGatherInputs`
 * - enrich: `lookupCommandEnrichInputs`
 * - execute / cleanup: `noteLookupExecute` / `noteLookupCleanup`
 * - accept: `noteLookupAcceptItem` (+ Existing/New/Template)
 *
 * Dual-build: F5 loads tsc `out/src/extension.js` (not webpack `dist/`).
 */
import {
  DendronError,
  ERROR_STATUS,
  LookupNoteType,
  LookupSelectionType,
  NoteProps,
  NoteQuickInput,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  LookupFilterType,
  LookupSplitType,
} from "../components/lookup/ButtonTypes";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import {
  ILookupProviderV3,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3Interface";
import {
  DendronQuickPickerV2,
  VaultSelectionMode,
} from "../components/lookup/types";
import { OldNewLocation, PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { getAnalyticsPayload } from "../utils/analytics";
import { AutoCompleter } from "../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { BaseCommand } from "./base";
import { enrichNoteLookupInputs } from "./lookupCommandEnrichInputs";
import { acceptLookupItem } from "./noteLookupAcceptItem";
import { acceptExistingLookupItem } from "./noteLookupAcceptExisting";
import { acceptNewLookupItem } from "./noteLookupAcceptNew";
import { acceptNewWithTemplateLookupItem } from "./noteLookupAcceptTemplate";
import { NoteLookupAcceptReturn } from "./noteLookupAcceptTypes";
import {
  getFNameForNewLookupItem,
  getSelectedLookupItems,
} from "./noteLookupAcceptHelpers";
import { cleanupNoteLookup } from "./noteLookupCleanup";
import { executeNoteLookupSelection } from "./noteLookupExecute";
import {
  gatherNoteLookupInputs,
  NoteLookupGatherOutput,
} from "./noteLookupGatherInputs";
import { prepareStubLookupItem } from "./noteLookupPrepareStub";

export type CommandRunOpts = {
  initialValue?: string | undefined;
  noConfirm?: boolean | undefined;
  fuzzThreshold?: number | undefined;
  multiSelect?: boolean | undefined;
  copyNoteLink?: boolean | undefined;
  noteType?: LookupNoteType | undefined;
  selectionType?: LookupSelectionType | undefined;
  splitType?: LookupSplitType | undefined;
  /**
   * NOTE: currently, only one filter is supported
   */
  filterMiddleware?: LookupFilterType[] | undefined;
  vaultSelectionMode?: VaultSelectionMode | undefined;
};

type CommandGatherOutput = NoteLookupGatherOutput;

/**
 * Passed into execute command
 */
export type CommandOpts = {
  selectedItems: readonly NoteQuickInput[];
  /** source of the command. Added for contextual UI analytics. */
  source?: string;
} & CommandGatherOutput;

export type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
};

type OnDidAcceptReturn = NoteLookupAcceptReturn;

export { CommandOpts as LookupCommandOptsV3 };

export class NoteLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  key = DENDRON_COMMANDS.LOOKUP_NOTE.key;
  protected _controller: ILookupControllerV3 | undefined;
  protected _provider: ILookupProviderV3 | undefined;
  protected _quickPick: DendronQuickPickerV2 | undefined;

  constructor() {
    super("LookupCommandV3");

    //  ^1h1dr08geo6c
    AutoCompletableRegistrar.OnAutoComplete(() => {
      if (this._quickPick) {
        this._quickPick.value = AutoCompleter.getAutoCompletedValue(
          this._quickPick,
        );

        this.provider.onUpdatePickerItems({
          picker: this._quickPick,
        });
      }
    });
  }

  public get controller(): ILookupControllerV3 {
    if (_.isUndefined(this._controller)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "controller not set",
      });
    }
    return this._controller;
  }

  public set controller(controller: ILookupControllerV3 | undefined) {
    this._controller = controller;
  }

  public get provider(): ILookupProviderV3 {
    if (_.isUndefined(this._provider)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "provider not set",
      });
    }
    return this._provider;
  }

  /**
   * @deprecated
   *
   * This is not a good pattern and causes a lot of problems with state.
   * This will be deprecated so that we never have to swap out the provider
   * of an already existing instance of a lookup command.
   *
   * In the meantime, if you absolutely _have_ to provide a custom provider to an instance of
   * a lookup command, make sure the provider's id is `lookup`.
   */
  public set provider(provider: ILookupProviderV3 | undefined) {
    this._provider = provider;
  }

  async gatherInputs(opts?: CommandRunOpts): Promise<CommandGatherOutput> {
    const gathered = await gatherNoteLookupInputs({
      runOpts: opts,
      existingController: this._controller,
      existingProvider: this._provider,
    });
    this._controller = gathered.controller;
    this._provider = gathered.provider;
    this._quickPick = gathered.quickpick;
    return gathered;
  }

  async enrichInputs(
    opts: CommandGatherOutput,
  ): Promise<CommandOpts | undefined> {
    return enrichNoteLookupInputs({
      historyId: "lookup",
      gather: opts,
      logCtx: "NoteLookupCommand:enrichInputs",
      logger: this.L,
      onCleanup: () => this.cleanUp(),
      mapDone: (data) => {
        const success = data as NoteLookupProviderSuccessResp<OldNewLocation>;
        return {
          selectedItems: success.selectedItems,
          ...opts,
        };
      },
    });
  }

  getSelected({
    quickpick,
    selectedItems,
  }: Pick<
    CommandOpts,
    "selectedItems" | "quickpick"
  >): readonly NoteQuickInput[] {
    return getSelectedLookupItems({
      canSelectMany: quickpick.canSelectMany,
      selectedItems,
    });
  }

  async execute(opts: CommandOpts) {
    await executeNoteLookupSelection({
      quickpick: opts.quickpick,
      selectedItems: opts.selectedItems,
      isJournal: this.isJournalButtonPressed(),
      analyticsSource: this.key,
      logger: this.L,
      onCleanup: () => this.cleanUp(),
    });
    return opts;
  }

  cleanUp() {
    cleanupNoteLookup({
      controller: this._controller,
      clearController: () => {
        this.controller = undefined;
      },
    });
  }

  async acceptItem(
    item: NoteQuickInput,
  ): Promise<OnDidAcceptReturn | undefined> {
    return acceptLookupItem({
      item,
      picker: this.controller.quickPick,
      fnameForNew: this.getFNameForNewItem(item),
      analyticsSource: this.key,
      logger: this.L,
    });
  }

  async acceptExistingItem(
    item: NoteQuickInput,
  ): Promise<OnDidAcceptReturn | undefined> {
    return acceptExistingLookupItem({
      item,
      picker: this.controller.quickPick,
    });
  }

  async prepareStubItem(opts: {
    item: NoteQuickInput;
    engine: IEngineAPIService;
  }): Promise<NoteProps> {
    return prepareStubLookupItem(opts);
  }

  async acceptNewItem(
    item: NoteQuickInput,
  ): Promise<OnDidAcceptReturn | undefined> {
    return acceptNewLookupItem({
      item,
      picker: this.controller.quickPick,
      fname: this.getFNameForNewItem(item),
      analyticsSource: this.key,
    });
  }

  async acceptNewWithTemplateItem(
    item: NoteQuickInput,
  ): Promise<OnDidAcceptReturn | undefined> {
    return acceptNewWithTemplateLookupItem({
      item,
      picker: this.controller.quickPick,
      fname: this.getFNameForNewItem(item),
      logger: this.L,
    });
  }

  private getFNameForNewItem(item: NoteQuickInput) {
    return getFNameForNewLookupItem({
      item,
      isJournal: this.isJournalButtonPressed(),
      pickerValue: PickerUtilsV2.getValue(this.controller.quickPick),
    });
  }

  private isJournalButtonPressed() {
    return this.controller.isJournalButtonPressed();
  }

  addAnalyticsPayload(opts?: CommandOpts, resp?: CommandOpts) {
    const { source } = { ...opts, ...resp };
    return getAnalyticsPayload(source);
  }
}
