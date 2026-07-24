/**
 * Build NoteLookupCommand extraButtons from run opts.
 */
import {
  LookupNoteTypeEnum,
  LookupSelectionTypeEnum,
} from "@dendronhq/common-all";
import {
  CopyNoteLinkBtn,
  DirectChildFilterBtn,
  HorizontalSplitBtn,
  JournalBtn,
  MultiSelectBtn,
  ScratchBtn,
  Selection2ItemsBtn,
  Selection2LinkBtn,
  SelectionExtractBtn,
  TaskBtn,
} from "../components/lookup/buttons";
import {
  LookupFilterType,
  LookupSplitType,
  LookupSplitTypeEnum,
} from "../components/lookup/ButtonTypes";
import type { LookupNoteType, LookupSelectionType } from "@dendronhq/common-all";

/** Subset of NoteLookupCommand run opts needed for button state. */
export type NoteLookupButtonOpts = {
  multiSelect?: boolean | undefined;
  copyNoteLink?: boolean | undefined;
  noteType?: LookupNoteType | undefined;
  selectionType?: LookupSelectionType | undefined;
  splitType?: LookupSplitType | undefined;
  filterMiddleware?: LookupFilterType[] | undefined;
};

export function buildNoteLookupExtraButtons(copts: NoteLookupButtonOpts) {
  return [
    MultiSelectBtn.create({ pressed: !!copts.multiSelect }),
    CopyNoteLinkBtn.create(copts.copyNoteLink),
    DirectChildFilterBtn.create(
      copts.filterMiddleware?.includes("directChildOnly")
    ),
    SelectionExtractBtn.create({
      pressed: copts.selectionType === LookupSelectionTypeEnum.selectionExtract,
    }),
    Selection2LinkBtn.create(
      copts.selectionType === LookupSelectionTypeEnum.selection2link
    ),
    Selection2ItemsBtn.create({
      pressed: copts.selectionType === LookupSelectionTypeEnum.selection2Items,
    }),
    JournalBtn.create({
      pressed: copts.noteType === LookupNoteTypeEnum.journal,
    }),
    ScratchBtn.create({
      pressed: copts.noteType === LookupNoteTypeEnum.scratch,
    }),
    TaskBtn.create(copts.noteType === LookupNoteTypeEnum.task),
    HorizontalSplitBtn.create(
      copts.splitType === LookupSplitTypeEnum.horizontal
    ),
  ];
}
