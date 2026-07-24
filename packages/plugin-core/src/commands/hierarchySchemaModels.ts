/**
 * Pure hierarchy models for CreateSchemaFromHierarchyCommand.
 * No VS Code / engine deps (except types).
 */
import { NotePropsMeta } from "@dendronhq/common-all";

/**
 * Represents the level of the file hierarchy that will have the '*' pattern.
 */
export class HierarchyLevel {
  label: string;
  hierarchyTokens: string[];
  idx: number;
  noteMatchRegex: RegExp;

  constructor(idx: number, tokens: string[]) {
    this.hierarchyTokens = tokens;
    this.idx = idx;
    // https://regex101.com/r/kmOBbq/1
    this.noteMatchRegex = new RegExp(
      "^" + this.hierarchyTokens.slice(0, this.idx).join(".") + "\\..*"
    );
    this.label =
      [...tokens.slice(0, idx), "*", ...tokens.slice(idx + 1)].join(".") +
      ` (${tokens[idx]})`;
  }

  /** Id of the first token of the hierarchy (schema id). */
  topId() {
    return this.hierarchyTokens[0];
  }

  tokenize(fname: string): string[] {
    const tokens = fname.split(".");
    return [...tokens.slice(0, this.idx), "*", ...tokens.slice(this.idx + 1)];
  }

  isCandidateNote(fname: string): boolean {
    return this.noteMatchRegex.test(fname);
  }

  getDefaultSchemaName() {
    // Schema naming is single-level deep; avoid '.' in schema names.
    return this.hierarchyTokens.slice(0, this.idx).join("-");
  }
}

export class Hierarchy {
  fname: string;
  levels: HierarchyLevel[];
  tokens: string[];

  constructor(fname: string) {
    this.fname = fname;
    this.tokens = fname.split(".");
    this.levels = [];
    for (let i = 0; i < this.tokens.length; i += 1) {
      this.levels.push(new HierarchyLevel(i, this.tokens));
    }
  }

  depth() {
    return this.tokens.length;
  }

  topId() {
    return this.levels.length > 0 ? this.levels[0]!.topId() : undefined;
  }

  /**
   * Levels viable for schema creation (skip first to avoid `*.h1.h2` matching all).
   */
  getSchemaebleLevels() {
    return this.levels.slice(1);
  }
}

export type SchemaCandidate = {
  note: NotePropsMeta;
  label: string;
  detail: string;
};

export function isDescendentOf(
  descendentCandidate: SchemaCandidate,
  ancestorCandidate: SchemaCandidate
) {
  return descendentCandidate.note.fname.startsWith(
    ancestorCandidate.note.fname + "."
  );
}

export function createCandidatesMapByFname(items: readonly SchemaCandidate[]) {
  return new Map(items.map((item) => [item.note.fname, item]));
}

export enum StopReason {
  SCHEMA_WITH_TOP_ID_ALREADY_EXISTS = "SCHEMA_WITH_TOP_ID_ALREADY_EXISTS",
  NOTE_DID_NOT_HAVE_REQUIRED_DEPTH = "NOTE_DID_NOT_HAVE_REQUIRED_DEPTH",
  DID_NOT_PICK_HIERARCHY_LEVEL = "DID_NOT_PICK_HIERARCHY_LEVEL",
  CANCELLED_PATTERN_SELECTION = "CANCELLED_PATTERN_SELECTION",
  UNSELECTED_ALL_PATTERNS = "UNSELECTED_ALL_PATTERNS",
  DID_NOT_PICK_SCHEMA_FILE_NAME = "DID_NOT_PICK_SCHEMA_FILE_NAME",
}

/** Pure multi-select hierarchy pattern helpers (used by UserQueries QuickPick). */
export function hasSelected(
  prevSelected: readonly SchemaCandidate[],
  currSelected: readonly SchemaCandidate[]
) {
  return prevSelected.length < currSelected.length;
}

export function hasUnselected(
  prevSelected: readonly SchemaCandidate[],
  currSelected: readonly SchemaCandidate[]
) {
  return prevSelected.length > currSelected.length;
}

export function findUncheckedItem(
  prevSelected: readonly SchemaCandidate[],
  currSelected: readonly SchemaCandidate[]
) {
  const map = createCandidatesMapByFname(currSelected);
  return prevSelected.filter((item) => !map.has(item.note.fname))[0];
}

export function findCheckedItem(
  prevSelected: readonly SchemaCandidate[],
  currSelected: readonly SchemaCandidate[]
) {
  const map = createCandidatesMapByFname(prevSelected);
  return currSelected.filter((item) => !map.has(item.note.fname))[0]!;
}

export function determineAfterSelect(
  prevSelected: readonly SchemaCandidate[],
  currSelected: readonly SchemaCandidate[],
  all: SchemaCandidate[]
) {
  const justChecked = findCheckedItem(prevSelected, currSelected);
  const ancestorsToCheck = all.filter((ancestorCandidate) =>
    isDescendentOf(justChecked, ancestorCandidate)
  );
  const selectedMap = createCandidatesMapByFname(currSelected);
  ancestorsToCheck.forEach((ancestor) =>
    selectedMap.set(ancestor.note.fname, ancestor)
  );
  return Array.from(selectedMap.values());
}

export function determineAfterUnselect(
  prevSelected: readonly SchemaCandidate[],
  currSelected: readonly SchemaCandidate[]
) {
  const justUnchecked = findUncheckedItem(prevSelected, currSelected);
  return currSelected.filter(
    (item) =>
      justUnchecked === undefined || !isDescendentOf(item, justUnchecked)
  );
}
