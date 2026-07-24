import {
  ConfigUtils,
  NotePropsMeta,
  TaskNoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { QuickPickItem, QuickPickItemKind, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};
type CommandOutput = void;

type BoardItem = QuickPickItem & {
  note?: NotePropsMeta;
};

/**
 * Sprint 3: Task board lite — status-grouped QuickPick of task notes.
 */
export class TaskBoardCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.TASK_BOARD.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const engine = this._ext.getEngine();
    const config = this._ext.getDWorkspace().config;
    const taskConfig = ConfigUtils.getTask(config);

    let allMeta = await engine.findNotesMeta({ excludeStub: true });
    allMeta = WorkspaceModesService.filterNotesByFocus(allMeta);
    const tasks = allMeta.filter(
      (n) => !n.stub && TaskNoteUtils.isTaskNote(n)
    ) as (NotePropsMeta & {
      custom?: { status?: string; due?: string; priority?: string };
    })[];

    if (tasks.length === 0) {
      window.showInformationMessage(
        "No task notes found. Create one with Dendron: Create Task Note (or Hub → Create Task)."
      );
      return;
    }

    const complete = new Set(
      (taskConfig.taskCompleteStatus || ["done", "x"]).map((s) =>
        s.toLowerCase()
      )
    );

    const byStatus = _.groupBy(tasks, (t) => {
      const raw = (t.custom?.status ?? "").toString().trim();
      if (!raw) return "open";
      if (complete.has(raw.toLowerCase())) return "done";
      return raw;
    });

    // Preferred column order
    const order = [
      "open",
      "wip",
      "pending",
      "blocked",
      "assigned",
      "delegated",
      "moved",
      "dropped",
      "done",
    ];
    const statuses = _.uniq([...order, ...Object.keys(byStatus)]);

    const items: BoardItem[] = [];
    for (const status of statuses) {
      const group = byStatus[status];
      if (!group || group.length === 0) continue;

      items.push({
        label: status.toUpperCase(),
        kind: QuickPickItemKind.Separator,
        description: `${group.length}`,
      });

      const sorted = _.orderBy(group, (n) => n.updated, "desc");
      for (const note of sorted) {
        const symbol =
          TaskNoteUtils.getStatusSymbol({
            note: note as any,
            taskConfig,
          }) || status;
        const due = note.custom?.due ? `due ${note.custom.due}` : undefined;
        const pri = note.custom?.priority
          ? `P:${note.custom.priority}`
          : undefined;
        const detail = _.compact([due, pri]).join(" · ");
        items.push({
          label: `$(check) [${symbol}] ${note.title || note.fname}`,
          description: note.fname,
          ...(detail ? { detail } : {}),
          note,
        });
      }
    }

    const picked = await window.showQuickPick(items, {
      title: `Task Board · ${tasks.length} tasks`,
      placeHolder: "Open a task note",
      matchOnDescription: true,
      matchOnDetail: true,
    });
    if (!picked?.note) {
      return;
    }

    await new GotoNoteCommand(this._ext).execute({
      qs: picked.note.fname,
      vault: picked.note.vault,
    });
  }
}
