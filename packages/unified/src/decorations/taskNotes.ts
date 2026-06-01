import {
  ConfigUtils,
  DendronConfig,
  ReducedDEngine,
  TaskNoteUtils,
  VaultUtils,
  VSRange,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Decoration, DECORATION_TYPES } from "./utils";

export type DecorationTaskNote = Decoration & {
  type: DECORATION_TYPES.taskNote;
  beforeText?: string;
  afterText?: string;
};

/** Decorates the note `fname` in vault `vaultName` if the note is a task note. */
export async function decorateTaskNote({
  engine,
  range,
  fname,
  vaultName,
  config,
}: {
  engine: ReducedDEngine;
  range: VSRange;
  fname: string;
  vaultName?: string;
  config: DendronConfig;
}) {
  const taskConfig = ConfigUtils.getTask(config);
  const vault =
    vaultName && config.workspace.vaults
      ? VaultUtils.getVaultByName({
          vname: vaultName,
          vaults: config.workspace.vaults,
        })
      : undefined;

  // Lean v2: conditional object literals (no undef-valued keys) for exactOptionalPropertyTypes on FindNoteOpts; length guard + ! (noUnchecked)
  const findOpts = vault ? { fname, vault } : { fname };
  const matching = await engine.findNotesMeta(findOpts);
  const note = matching.length > 0 ? matching[0]! : undefined;
  if (!note || !TaskNoteUtils.isTaskNote(note)) return;

  // Determines whether the task link is preceded by an empty or full checkbox
  const status = TaskNoteUtils.getStatusSymbol({ note, taskConfig });

  const { due, owner, priority } = note.custom;
  const decorationString: string[] = [];
  if (due) decorationString.push(`due:${due}`);
  if (owner) decorationString.push(`@${owner}`);
  if (priority) {
    const prioritySymbol = TaskNoteUtils.getPrioritySymbol({
      note,
      taskConfig,
    });
    if (prioritySymbol) decorationString.push(`priority:${prioritySymbol}`);
  }
  if (note.tags) {
    const tags = _.isString(note.tags) ? [note.tags] : note.tags;
    decorationString.push(...tags.map((tag) => `#${tag}`));
  }

  const decoration: DecorationTaskNote = {
    type: DECORATION_TYPES.taskNote,
    range,
    beforeText: status ? `${status} ` : undefined,
    afterText:
      decorationString.length > 0
        ? ` ${decorationString.join(" ")}`
        : undefined,
  };
  return decoration;
}
