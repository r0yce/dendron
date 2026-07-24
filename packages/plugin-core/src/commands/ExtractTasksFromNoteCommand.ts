import {
  NoteProps,
  NoteUtils,
  TaskNoteUtils,
  Time,
} from "@dendronhq/common-all";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import {
  extractOpenBullets,
  slugifyTaskTitle,
} from "../utils/noteBodyUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = { created: number };

/**
 * Sprint 5: One high-value local AI/action loop —
 * extract markdown bullets from the active note into task notes.
 * Works fully offline (no model required).
 */
export class ExtractTasksFromNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.EXTRACT_TASKS_FROM_NOTE.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const note = await this._ext.wsUtils.getActiveNote();
    if (!note) {
      window.showWarningMessage("Open a note first.");
      return { created: 0 };
    }

    const bullets = extractOpenBullets(note.body || "", 25);

    if (bullets.length === 0) {
      window.showInformationMessage(
        "No open bullets found in the active note to promote to tasks."
      );
      return { created: 0 };
    }

    const confirm = await window.showQuickPick(
      [
        {
          label: `Create ${bullets.length} task note(s)`,
          description: "From open bullets in this note",
        },
        { label: "Cancel" },
      ],
      { title: "Extract Tasks from Note" }
    );
    if (!confirm || confirm.label === "Cancel") {
      return { created: 0 };
    }

    const vault =
      WorkspaceModesService.resolveWriteVault() || note.vault;
    const engine = this._ext.getEngine();
    let created = 0;

    for (const text of bullets) {
      const slug = slugifyTaskTitle(text);
      const fname = `task.${Time.now().toFormat("y.MM.dd")}.${slug || "item"}`;
      const base = NoteUtils.create({
        fname,
        vault,
        title: text.slice(0, 80),
        body: [
          `# ${text}`,
          ``,
          `_Extracted from [[${note.title}|${note.fname}]]_`,
          ``,
        ].join("\n"),
      }) as NoteProps;
      const taskProps = TaskNoteUtils.genDefaultTaskNoteProps(base, {
        name: "task",
        dateFormat: "y.MM.dd",
        addBehavior: "asOwnDomain" as any,
        statusSymbols: { "": " ", wip: "w", done: "x" },
        taskCompleteStatus: ["done", "x"],
        prioritySymbols: {},
        todoIntegration: false,
        createTaskSelectionType: "selection2link" as any,
      });
      await engine.writeNote({
        ...base,
        custom: { ...taskProps.custom, status: "" },
      } as NoteProps);
      created += 1;
    }

    window.showInformationMessage(
      `Created ${created} task note(s). Open Dendron: Task Board to review.`
    );
    return { created };
  }
}
