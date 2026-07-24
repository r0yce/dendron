/**
 * Pure policy for when lookup may show "Create New" / reject bad fnames.
 * No VS Code / engine deps — unit-testable in Node.
 */
import {
  InvalidFilenameReason,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";
import { isCreateNewNotePicked } from "./pickerFilters";

/**
 * Whether the Create New row should be appended for this query state.
 */
export function shouldAddCreateNewOption(opts: {
  allowNewNote: boolean;
  queryOrig: string;
  canSelectMany: boolean;
  wasMadeFromWikiLink: boolean;
  numberOfExactMatches: number;
  vaultCount: number;
}): boolean {
  const vaultsHaveSpaceForExactMatch =
    opts.vaultCount > opts.numberOfExactMatches;
  return (
    // sometimes lookup is in mode where new notes are not allowed (eg. move an existing note)
    opts.allowNewNote &&
    // notes can't end with dot, invalid note
    !opts.queryOrig.endsWith(".") &&
    // if you can select mult notes, new note is not valid
    !opts.canSelectMany &&
    // when you create lookup from selection, new note is not valid
    !opts.wasMadeFromWikiLink &&
    vaultsHaveSpaceForExactMatch
  );
}

/**
 * Reject create-new picks with invalid filenames before accept.
 */
export function shouldRejectLookupItem(opts: { item: NoteQuickInput }):
  | {
      shouldReject: true;
      reason: InvalidFilenameReason;
    }
  | {
      shouldReject: false;
      reason?: never;
    } {
  const { item } = opts;
  const result = NoteUtils.validateFname(item.fname);
  const shouldReject =
    !result.isValid && isCreateNewNotePicked(item);
  if (shouldReject) {
    return {
      shouldReject,
      reason: result.reason,
    };
  }
  return { shouldReject: false };
}

/**
 * Count exact fname matches (case-insensitive) against the original query.
 */
export function countExactFnameMatches(
  items: { fname: string }[],
  queryOrig: string
): number {
  const queryOrigLowerCase = queryOrig.toLowerCase();
  return items.filter(
    (item) => item.fname.toLowerCase() === queryOrigLowerCase
  ).length;
}
