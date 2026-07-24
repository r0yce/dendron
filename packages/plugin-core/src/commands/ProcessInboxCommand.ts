import {
  NoteProps,
  NoteUtils,
  TaskNoteUtils,
  Time,
} from "@dendronhq/common-all";
import { QuickPickItem, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};
type CommandOutput = void;

type Bullet = { lineIdx: number; text: string; raw: string };

const INBOX_FNAME = "inbox";

/**
 * Sprint 5: Process inbox bullets → note / task / journal / dismiss.
 */
export class ProcessInboxCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.PROCESS_INBOX.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const engine = this._ext.getEngine();
    const vault = WorkspaceModesService.resolveWriteVault();
    if (!vault) {
      window.showErrorMessage("No vault for inbox processing");
      return;
    }

    let inbox = (await engine.findNotes({ fname: INBOX_FNAME, vault }))[0];
    if (!inbox) {
      window.showInformationMessage(
        "No inbox note yet. Use Dendron: Capture to Inbox first."
      );
      return;
    }

    const bullets = this.parseOpenBullets(inbox.body || "");
    if (bullets.length === 0) {
      window.showInformationMessage("Inbox has no open bullets to process.");
      await new GotoNoteCommand(this._ext).execute({
        qs: INBOX_FNAME,
        vault,
      });
      return;
    }

    // Process one-by-one for a clear triage UX
    let processed = 0;

    for (const bullet of bullets) {
      const action = await window.showQuickPick(
        [
          {
            label: "$(file) Promote to note",
            description: "Create note from capture text",
            id: "note",
          },
          {
            label: "$(checklist) Promote to task",
            description: "Create task note + mark done in inbox",
            id: "task",
          },
          {
            label: "$(calendar) Append to daily journal",
            description: "Add under today's journal",
            id: "journal",
          },
          {
            label: "$(check) Dismiss",
            description: "Mark done without creating anything",
            id: "dismiss",
          },
          {
            label: "$(debug-step-over) Skip",
            description: "Leave for later",
            id: "skip",
          },
          {
            label: "$(close) Stop processing",
            id: "stop",
          },
        ] as (QuickPickItem & { id: string })[],
        {
          title: `Process inbox (${bullets.length - processed} left)`,
          placeHolder: bullet.text.slice(0, 80),
          ignoreFocusOut: true,
        }
      );

      if (!action || action.id === "stop") break;
      if (action.id === "skip") continue;

      if (action.id === "note") {
        const fname = this.slugify(bullet.text).slice(0, 80) || "capture";
        const note = NoteUtils.create({
          fname,
          vault,
          title: bullet.text.slice(0, 80),
          body: `# ${bullet.text}\n\n_From inbox ${Time.now().toFormat(
            "y-MM-dd HH:mm"
          )}_\n`,
        }) as NoteProps;
        await engine.writeNote(note);
      } else if (action.id === "task") {
        const fname = `task.${this.slugify(bullet.text).slice(0, 60)}`;
        const base = NoteUtils.create({
          fname,
          vault,
          title: bullet.text.slice(0, 80),
          body: `# ${bullet.text}\n\n_From inbox_\n`,
        }) as NoteProps;
        const taskProps = TaskNoteUtils.genDefaultTaskNoteProps(
          base,
          // use engine config defaults
          {
            name: "task",
            dateFormat: "y.MM.dd",
            addBehavior: "asOwnDomain" as any,
            statusSymbols: { "": " ", wip: "w", done: "x" },
            taskCompleteStatus: ["done", "x"],
            prioritySymbols: {},
            todoIntegration: false,
            createTaskSelectionType: "selection2link" as any,
          }
        );
        const note = {
          ...base,
          custom: { ...taskProps.custom, status: "" },
        } as NoteProps;
        await engine.writeNote(note);
      } else if (action.id === "journal") {
        const journalFname = `daily.journal.${Time.now().toFormat("y.MM.dd")}`;
        let journal = (
          await engine.findNotes({ fname: journalFname, vault })
        )[0];
        if (!journal) {
          journal = NoteUtils.create({
            fname: journalFname,
            vault,
            title: Time.now().toFormat("y-MM-dd"),
            body: `# ${Time.now().toFormat("y-MM-dd")}\n\n## Captures\n\n`,
          }) as NoteProps;
        }
        journal = {
          ...journal,
          body: `${journal.body.trimEnd()}\n- ${bullet.text}\n`,
        };
        await engine.writeNote(journal);
      }

      processed += 1;
      // track which were processed by raw line
      (bullet as any)._done = true;
    }

    // Re-fetch inbox and write cleaned body
    inbox = (await engine.findNotes({ fname: INBOX_FNAME, vault }))[0] || inbox;
    const doneBullets = bullets.filter((b) => (b as any)._done);
    const finalBody = this.markProcessedInBody(inbox.body || "", doneBullets);
    await engine.writeNote({ ...inbox, body: finalBody });

    window.showInformationMessage(
      `Processed ${processed} inbox item(s). ${Math.max(
        0,
        bullets.length - processed
      )} remaining.`
    );
  }

  private parseOpenBullets(body: string): Bullet[] {
    const lines = body.split("\n");
    const out: Bullet[] = [];
    lines.forEach((raw, lineIdx) => {
      const m = raw.match(/^- (?:\[ \] )?(.+)$/);
      if (!m) return;
      if (raw.includes("[x]") || raw.includes("[X]")) return;
      const text = m[1]!.replace(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} — /, "").trim();
      if (!text || text.startsWith("#")) return;
      out.push({ lineIdx, text, raw });
    });
    return out;
  }

  private markProcessedInBody(body: string, done: Bullet[]): string {
    const doneTexts = new Set(done.map((d) => d.raw));
    return body
      .split("\n")
      .map((line) => {
        if (!doneTexts.has(line)) return line;
        if (line.includes("[x]") || line.includes("[X]")) return line;
        if (line.startsWith("- [ ] ")) return line.replace("- [ ] ", "- [x] ");
        if (line.startsWith("- ")) return line.replace("- ", "- [x] ");
        return line;
      })
      .join("\n");
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 64);
  }
}
