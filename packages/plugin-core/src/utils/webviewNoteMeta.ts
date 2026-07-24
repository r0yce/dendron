import { NoteProps } from "@dendronhq/common-all";

/**
 * Strip note bodies from webview postMessage payloads.
 * Graph/calendar/schema only need metadata + links; bodies dominate payload size.
 */
export function toWebviewNoteMeta(
  note: NoteProps | undefined
): NoteProps | undefined {
  if (!note) {
    return note;
  }
  if (!note.body) {
    return note;
  }
  return { ...note, body: "" };
}
