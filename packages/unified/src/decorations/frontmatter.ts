import {
  IDendronError,
  isNotUndefined,
  NoteUtils,
  point2VSCodePosition,
  TAGS_HIERARCHY,
} from "@dendronhq/common-all";
import { FrontmatterContent } from "mdast";
import { decorateTag, DecorationHashTag } from "./hashTags";
import { Decoration, DECORATION_TYPES, Decorator } from "./utils";
import _ from "lodash";
import { getFrontmatterTags, parseFrontmatter } from "../yaml";

export type DecorationTimestamp = Decoration & {
  type: DECORATION_TYPES.timestamp;
  timestamp: number;
};

type DecorationsForDecorateFrontmatter =
  | DecorationTimestamp
  | DecorationHashTag;

export const decorateFrontmatter: Decorator<
  FrontmatterContent,
  DecorationsForDecorateFrontmatter
> = async (opts) => {
  const { node: frontmatter, config, engine, note } = opts;
  const { value: contents, position } = frontmatter;
  // Decorate the timestamps

  const entries = contents.split("\n");
  // position from DecoratorIn<FrontmatterContent> (NonOptional on "position"); start required per common-all Position
  // Added defensive for noUncheckedIndexedAccess strict (unified decorations cluster, first-3 clean-build)
  const fmStart = position.start;
  const lineOffset =
    point2VSCodePosition(fmStart).line +
    1; /* `---` line of frontmatter */
  const timestampDecorations = entries
    .map((entry, line): undefined | DecorationTimestamp => {
      const match = NoteUtils.RE_FM_UPDATED_OR_CREATED.exec(entry);
      if (!_.isNull(match) && match.groups?.timestamp) {
        const timestamp = _.toInteger(match.groups.timestamp);
        // Lean v2: ! after groups guard for noUncheckedIndexedAccess on regex (groups partials guaranteed); ?? hygiene
        const groups = match.groups!;
        const before = groups.beforeTimestamp ?? "";
        const tsStr = groups.timestamp ?? "";
        const decoration: DecorationTimestamp = {
          range: {
            start: {
              line: line + lineOffset,
              character: before.length,
            },
            end: {
              line: line + lineOffset,
              character: before.length + tsStr.length,
            },
          },
          timestamp,
          type: DECORATION_TYPES.timestamp,
        };
        return decoration;
      }
      return undefined;
    })
    .filter(isNotUndefined);

  // Decorate the frontmatter tags
  const tags = getFrontmatterTags(parseFrontmatter(contents));
  const tagDecorations: DecorationHashTag[] = [];
  const errors: IDendronError[] = [];
  await Promise.all(
    tags.map(async (tag) => {
      const { errors, decorations } = await decorateTag({
        fname: `${TAGS_HIERARCHY}${tag.value}`,
        position: tag.position,
        lineOffset,
        config,
        engine,
        note,
      }); // position/anchor optionals + PointOffset via decorateTag/position2VSCodeRange (Batch 1/2 decorations cluster; 4-axis in hashTags.ts)
      tagDecorations.push(...decorations);
      errors.push(...errors);
    })
  );
  const decorations: DecorationsForDecorateFrontmatter[] = [
    ...tagDecorations,
    ...timestampDecorations,
  ];
  return {
    decorations,
    errors,
  };
};
