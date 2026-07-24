import { NoteProps } from "@dendronhq/common-all";

/**
 * Strip note bodies from webview postMessage payloads.
 *
 * **Why:** Graph, calendar, and schema webviews need id/fname/title/links/hierarchy —
 * not markdown bodies. Shipping full vault note bodies was the largest webview cost.
 *
 * **Use for:** any host → webview `ON_DID_CHANGE_ACTIVE_TEXT_EDITOR` (or similar)
 * where the UI does not render the note body itself. Preview HTML path should also
 * strip body when HTML is already provided.
 *
 * Prefer this helper over ad-hoc `{ ...note, body: "" }` so diet stays consistent.
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
