/**
 * Append Create New / Create New with Template rows to lookup results.
 */
import {
  ConfigUtils,
  DendronConfig,
  NoteQuickInput,
} from "@dendronhq/common-all";
import {
  countExactFnameMatches,
  shouldAddCreateNewOption,
} from "./pickerCreateNewPolicy";
import { shouldBubbleUpCreateNew } from "./pickerCreateNew";
import { NotePickerUtils } from "./NotePickerUtils";
import { CREATE_NEW_NOTE_DETAIL } from "./constants";

export function appendCreateNewNoteItems(opts: {
  updatedItems: NoteQuickInput[];
  queryOrig: string;
  allowNewNote: boolean;
  allowNewNoteWithTemplate: boolean;
  canSelectMany: boolean;
  wasMadeFromWikiLink: boolean;
  vaultCount: number;
  /** Task notes etc. set onCreate — then "with template" is suppressed. */
  onCreateDefined: boolean;
  config: DendronConfig;
}): NoteQuickInput[] {
  const {
    queryOrig,
    allowNewNote,
    allowNewNoteWithTemplate,
    canSelectMany,
    wasMadeFromWikiLink,
    vaultCount,
    onCreateDefined,
    config,
  } = opts;
  let { updatedItems } = opts;

  const numberOfExactMatches = countExactFnameMatches(updatedItems, queryOrig);
  const shouldAddCreateNew = shouldAddCreateNewOption({
    allowNewNote,
    queryOrig,
    canSelectMany,
    wasMadeFromWikiLink,
    numberOfExactMatches,
    vaultCount,
  });

  if (!shouldAddCreateNew) {
    return updatedItems;
  }

  const entryCreateNew = NotePickerUtils.createNoActiveItem({
    fname: queryOrig,
    detail: CREATE_NEW_NOTE_DETAIL,
  });
  const newItems: NoteQuickInput[] = [entryCreateNew];

  const shouldAddCreateNewWithTemplate =
    allowNewNoteWithTemplate && !onCreateDefined;
  if (shouldAddCreateNewWithTemplate) {
    newItems.push(
      NotePickerUtils.createNewWithTemplateItem({
        fname: queryOrig,
      }),
    );
  }

  const bubbleUpCreateNew =
    ConfigUtils.getLookup(config).note.bubbleUpCreateNew;
  if (
    shouldBubbleUpCreateNew({
      numberOfExactMatches,
      querystring: queryOrig,
      bubbleUpCreateNew,
    })
  ) {
    updatedItems = newItems.concat(updatedItems);
  } else {
    updatedItems = updatedItems.concat(newItems);
  }
  return updatedItems;
}
