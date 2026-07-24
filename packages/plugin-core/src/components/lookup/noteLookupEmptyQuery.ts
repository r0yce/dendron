/**
 * Empty-query (root-level) results for note lookup.
 */
import { DEngineClient, NoteQuickInput } from "@dendronhq/common-all";
import { WorkspaceModesService } from "../../services/WorkspaceModesService";
import { NotePickerUtils } from "./NotePickerUtils";

/**
 * First-level notes for an empty lookup query, with vault focus applied
 * and optional extraItems (e.g. command-specific sentinels) prepended.
 */
export async function fetchEmptyNoteQueryItems(opts: {
  engine: DEngineClient;
  extraItems?: NoteQuickInput[] | undefined;
}): Promise<NoteQuickInput[]> {
  let items = await NotePickerUtils.fetchRootQuickPickResults({
    engine: opts.engine,
  });
  items = WorkspaceModesService.filterNotesByFocus(items as any) as any;
  if (opts.extraItems?.length) {
    items = [...opts.extraItems, ...items];
  }
  return items;
}
