/**
 * After picker accept: title overrides, accept items, open notes / copy links.
 */
import {
  ConfigUtils,
  NoteQuickInput,
  PerformanceTimer,
  getStage,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { JournalNote } from "../traits/journal";
import { logPerfReport } from "../utils/dev";
import {
  applyLookupNoteTitleOverrides,
  getFNameForNewLookupItem,
  getSelectedLookupItems,
} from "./noteLookupAcceptHelpers";
import { acceptLookupItem } from "./noteLookupAcceptItem";
import { NoteLookupAcceptReturn } from "./noteLookupAcceptTypes";

export async function executeNoteLookupSelection(opts: {
  quickpick: DendronQuickPickerV2;
  selectedItems: readonly NoteQuickInput[];
  isJournal: boolean;
  analyticsSource: string;
  logger: typeof Logger | { error: Function };
  onCleanup: () => void;
}): Promise<void> {
  const ctx = "NoteLookupCommand:execute";
  Logger.info({ ctx, msg: "enter" });

  const perf = new PerformanceTimer({ timerName: "NoteLookup" });
  perf.before("total");

  try {
    const { quickpick, selectedItems, isJournal, analyticsSource, logger } =
      opts;
    const selected = getSelectedLookupItems({
      canSelectMany: quickpick.canSelectMany,
      selectedItems,
    });

    const ws = ExtensionProvider.getExtension().getDWorkspace();
    const journalDateFormat = ConfigUtils.getJournal(ws.config).dateFormat;
    const enableFullHierarchyNoteTitle = !!ConfigUtils.getWorkspace(ws.config)
      .enableFullHierarchyNoteTitle;
    const pickerValue = PickerUtilsV2.getValue(quickpick);

    const out = await Promise.all(
      selected.map((item) => {
        const { journalTrait } = applyLookupNoteTitleOverrides({
          item,
          isJournal,
          journalDateFormat,
          enableFullHierarchyNoteTitle,
        });
        if (journalTrait) {
          const trait = new JournalNote(
            ExtensionProvider.getDWorkspace().config,
          );
          if (item.traits) {
            item.traits.push(trait.id);
          } else {
            item.traits = [trait.id];
          }
        }
        return acceptLookupItem({
          item,
          picker: quickpick,
          fnameForNew: getFNameForNewLookupItem({
            item,
            isJournal,
            pickerValue,
          }),
          analyticsSource,
          logger,
        });
      }),
    );

    const notesToShow = out.filter(
      (ent) => !_.isUndefined(ent),
    ) as NoteLookupAcceptReturn[];
    if (!_.isUndefined(quickpick.copyNoteLinkFunc)) {
      await quickpick.copyNoteLinkFunc!(notesToShow.map((item) => item.node));
    }
    await _.reduce(
      notesToShow,
      async (acc, item) => {
        await acc;
        return quickpick.showNote!(item.uri);
      },
      Promise.resolve({}),
    );
    perf.after("showNotes");
  } finally {
    perf.after("total");

    const shouldLogPerf =
      getStage() === "dev" || process.env.DENDRON_PERF === "1";
    if (shouldLogPerf) {
      const report = perf.report();
      Logger.info({ ctx, msg: "perf-report", report });
      logPerfReport("NoteLookup", report);
    }

    opts.onCleanup();
    Logger.info({ ctx, msg: "exit" });
  }
}
