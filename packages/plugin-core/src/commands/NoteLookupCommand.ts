import {
  ConfigUtils,
  DendronError,
  EngagementEvents,
  ErrorFactory,
  ERROR_STATUS,
  getStage,
  LookupNoteType,
  LookupNoteTypeEnum,
  LookupSelectionType,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  PerformanceTimer,
  VSCodeEvents,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  TemplateUtils,
} from "@dendronhq/common-server";
import { HistoryService, MetadataService } from "@dendronhq/engine-server";
import _ from "lodash";
import { Uri, window } from "vscode";
import {
  LookupFilterType,
  LookupSplitType,
} from "../components/lookup/ButtonTypes";
import { buildNoteLookupExtraButtons } from "./noteLookupButtons";
import { selectionModeConfigToType } from "./noteLookupSelectionMode";
import { resolveVaultForNewNote } from "./noteLookupVault";
import {
  applyLookupNoteTitleOverrides,
  getFNameForNewLookupItem,
  getSelectedLookupItems,
  shouldRunSelection2LinkOnTemplateCreate,
} from "./noteLookupAcceptHelpers";
import { CREATE_NEW_LABEL } from "../components/lookup/constants";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import {
  ILookupProviderV3,
  NoteLookupProviderChangeStateResp,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3Interface";
import { NotePickerUtils } from "../components/lookup/NotePickerUtils";
import { QuickPickTemplateSelector } from "../components/lookup/QuickPickTemplateSelector";
import {
  DendronQuickPickerV2,
  DendronQuickPickState,
  VaultSelectionMode,
} from "../components/lookup/types";
import {
  node2Uri,
  OldNewLocation,
  PickerUtilsV2,
} from "../components/lookup/utils";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { logPerfReport } from "../utils/dev";
import { JournalNote } from "../traits/journal";
import { AnalyticsUtils, getAnalyticsPayload } from "../utils/analytics";
import { AutoCompleter } from "../utils/autoCompleter";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { toCSNoteProps, toDEngineClient } from "../utils/typeBridge";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { BaseCommand } from "./base";

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

type OnDidAcceptReturn = {
  uri: Uri;
  node: NoteProps;
  resp?: any;
};

export { CommandOpts as LookupCommandOptsV3 };

/**
 * Note lookup command — gather inputs, accept selection, open notes.
 *
 * Peeled helpers:
 * - `noteLookupButtons` / `noteLookupSelectionMode` / `noteLookupVault`
 * - `noteLookupAcceptHelpers`
 *
 * Dual-build: F5 loads tsc `out/src/extension.js` (not webpack `dist/`).
 */

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
          this._quickPick
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
      noteLookupConfig.selectionMode
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
    opts: CommandGatherOutput
  ): Promise<CommandOpts | undefined> {
    const ctx = "NoteLookupCommand:enrichInputs";
    let promiseResolve: (
      value: CommandOpts | undefined
    ) => PromiseLike<CommandOpts | undefined>;
    HistoryService.instance().subscribev2("lookupProvider", {
      id: "lookup",
      listener: async (event) => {
        if (event.action === "done") {
          const data =
            event.data as NoteLookupProviderSuccessResp<OldNewLocation>;
          if (data.cancel) {
            this.cleanUp();
            promiseResolve(undefined);
          }
          const _opts: CommandOpts = {
            selectedItems: data.selectedItems,
            ...opts,
          };
          promiseResolve(_opts);
        } else if (event.action === "changeState") {
          const data = event.data as NoteLookupProviderChangeStateResp;

          // check if we hid the picker and there is no next picker
          if (data.action === "hide") {
            const { quickpick } = opts;
            Logger.debug({
              ctx,
              subscribers: HistoryService.instance().subscribersv2,
            });
            // check if user has hidden picker
            if (
              !_.includes(
                [
                  DendronQuickPickState.PENDING_NEXT_PICK,
                  DendronQuickPickState.FULFILLED,
                ],
                quickpick.state
              )
            ) {
              this.cleanUp();
              promiseResolve(undefined);
            }
          }
          // don't remove the lookup provider
          return;
        } else if (event.action === "error") {
          const error = event.data.error as DendronError;
          this.L.error({ error });
          this.cleanUp();
          promiseResolve(undefined);
        } else {
          const error = ErrorFactory.createUnexpectedEventError({ event });
          this.L.error({ error });
          this.cleanUp();
        }
      },
    });
    const promise = new Promise<CommandOpts | undefined>((resolve) => {
      promiseResolve = resolve as typeof promiseResolve;
      opts.controller.showQuickPick({
        provider: opts.provider,
        quickpick: opts.quickpick,
        nonInteractive: opts.noConfirm,
        fuzzThreshold: opts.fuzzThreshold,
      });
    });
    return promise;
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
    const ctx = "NoteLookupCommand:execute";
    Logger.info({ ctx, msg: "enter" });

    const perf = new PerformanceTimer({ timerName: "NoteLookup" });
    perf.before("total");

    try {
      const { quickpick, selectedItems } = opts;
      const selected = this.getSelected({ quickpick, selectedItems });

      const extension = ExtensionProvider.getExtension();
      const ws = extension.getDWorkspace();

      const journalDateFormat = ConfigUtils.getJournal(ws.config).dateFormat;

      const out = await Promise.all(
        selected.map((item) => {
          const { journalTrait } = applyLookupNoteTitleOverrides({
            item,
            isJournal: this.isJournalButtonPressed(),
            journalDateFormat,
            enableFullHierarchyNoteTitle: !!ConfigUtils.getWorkspace(ws.config)
              .enableFullHierarchyNoteTitle,
          });
          if (journalTrait) {
            const trait = new JournalNote(
              ExtensionProvider.getDWorkspace().config
            );
            if (item.traits) {
              item.traits.push(trait.id);
            } else {
              item.traits = [trait.id];
            }
          }
          return this.acceptItem(item);
        })
      );
      const notesToShow = out.filter(
        (ent) => !_.isUndefined(ent)
      ) as OnDidAcceptReturn[];
      if (!_.isUndefined(quickpick.copyNoteLinkFunc)) {
        await quickpick.copyNoteLinkFunc!(notesToShow.map((item) => item.node));
      }
      await _.reduce(
        notesToShow,
        async (acc, item) => {
          await acc;
          return quickpick.showNote!(item.uri);
        },
        Promise.resolve({})
      );
      perf.after("showNotes");
    } finally {
      perf.after("total");

      const shouldLogPerf = getStage() === "dev" || process.env.DENDRON_PERF === "1";
      if (shouldLogPerf) {
        const report = perf.report();
        Logger.info({ ctx, msg: "perf-report", report });
        logPerfReport("NoteLookup", report);
      }

      this.cleanUp();
      Logger.info({ ctx, msg: "exit" });
    }
    return opts;
  }

  cleanUp() {
    const ctx = "NoteLookupCommand:cleanup";
    Logger.debug({ ctx, msg: "enter" });
    if (this._controller) {
      this._controller.onHide();
    }
    this.controller = undefined;
    HistoryService.instance().remove("lookup", "lookupProvider");
    VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
  }

  async acceptItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    let result: Promise<OnDidAcceptReturn | undefined>;
    const start = process.hrtime();
    const isNew = PickerUtilsV2.isCreateNewNotePicked(item);

    const isNewWithTemplate =
      PickerUtilsV2.isCreateNewNoteWithTemplatePicked(item);
    if (isNew) {
      if (isNewWithTemplate) {
        result = this.acceptNewWithTemplateItem(item);
      } else {
        result = this.acceptNewItem(item);
      }
    } else {
      result = this.acceptExistingItem(item);
    }
    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.NoteLookup_Accept, {
      duration: profile,
      isNew,
      isNewWithTemplate,
    });
    const metaData = MetadataService.instance().getMeta();
    if (_.isUndefined(metaData.firstLookupTime)) {
      MetadataService.instance().setFirstLookupTime();
    }
    MetadataService.instance().setLastLookupTime();
    return result;
  }

  async acceptExistingItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const picker = this.controller.quickPick;
    const uri = node2Uri(item);
    const originalNoteFromItem = PickerUtilsV2.noteQuickInputToNote(item);
    const originalNoteDeepCopy = _.cloneDeep(originalNoteFromItem);

    if (picker.selectionProcessFunc !== undefined) {
      const processedNode = await picker.selectionProcessFunc(
        originalNoteDeepCopy
      );
      if (processedNode !== undefined) {
        if (!_.isEqual(originalNoteFromItem, processedNode)) {
          const engine = ExtensionProvider.getEngine();
          await engine.writeNote(processedNode);
        }
        return { uri, node: processedNode };
      }
    }
    return { uri, node: item };
  }

  /**
   * Given a selected note item that is a stub note,
   * Prepare it for accepting as a new item.
   * This removes the `stub` frontmatter
   * and applies schema if there is one that matches
   */
  async prepareStubItem(opts: {
    item: NoteQuickInput;
    engine: IEngineAPIService;
  }): Promise<NoteProps> {
    const { item, engine } = opts;

    const noteFromItem = PickerUtilsV2.noteQuickInputToNote(item);
    const preparedNote = await NoteUtils.updateStubWithSchema({
      stubNote: noteFromItem,
      engine,
    });
    return preparedNote;
  }

  async acceptNewItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const ctx = "acceptNewItem";
    const picker = this.controller.quickPick;
    const fname = this.getFNameForNewItem(item);

    const engine = ExtensionProvider.getEngine();
    let nodeNew: NoteProps;
    if (item.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = await this.prepareStubItem({
        item,
        engine,
      });
    } else {
      const vault = await this.getVaultForNewNote({ fname, picker });
      if (vault === undefined) {
        // Vault will be undefined when user cancelled vault selection, so we
        // are going to cancel the creation of the note.
        return;
      }
      nodeNew = await NoteUtils.createWithSchema({
        noteOpts: {
          fname,
          vault,
          title: item.title,
          traits: item.traits,
        },
        engine,
      });
      if (picker.selectionProcessFunc !== undefined) {
        nodeNew = (await picker.selectionProcessFunc(nodeNew)) as NoteProps;
      }
    }

    const templateAppliedResp = await TemplateUtils.findAndApplyTemplate({
      note: toCSNoteProps(nodeNew),
      engine: toDEngineClient(engine),
      pickNote: (async (choices: NoteProps[]) => {
        const resp = await WSUtilsV2.instance().promptForNoteAsync({
          notes: choices,
          quickpickTitle:
            "Select which template to apply or press [ESC] to not apply a template",
          nonStubOnly: true,
        });
        if (resp?.data) {
          return { data: toCSNoteProps(resp.data) };
        }
        return resp;
      }) as Parameters<typeof TemplateUtils.findAndApplyTemplate>[0]["pickNote"],
    });

    if (templateAppliedResp.error) {
      window.showWarningMessage(
        `Warning: Problem with ${nodeNew.fname} schema. ${templateAppliedResp.error.message}`
      );
    } else if (templateAppliedResp.data) {
      AnalyticsUtils.track(EngagementEvents.TemplateApplied, {
        source: this.key,
        ...TemplateUtils.genTrackPayload(toCSNoteProps(nodeNew)),
      });
    }

    if (picker.onCreate) {
      const nodeModified = await picker.onCreate(nodeNew);
      if (nodeModified) nodeNew = nodeModified;
    }
    const resp = await engine.writeNote(nodeNew);
    if (resp.error) {
      Logger.error({ ctx, error: resp.error });
      return;
    }

    const uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });
    return { uri, node: nodeNew, resp };
  }

  async acceptNewWithTemplateItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const ctx = "acceptNewWithTemplateItem";
    const picker = this.controller.quickPick;
    const fname = this.getFNameForNewItem(item);

    const engine = ExtensionProvider.getEngine();
    let nodeNew: NoteProps = item;
    const vault = await this.getVaultForNewNote({ fname, picker });
    if (vault === undefined) {
      return;
    }
    nodeNew = NoteUtils.create({
      fname,
      vault,
      title: item.title,
    });
    const templateNote = await this.getTemplateForNewNote();
    if (templateNote) {
      TemplateUtils.applyTemplate({
        templateNote: toCSNoteProps(templateNote),
        targetNote: toCSNoteProps(nodeNew),
        engine: toDEngineClient(engine),
      });
    } else {
      // template note is not selected. cancel note creation.
      window.showInformationMessage(
        `No template selected. Cancelling note creation.`
      );
      return;
    }

    // only enable selection 2 link
    if (shouldRunSelection2LinkOnTemplateCreate(picker)) {
      nodeNew = (await picker.selectionProcessFunc!(nodeNew)) as NoteProps;
    }
    const resp = await engine.writeNote(nodeNew);
    if (resp.error) {
      Logger.error({ ctx, error: resp.error });
      return;
    }

    const uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: engine.wsRoot,
    });
    return { uri, node: nodeNew, resp };
  }

  /**
   * TODO: align note creation file name choosing for follow a single path when accepting new item.
   *
   * Added to quickly fix the journal names not being created properly.
   */
  private getFNameForNewItem(item: NoteQuickInput) {
    return getFNameForNewLookupItem({
      item,
      isJournal: this.isJournalButtonPressed(),
      pickerValue: PickerUtilsV2.getValue(this.controller.quickPick),
    });
  }

  //  ^8jd6vr4qcsol
  private async getVaultForNewNote({
    fname,
    picker,
  }: {
    fname: string;
    picker: DendronQuickPickerV2;
  }) {
    return resolveVaultForNewNote({ fname, picker });
  }

  private async getTemplateForNewNote(): Promise<NoteProps | undefined> {
    const selector = new QuickPickTemplateSelector();

    const templateNote = await selector.getTemplate({
      logger: this.L,
      providerId: "createNewWithTemplate",
    });

    // this needs to be checked because note lookup provider
    // assumes user selected `create new` when `selectionItems` is empty.
    // without this, hitting enter when the template picker has nothing listed
    // will result in note creation with an empty template applied.
    if (templateNote && templateNote.id === CREATE_NEW_LABEL) {
      return;
    }

    return templateNote;
  }

  private isJournalButtonPressed() {
    return this.controller.isJournalButtonPressed();
  }

  addAnalyticsPayload(opts?: CommandOpts, resp?: CommandOpts) {
    const { source } = { ...opts, ...resp };
    return getAnalyticsPayload(source);
  }
}
