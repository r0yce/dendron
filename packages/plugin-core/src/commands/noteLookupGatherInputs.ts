/**
 * Build controller + provider + QuickPick for note lookup.
 */
import {
  ConfigUtils,
  LookupNoteTypeEnum,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import _ from "lodash";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { ILookupProviderV3 } from "../components/lookup/LookupProviderV3Interface";
import { NotePickerUtils } from "../components/lookup/NotePickerUtils";
import {
  DendronQuickPickerV2,
  VaultSelectionMode,
} from "../components/lookup/types";
import { VaultSelectionModeConfigUtils } from "../components/lookup/vaultSelectionModeConfigUtils";
import { DendronContext } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { buildNoteLookupExtraButtons } from "./noteLookupButtons";
import { selectionModeConfigToType } from "./noteLookupSelectionMode";

/** Run opts subset used by gather (matches NoteLookupCommand.CommandRunOpts). */
export type NoteLookupGatherRunOpts = {
  initialValue?: string | undefined;
  noConfirm?: boolean | undefined;
  fuzzThreshold?: number | undefined;
  multiSelect?: boolean | undefined;
  copyNoteLink?: boolean | undefined;
  noteType?: import("@dendronhq/common-all").LookupNoteType | undefined;
  selectionType?:
    | import("@dendronhq/common-all").LookupSelectionType
    | undefined;
  splitType?:
    | import("../components/lookup/ButtonTypes").LookupSplitType
    | undefined;
  filterMiddleware?:
    | import("../components/lookup/ButtonTypes").LookupFilterType[]
    | undefined;
  vaultSelectionMode?: VaultSelectionMode | undefined;
};

export type NoteLookupGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean | undefined;
  fuzzThreshold?: number | undefined;
};

export function resolveVaultButtonPressed(opts: {
  vaultSelectionMode?: VaultSelectionMode | undefined;
}): boolean {
  if (opts.vaultSelectionMode !== undefined) {
    return opts.vaultSelectionMode === VaultSelectionMode.alwaysPrompt;
  }
  return VaultSelectionModeConfigUtils.shouldAlwaysPromptVaultSelection();
}

/**
 * Initialize (or reuse) controller/provider and prepare the note QuickPick.
 */
export async function gatherNoteLookupInputs(opts: {
  runOpts?: NoteLookupGatherRunOpts | undefined;
  existingController?: ILookupControllerV3 | undefined;
  existingProvider?: ILookupProviderV3 | undefined;
}): Promise<
  NoteLookupGatherOutput & {
    controller: ILookupControllerV3;
    provider: ILookupProviderV3;
  }
> {
  const extension = ExtensionProvider.getExtension();
  const start = process.hrtime();
  const ws = extension.getDWorkspace();
  const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
  const noteLookupConfig = lookupConfig.note;
  const selectionType = selectionModeConfigToType(
    noteLookupConfig.selectionMode,
  );

  const confirmVaultOnCreate = noteLookupConfig.confirmVaultOnCreate;

  const copts: NoteLookupGatherRunOpts = _.defaults(opts.runOpts || {}, {
    multiSelect: false,
    filterMiddleware: [],
    initialValue: NotePickerUtils.getInitialValueFromOpenEditor(),
    selectionType,
  } as NoteLookupGatherRunOpts);

  const vaultButtonPressed = resolveVaultButtonPressed({
    vaultSelectionMode: copts.vaultSelectionMode,
  });

  const ctx = "NoteLookupCommand:gatherInput";
  Logger.info({ ctx, opts: opts.runOpts, msg: "enter" });

  const disableVaultSelection = !confirmVaultOnCreate;
  let controller = opts.existingController;
  if (_.isUndefined(controller)) {
    controller = extension.lookupControllerFactory.create({
      nodeType: "note",
      disableVaultSelection,
      vaultButtonPressed,
      extraButtons: buildNoteLookupExtraButtons(copts),
      enableLookupView: true,
    });
  }

  let provider = opts.existingProvider;
  if (provider === undefined) {
    // hack: moveSelectionTo may set a custom provider; keep id "lookup".
    // TODO: fix moveSelectionTo so that it doesn't rely on this.
    provider = extension.noteLookupProviderFactory.create("lookup", {
      allowNewNote: true,
      allowNewNoteWithTemplate: true,
      noHidePickerOnAccept: false,
      forceAsIsPickerValueUsage: copts.noteType === LookupNoteTypeEnum.scratch,
    });
  }

  if (copts.fuzzThreshold) {
    controller.fuzzThreshold = copts.fuzzThreshold;
  }

  VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

  const { quickpick } = await controller.prepareQuickPick({
    placeholder: "a seed",
    provider,
    initialValue: copts.initialValue,
    nonInteractive: copts.noConfirm,
    alwaysShow: true,
  });

  const profile = getDurationMilliseconds(start);
  AnalyticsUtils.track(VSCodeEvents.NoteLookup_Gather, {
    duration: profile,
  });

  return {
    controller,
    provider,
    quickpick,
    noConfirm: copts.noConfirm,
    fuzzThreshold: copts.fuzzThreshold,
  };
}
