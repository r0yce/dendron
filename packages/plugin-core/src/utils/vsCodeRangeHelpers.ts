/**
 * Pure range / point helpers (no vscode). Node-smokeable.
 * VSCodeUtils wraps these with vscode.Position / Range.
 */
import { newRange, VSRange } from "@dendronhq/common-all";
import _ from "lodash";

export type PointLike = { line: number; column: number };
export type PointOffset = { line?: number; column?: number };
export type PositionLike = { start: PointLike; end: PointLike };
export type PlainPos = { line: number; character: number };
export type PlainRange = { start: PlainPos; end: PlainPos };

/** remark Point (1-indexed) → 0-indexed editor coords. */
export function pointToZeroIndexed(
  point: PointLike,
  offset?: PointOffset,
): PlainPos {
  return {
    line: point.line - 1 + (offset?.line || 0),
    character: point.column - 1 + (offset?.column || 0),
  };
}

/** remark Position → plain 0-indexed range. */
export function positionToPlainRange(
  position: PositionLike,
  offset?: PointOffset,
): PlainRange {
  return {
    start: pointToZeroIndexed(position.start, offset),
    end: pointToZeroIndexed(position.end, offset),
  };
}

/** Extend start/end lines of a range by `padding` many lines. */
export function padPlainRange(opts: {
  range: PlainRange;
  padding: number;
  zeroCharacter?: boolean | undefined;
}): PlainRange {
  const { range, padding, zeroCharacter } = opts;
  return {
    start: {
      line: Math.max(range.start.line - padding, 0),
      character: zeroCharacter ? 0 : range.start.character,
    },
    end: {
      line: range.end.line + padding,
      character: zeroCharacter ? 0 : range.end.character,
    },
  };
}

function rangesIntersect(a: PlainRange, b: PlainRange): boolean {
  // Same semantics as vscode.Range.intersection for non-empty ranges:
  // overlap if a starts before b ends and b starts before a ends.
  const aStart = a.start.line * 1e9 + a.start.character;
  const aEnd = a.end.line * 1e9 + a.end.character;
  const bStart = b.start.line * 1e9 + b.start.character;
  const bEnd = b.end.line * 1e9 + b.end.character;
  return aStart < bEnd && bStart < aEnd;
}

function unionRange(a: PlainRange, b: PlainRange): PlainRange {
  const aStart = a.start.line * 1e9 + a.start.character;
  const bStart = b.start.line * 1e9 + b.start.character;
  const aEnd = a.end.line * 1e9 + a.end.character;
  const bEnd = b.end.line * 1e9 + b.end.character;
  const start = aStart <= bStart ? a.start : b.start;
  const end = aEnd >= bEnd ? a.end : b.end;
  return { start, end };
}

/** Merge overlapping plain ranges. No two returned ranges overlap. */
export function mergeOverlappingPlainRanges(
  ranges: PlainRange[],
): PlainRange[] {
  const out: PlainRange[] = [];
  let working = _.sortBy(
    ranges,
    (range) => range.start.line,
    (range) => range.start.character,
  );
  // Reverse them so `.pop()` gives us the earliest list element.
  working = working.slice().reverse();

  while (working.length > 0) {
    let earliest = working.pop();
    if (!earliest) break;
    while (working.length > 0) {
      const next = working[working.length - 1]!;
      if (!rangesIntersect(earliest, next)) break;
      earliest = unionRange(earliest, next);
      working.pop();
    }
    out.push(earliest);
  }
  return out;
}

export function plainRangeToVSRange(range: PlainRange): VSRange {
  return newRange(
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character,
  );
}

export function vsRangeToPlain(range: {
  start: { line: number; character: number };
  end: { line: number; character: number };
}): PlainRange {
  return {
    start: { line: range.start.line, character: range.start.character },
    end: { line: range.end.line, character: range.end.character },
  };
}
