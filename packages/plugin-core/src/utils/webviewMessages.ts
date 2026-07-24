import {
  DMessageEnum,
  DMessageSource,
  NoteProps,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { toWebviewNoteMeta } from "./webviewNoteMeta";

export type BuildActiveEditorMsgOpts = {
  note?: NoteProps | undefined;
  activeNote?: NoteProps | undefined;
  /** Full workspace re-sync (expensive — avoid on every focus). Default false. */
  sync?: boolean;
  /** Single-note engine refresh in webview. Default true for graph/calendar. */
  syncChangedNote?: boolean;
  source?: "vscode" | DMessageSource;
};

/**
 * Build the standard host → webview "active editor changed" payload.
 *
 * Always strips note bodies (payload diet). Graph / calendar / schema hosts
 * should use this instead of hand-rolling postMessage shapes.
 */
export function buildActiveEditorMsg(
  opts: BuildActiveEditorMsgOpts
): OnDidChangeActiveTextEditorMsg {
  const syncChangedNote = opts.syncChangedNote ?? true;
  const sync = opts.sync ?? false;
  return {
    type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
    data: {
      note: toWebviewNoteMeta(opts.note),
      activeNote: toWebviewNoteMeta(opts.activeNote),
      sync,
      syncChangedNote,
    },
    source: opts.source ?? DMessageSource.vscode,
  } as OnDidChangeActiveTextEditorMsg;
}
