/**
 * VS Code decoration type registry + Dendron decoration shape.
 */
import { DECORATION_TYPES } from "@dendronhq/unified";
import {
  DecorationOptions,
  DecorationRangeBehavior,
  TextEditorDecorationType,
  ThemeColor,
  window,
} from "vscode";

/** Wait this long in miliseconds before trying to update decorations when a command forces a decoration update. */
export const DECORATION_UPDATE_DELAY = 100;

/** Decorators only decorate what's visible on the screen. To avoid the user
 * seeing undecorated text if they scroll too quickly, we decorate some of the
 * text surrounding what's visible on the screen. This number determines how
 * many lines (above top and below bottom) surrounding the visible text should
 * be decorated. */
export const VISIBLE_RANGE_MARGIN = 20;

/** Color used to highlight the decorator text portions ([x], priority:high etc.) of task notes. */
export const TASK_NOTE_DECORATION_COLOR = new ThemeColor(
  "editorLink.activeForeground",
);

/** Color used for the border of the colored square of hashtags. */
export const HASHTAG_BORDER_COLOR = new ThemeColor("foreground");

export const EDITOR_DECORATION_TYPES: {
  [key in keyof typeof DECORATION_TYPES]: TextEditorDecorationType;
} = {
  timestamp: window.createTextEditorDecorationType({}),
  blockAnchor: window.createTextEditorDecorationType({
    opacity: "40%",
    rangeBehavior: DecorationRangeBehavior.ClosedOpen,
  }),
  /** Decorations for wikilinks that point to valid notes. */
  wikiLink: window.createTextEditorDecorationType({
    color: new ThemeColor("editorLink.activeForeground"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  /** Decorations for wikilinks that do *not* point to valid notes (e.g. broken). */
  brokenWikilink: window.createTextEditorDecorationType({
    color: new ThemeColor("editorWarning.foreground"),
    backgroundColor: new ThemeColor("editorWarning.background"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  /** Decorations for the alias part of wikilinks. */
  alias: window.createTextEditorDecorationType({
    fontStyle: "italic",
  }),
  noteRef: window.createTextEditorDecorationType({
    color: new ThemeColor("editorLink.activeForeground"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  brokenNoteRef: window.createTextEditorDecorationType({
    color: new ThemeColor("editorWarning.foreground"),
    backgroundColor: new ThemeColor("editorWarning.background"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  taskNote: window.createTextEditorDecorationType({
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
};

export type DendronDecoration<T = any> = {
  /**
   * type: mapping of {@link: DECORATION_TYPES} -> {@link: TextEditorDecorationType}
   */
  type: TextEditorDecorationType;
  /**
   * VSCode DecorationOptions
   */
  decoration: DecorationOptions;
  /**
   * Specific to type of decoration
   */
  data?: T;
};
