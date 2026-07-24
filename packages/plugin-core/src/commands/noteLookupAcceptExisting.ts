/**
 * Accept an existing note from lookup (optional selection process).
 */
import { NoteQuickInput } from "@dendronhq/common-all";
import _ from "lodash";
import { ExtensionProvider } from "../ExtensionProvider";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { node2Uri, PickerUtilsV2 } from "../components/lookup/utils";
import { NoteLookupAcceptReturn } from "./noteLookupAcceptTypes";

export async function acceptExistingLookupItem(opts: {
  item: NoteQuickInput;
  picker: DendronQuickPickerV2;
}): Promise<NoteLookupAcceptReturn | undefined> {
  const { item, picker } = opts;
  const uri = node2Uri(item);
  const originalNoteFromItem = PickerUtilsV2.noteQuickInputToNote(item);
  const originalNoteDeepCopy = _.cloneDeep(originalNoteFromItem);

  if (picker.selectionProcessFunc !== undefined) {
    const processedNode =
      await picker.selectionProcessFunc(originalNoteDeepCopy);
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
