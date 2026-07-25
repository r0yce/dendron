/**
 * Map engine decoration payloads → VS Code decoration options.
 */
import { DateTime, Decoration } from "@dendronhq/common-all";
import {
  DecorationHashTag,
  DecorationTaskNote,
  DecorationTimestamp,
  DecorationWikilink,
  DECORATION_TYPES,
  isDecorationHashTag,
  NoteRefDecorator,
} from "@dendronhq/unified";
import { ExtensionProvider } from "../ExtensionProvider";
import { CodeConfigKeys, DateTimeFormat } from "../types";
import { VSCodeUtils } from "../vsCodeUtils";
import {
  DendronDecoration,
  EDITOR_DECORATION_TYPES,
  HASHTAG_BORDER_COLOR,
  TASK_NOTE_DECORATION_COLOR,
} from "./windowDecorationTypes";

type DendronNoteRefDecoration = Required<
  DendronDecoration<NoteRefDecorator["data"]>
>;

export function mapDecoration(
  decoration: Decoration,
): DendronDecoration | undefined {
  switch (decoration.type) {
    case DECORATION_TYPES.timestamp:
      return mapTimestamp(decoration as DecorationTimestamp);
    case DECORATION_TYPES.brokenNoteRef:
    case DECORATION_TYPES.noteRef:
      return mapNoteRefLink(decoration as NoteRefDecorator);
    case DECORATION_TYPES.brokenWikilink:
    case DECORATION_TYPES.wikiLink:
      return mapWikilink(decoration as DecorationWikilink);
    case DECORATION_TYPES.taskNote:
      return mapTaskNote(decoration as DecorationTaskNote);
    default:
      return mapBasicDecoration(decoration);
  }
}

export function mapBasicDecoration(
  decoration: Decoration,
): DendronDecoration | undefined {
  const type = EDITOR_DECORATION_TYPES[decoration.type];
  if (!type) return undefined;

  return {
    type,
    decoration: {
      range: VSCodeUtils.toRangeObject(decoration.range),
    },
    data: decoration.data,
  };
}

export function mapTimestamp(
  decoration: DecorationTimestamp,
): DendronDecoration {
  const tsConfig = ExtensionProvider.getWorkspaceConfig().get(
    CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT,
  ) as DateTimeFormat;
  const formatOption = DateTime[tsConfig];
  const timestamp = DateTime.fromMillis(decoration.timestamp);
  return {
    type: EDITOR_DECORATION_TYPES.timestamp,
    decoration: {
      range: VSCodeUtils.toRangeObject(decoration.range),
      renderOptions: {
        after: {
          contentText: `  (${timestamp.toLocaleString(formatOption)})`,
        },
      },
    },
  };
}

export function mapNoteRefLink(
  decoration: NoteRefDecorator,
): DendronNoteRefDecoration | undefined {
  return mapBasicDecoration(decoration) as DendronNoteRefDecoration;
}

export function mapWikilink(
  decoration: DecorationWikilink | DecorationHashTag,
): DendronDecoration | undefined {
  if (isDecorationHashTag(decoration)) {
    const type = EDITOR_DECORATION_TYPES[decoration.type];
    if (!type) return undefined;
    return {
      type,
      decoration: {
        range: VSCodeUtils.toRangeObject(decoration.range),
        renderOptions: {
          before: {
            contentText: " ",
            width: "0.8rem",
            height: "0.8rem",
            margin: "auto 0.2rem",
            border: "1px solid",
            borderColor: HASHTAG_BORDER_COLOR,
            ...(decoration.color !== undefined
              ? { backgroundColor: decoration.color }
              : {}),
          },
        },
      },
    };
  }
  return mapBasicDecoration(decoration);
}

export function mapTaskNote(
  decoration: DecorationTaskNote,
): DendronDecoration | undefined {
  return {
    type: EDITOR_DECORATION_TYPES.taskNote,
    decoration: {
      range: VSCodeUtils.toRangeObject(decoration.range),
      renderOptions: {
        ...(decoration.beforeText !== undefined
          ? {
              before: {
                contentText: decoration.beforeText,
                color: TASK_NOTE_DECORATION_COLOR,
                fontWeight: "200",
              },
            }
          : {}),
        ...(decoration.afterText !== undefined
          ? {
              after: {
                contentText: decoration.afterText,
                color: TASK_NOTE_DECORATION_COLOR,
                fontWeight: "200",
              },
            }
          : {}),
      },
    },
  };
}
