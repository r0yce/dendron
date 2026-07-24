/**
 * Lookup controller note-type / selection modifiers applied to a QuickPick.
 * Free functions extracted from LookupControllerV3 for maintainability.
 */
import {
  ConfigUtils,
  getSlugger,
  LookupNoteTypeEnum,
  NoteProps,
  NoteUtils,
  TaskNoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { DendronClientUtilsV2 } from "../../clientUtils";
import { ExtensionProvider } from "../../ExtensionProvider";
import { clipboard } from "../../utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { NotePickerUtils } from "./NotePickerUtils";
import { selectionToNoteProps as selectionToNotePropsHelper } from "./selectionProcessing";
import { DendronQuickPickerV2 } from "./types";
import { getPickerValue } from "./pickerValue";

type NamedNoteType =
  | LookupNoteTypeEnum.journal
  | LookupNoteTypeEnum.scratch
  | LookupNoteTypeEnum.task;

function applyNoteTypeModifier(
  quickPick: DendronQuickPickerV2,
  noteType: NamedNoteType
) {
  quickPick.modifyPickerValueFunc = () => {
    try {
      return DendronClientUtilsV2.genNoteName(noteType);
    } catch (error) {
      return { noteName: "", prefix: "" };
    }
  };
  const { noteName, prefix } = quickPick.modifyPickerValueFunc();
  quickPick.noteModifierValue = _.difference(
    noteName.split("."),
    prefix.split(".")
  ).join(".");
  quickPick.prevValue = quickPick.value;
  quickPick.prefix = prefix;
  quickPick.value = getPickerValue(quickPick);
}

function clearNoteTypeModifier(quickPick: DendronQuickPickerV2) {
  quickPick.modifyPickerValueFunc = undefined;
  quickPick.noteModifierValue = undefined;
  quickPick.prevValue = quickPick.value;
  quickPick.prefix = quickPick.rawValue;
  quickPick.value = getPickerValue(quickPick);
}

export function onJournalButtonToggled(
  quickPick: DendronQuickPickerV2,
  enabled: boolean
) {
  if (enabled) {
    applyNoteTypeModifier(quickPick, LookupNoteTypeEnum.journal);
  } else {
    clearNoteTypeModifier(quickPick);
  }
}

export function onScratchButtonToggled(
  quickPick: DendronQuickPickerV2,
  enabled: boolean
) {
  if (enabled) {
    applyNoteTypeModifier(quickPick, LookupNoteTypeEnum.scratch);
  } else {
    clearNoteTypeModifier(quickPick);
  }
}

export async function onTaskButtonToggled(
  quickPick: DendronQuickPickerV2,
  enabled: boolean
) {
  if (enabled) {
    applyNoteTypeModifier(quickPick, LookupNoteTypeEnum.task);
    // If the lookup value ends up being identical to the current note, this will be
    // confusing for the user because they won't be able to create a new note.
    // In that case, we add a trailing dot to suggest that they need to type something more.
    const activeName = (await ExtensionProvider.getWSUtils().getActiveNote())
      ?.fname;
    if (quickPick.value === activeName) {
      quickPick.value = `${quickPick.value}.`;
    }
    // Add default task note props to the created note
    quickPick.onCreate = async (note) => {
      note.custom = {
        ...TaskNoteUtils.genDefaultTaskNoteProps(
          note,
          ConfigUtils.getTask(ExtensionProvider.getDWorkspace().config)
        ).custom,
        ...note.custom,
      };
      return note;
    };
  } else {
    clearNoteTypeModifier(quickPick);
    quickPick.onCreate = undefined;
  }
}

export async function onSelect2ItemsBtnToggled(
  quickPick: DendronQuickPickerV2,
  enabled: boolean
) {
  if (enabled) {
    const pickerItemsFromSelection =
      await NotePickerUtils.createItemsFromSelectedWikilinks();
    quickPick.prevValue = quickPick.value;
    quickPick.value = "";
    quickPick.itemsFromSelection = pickerItemsFromSelection;
  } else {
    quickPick.value = getPickerValue(quickPick);
    quickPick.itemsFromSelection = undefined;
  }
}

export function onCopyNoteLinkBtnToggled(
  quickPick: DendronQuickPickerV2,
  enabled: boolean
) {
  if (enabled) {
    quickPick.copyNoteLinkFunc = async (items: NoteProps[]) => {
      const links = items.map((note) =>
        NoteUtils.createWikiLink({ note, alias: { mode: "title" } })
      );
      if (_.isEmpty(links)) {
        vscode.window.showInformationMessage(`no items selected`);
      } else {
        await clipboard.writeText(links.join("\n"));
        vscode.window.showInformationMessage(`${links.length} links copied`);
      }
    };
  } else {
    quickPick.copyNoteLinkFunc = undefined;
  }
}

export function onSelectionExtractBtnToggled(
  quickPick: DendronQuickPickerV2,
  enabled: boolean
) {
  if (enabled) {
    quickPick.selectionProcessFunc = (note: NoteProps) => {
      return selectionToNotePropsHelper({
        selectionType: "selectionExtract",
        note,
      });
    };
    Object.defineProperty(quickPick.selectionProcessFunc, "name", {
      value: "selectionExtract",
      writable: false,
    });
  } else {
    quickPick.selectionProcessFunc = undefined;
  }
}

export function onSelection2LinkBtnToggled(
  quickPick: DendronQuickPickerV2,
  enabled: boolean
) {
  if (enabled) {
    quickPick.selectionProcessFunc = (note: NoteProps) => {
      return selectionToNotePropsHelper({
        selectionType: "selection2link",
        note,
      });
    };
    Object.defineProperty(quickPick.selectionProcessFunc, "name", {
      value: "selection2link",
      writable: false,
    });

    quickPick.prevValue = quickPick.value;
    const { text } = VSCodeUtils.getSelection();
    const slugger = getSlugger();
    quickPick.selectionModifierValue = slugger.slug(text!);
    if (quickPick.noteModifierValue || quickPick.prefix) {
      quickPick.value = getPickerValue(quickPick);
    } else {
      quickPick.value = [quickPick.rawValue, getPickerValue(quickPick)].join(
        "."
      );
    }
  } else {
    quickPick.selectionProcessFunc = undefined;
    quickPick.selectionModifierValue = undefined;
    quickPick.value = getPickerValue(quickPick);
  }
}
