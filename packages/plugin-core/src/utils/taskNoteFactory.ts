import {
  ConfigUtils,
  DVault,
  NoteProps,
  NoteUtils,
  TaskNoteUtils,
  Time,
} from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { slugifyTaskTitle } from "./noteBodyUtils";

export type CreateTaskNoteOpts = {
  /** Display title / first heading source. */
  title: string;
  vault: DVault;
  /** Optional markdown body; default is a single H1 from title. */
  body?: string;
  /** Override fname; default `task.{y.MM.dd}.{slug}`. */
  fname?: string;
  /** Initial custom.status (default empty = open). */
  status?: string;
};

/**
 * Create a task note using **workspace task config** (not hard-coded defaults).
 * Shared by Process Inbox, Extract Tasks, and future rituals.
 */
export async function createTaskNoteFromTitle(
  ext: IDendronExtension,
  opts: CreateTaskNoteOpts
): Promise<NoteProps> {
  const engine = ext.getEngine();
  const config = ext.getDWorkspace().config;
  const taskConfig = ConfigUtils.getTask(config);

  const slug = slugifyTaskTitle(opts.title);
  const fname =
    opts.fname ||
    `task.${Time.now().toFormat("y.MM.dd")}.${slug || "item"}`;
  const body =
    opts.body ??
    [`# ${opts.title}`, ``, `_Task note_`, ``].join("\n");

  const base = NoteUtils.create({
    fname,
    vault: opts.vault,
    title: opts.title.slice(0, 80),
    body,
  }) as NoteProps;

  const taskProps = TaskNoteUtils.genDefaultTaskNoteProps(base, taskConfig);
  const note = {
    ...base,
    custom: {
      ...taskProps.custom,
      status: opts.status ?? "",
    },
  } as NoteProps;

  await engine.writeNote(note);
  return note;
}
