/**
 * Prepare a stub note for create-new accept (schema + drop stub flag).
 */
import { NoteProps, NoteQuickInput, NoteUtils } from "@dendronhq/common-all";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";

/**
 * Removes stub frontmatter and applies schema when one matches.
 */
export async function prepareStubLookupItem(opts: {
  item: NoteQuickInput;
  engine: IEngineAPIService;
}): Promise<NoteProps> {
  const { item, engine } = opts;
  const noteFromItem = PickerUtilsV2.noteQuickInputToNote(item);
  return NoteUtils.updateStubWithSchema({
    stubNote: noteFromItem,
    engine,
  });
}
