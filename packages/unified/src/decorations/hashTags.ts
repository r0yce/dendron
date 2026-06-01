import {
  ConfigUtils,
  DendronConfig,
  NoteProps,
  NoteUtils,
  Position,
  position2VSCodeRange,
  ReducedDEngine,
} from "@dendronhq/common-all";
import { HashTag } from "../types";
import { Decorator } from "./utils";
import { DecorationWikilink, linkedNoteType } from "./wikilinks";

export type DecorationHashTag = DecorationWikilink & {
  color?: string;
};

export function isDecorationHashTag(
  decoration: DecorationWikilink
): decoration is DecorationHashTag {
  return (decoration as DecorationHashTag).color !== undefined;
}

export const decorateHashTag: Decorator<HashTag, DecorationHashTag> = (
  opts
) => {
  const { node: hashtag, engine, config, note } = opts;
  const { position } = hashtag;
  return decorateTag({
    fname: hashtag.fname,
    engine,
    position,
    config,
    note,
  });
};

export async function decorateTag({
  fname,
  engine,
  position,
  lineOffset,
  config,
  note,
}: {
  fname: string;
  engine: ReducedDEngine;
  position: Position;
  lineOffset?: number;
  config: DendronConfig;
  note?: NoteProps;
}) {
  let color: string | undefined;
  const { color: foundColor, type: colorType } = NoteUtils.color({
    fname,
    note,
    // engine,
  });
  const enableRandomlyColoredTags =
    ConfigUtils.getPublishing(config).enableRandomlyColoredTags;
  if (colorType === "configured" || enableRandomlyColoredTags) {
    color = foundColor;
  }

  const { type, errors } = await linkedNoteType({
    fname,
    engine,
    vaults: config.workspace?.vaults ?? [],
  });
  const decoration: DecorationHashTag = {
    type,
    range: position2VSCodeRange(position, { line: lineOffset ?? undefined } as any /* TODO: Build Modernization 2026-05-31 focused clean-build phase (second of 3 packages: unified). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" (user explicit after timestamp pivot + this cycle). 4-axis boundary (unified decorations → common-all PointOffset/position2VSCodeRange). See ADR 0001 + common-server analytics precedent (target-first widen + ?? hygiene + boundary cast only here). Batch 1/2 of decorations cluster. No bare @ts. */),
    color,
  };

  return { errors, decorations: [decoration] };
}
