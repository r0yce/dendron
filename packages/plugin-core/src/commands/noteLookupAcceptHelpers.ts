/**
 * Pure helpers for NoteLookupCommand accept + execute (no VS Code imports).
 */
import {
  getJournalTitle,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";

/**
 * Multi-select keeps all items; single-select uses the first only.
 */
export function getSelectedLookupItems(opts: {
  canSelectMany: boolean | undefined;
  selectedItems: readonly NoteQuickInput[];
}): readonly NoteQuickInput[] {
  const { canSelectMany, selectedItems } = opts;
  return canSelectMany ? selectedItems : selectedItems.slice(0, 1);
}

/**
 * Journal mode uses the live picker value; otherwise the selected item fname.
 */
export function getFNameForNewLookupItem(opts: {
  item: NoteQuickInput;
  isJournal: boolean;
  pickerValue: string;
}): string {
  return opts.isJournal ? opts.pickerValue : opts.item.fname;
}

/**
 * Apply journal title override or full-hierarchy title to a picked item (mutates).
 * Returns journalTrait when journal title was applied (caller attaches JournalNote).
 */
export function applyLookupNoteTitleOverrides(opts: {
  item: NoteQuickInput;
  isJournal: boolean;
  journalDateFormat: string;
  enableFullHierarchyNoteTitle: boolean;
}): { journalTrait?: true } {
  const { item, isJournal, journalDateFormat, enableFullHierarchyNoteTitle } =
    opts;

  if (isJournal) {
    /**
     * hacky title override for journal notes.
     * TODO: remove once a more general title override exists.
     */
    const journalModifiedTitle = getJournalTitle(item.fname, journalDateFormat);
    if (journalModifiedTitle) {
      item.title = journalModifiedTitle;
      return { journalTrait: true };
    }
    return {};
  }

  if (enableFullHierarchyNoteTitle) {
    item.title = NoteUtils.genTitleFromFullFname(item.fname);
  }
  return {};
}

/**
 * Whether picker selection process should run for create-with-template
 * (only selection2link is allowed). Functions have a runtime `.name`.
 */
export function shouldRunSelection2LinkOnTemplateCreate(picker: {
  selectionProcessFunc?: ((...args: any[]) => any) | undefined;
}): boolean {
  return (
    picker.selectionProcessFunc !== undefined &&
    picker.selectionProcessFunc.name === "selection2link"
  );
}
