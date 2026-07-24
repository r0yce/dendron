/**
 * Note lookup command — gather inputs, wait for picker, accept selection, open notes.
 *
 * Modular peels (prefer importing helpers for tests / reuse):
 * - `noteLookupButtons` / `noteLookupSelectionMode` / `noteLookupVault`
 * - `noteLookupAcceptHelpers` / `noteLookupAcceptItem` (+ existing/new/template)
 * - `noteLookupExecute` / `noteLookupCleanup` / `lookupCommandEnrichInputs`
 *
 * Dual-build: F5 loads tsc `out/src/extension.js` (not webpack `dist/`).
 */
import {
  ConfigUtils,
  DendronError,
  ERROR_STATUS,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  NoteProps,
  NoteQuickInput,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
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
import { NotePickerUtils } from "../components/lookup/NotePickerUtils";
import {
  DendronQuickPickerV2,
  VaultSelectionMode,
} from "../components/lookup/types";
import { OldNewLocation, PickerUtilsV2 } from "../components/lookup/utils";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { AnalyticsUtils, getAnalyticsPayload } from "../utils/analytics";
import { AutoCompleter } from "../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { VSCodeUtils } from "../vsCodeUtils";
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
import { buildNoteLookupExtraButtons } from "./noteLookupButtons";
import { cleanupNoteLookup } from "./noteLookupCleanup";
import { executeNoteLookupSelection } from "./noteLookupExecute";
import { prepareStubLookupItem } from "./noteLookupPrepareStub";
import { selectionModeConfigToType } from "./noteLookupSelectionMode";

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

/**
 * Everything that's necessary to initialize the quickpick
 */
type CommandGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean | undefined;
  fuzzThreshold?: number | undefined;
};

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
    const extension = ExtensionProvider.getExtension();
    const start = process.hrtime();
    const ws = extension.getDWorkspace();
    const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
    const noteLookupConfig = lookupConfig.note;
    const selectionType = selectionModeConfigToType(
      noteLookupConfig.selectionMode,
    );

    const confirmVaultOnCreate = noteLookupConfig.confirmVaultOnCreate;

    const copts: CommandRunOpts = _.defaults(opts || {}, {
      multiSelect: false,
      filterMiddleware: [],
      initialValue: NotePickerUtils.getInitialValueFromOpenEditor(),
      selectionType,
    } as CommandRunOpts);

    let vaultButtonPressed: boolean;
    if (copts.vaultSelectionMode) {
      vaultButtonPressed =
        copts.vaultSelectionMode === VaultSelectionMode.alwaysPrompt;
    } else {
      vaultButtonPressed =
        VaultSelectionModeConfigUtils.shouldAlwaysPromptVaultSelection();
    }

    const ctx = "NoteLookupCommand:gatherInput";
    Logger.info({ ctx, opts, msg: "enter" });
    // initialize controller and provider
    const disableVaultSelection = !confirmVaultOnCreate;
    if (_.isUndefined(this._controller)) {
      this._controller = extension.lookupControllerFactory.create({
        nodeType: "note",
        disableVaultSelection,
        vaultButtonPressed,
        extraButtons: buildNoteLookupExtraButtons(copts),
        enableLookupView: true,
      });
    }
    if (this._provider === undefined) {
      // hack. we need to do this because
      // moveSelectionTo sets a custom provider instead of the
      // one that lookup creates.
      // TODO: fix moveSelectionTo so that it doesn't rely on this.
      this._provider = extension.noteLookupProviderFactory.create("lookup", {
        allowNewNote: true,
        allowNewNoteWithTemplate: true,
        noHidePickerOnAccept: false,
        forceAsIsPickerValueUsage:
          copts.noteType === LookupNoteTypeEnum.scratch,
      });
    }
    const lc = this.controller;
    if (copts.fuzzThreshold) {
      lc.fuzzThreshold = copts.fuzzThreshold;
    }

    VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

    const { quickpick } = await lc.prepareQuickPick({
      placeholder: "a seed",
      provider: this.provider,
      initialValue: copts.initialValue,
      nonInteractive: copts.noConfirm,
      alwaysShow: true,
    });
    this._quickPick = quickpick;

    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.NoteLookup_Gather, {
      duration: profile,
    });

    return {
      controller: this.controller,
      provider: this.provider,
      quickpick,
      noConfirm: copts.noConfirm,
      fuzzThreshold: copts.fuzzThreshold,
    };
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

  /**
   * Executed after user accepts a quickpick item
   */
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

  /**
   * Given a selected note item that is a stub note,
   * Prepare it for accepting as a new item.
   */
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

  /**
   * TODO: align note creation file name choosing for follow a single path when accepting new item.
   */
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
