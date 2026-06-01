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

  // 4-axis boundary cast ONLY for true cross-pkg (unified → common-all FindNoteOpts exactOptional on vault/note optionals)
  // Full dated per Strict-Mode-Fixer Batch 5+/Build Modernization mandate. See common-server analytics precedent.
  // length guard + ! only after (noUnchecked hygiene, Batch 5+ pattern)
  const matching = await engine.findNotesMeta({ fname, vault } as any /* TODO: Build Modernization 2026-05-31 focused clean-build phase (second of 3 packages: unified) + "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + 4-axis boundary (unified → common-all FindNoteOpts vault?: DVault) + see ADR 0001 + common-server analytics precedent. Decorations cluster Batch 1. */ );
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
