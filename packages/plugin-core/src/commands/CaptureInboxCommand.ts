import { NoteProps, NoteUtils, Time } from "@dendronhq/common-all";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = { text?: string };
type CommandOutput = void;

const INBOX_FNAME = "inbox";

/**
 * Sprint 3: Capture to inbox — fast append of a thought without lookup ceremony.
 */
export class CaptureInboxCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CAPTURE_INBOX.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandOpts | undefined> {
    if (opts?.text) {
      return opts;
    }
    const text = await window.showInputBox({
      title: "Capture to Inbox",
      placeHolder: "What's on your mind?",
      prompt: "Appended to the `inbox` note with a timestamp",
      ignoreFocusOut: true,
    });
    if (text === undefined) {
      return;
    }
    if (!text.trim()) {
      window.showWarningMessage("Capture cancelled — empty capture.");
      return;
    }
    return { text: text.trim() };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const text = opts.text?.trim();
    if (!text) {
      return;
    }

    const engine = this._ext.getEngine();
    const vault = WorkspaceModesService.resolveWriteVault();
    if (!vault) {
      window.showErrorMessage("No vault available for inbox capture");
      return;
    }

    let note = (await engine.findNotes({ fname: INBOX_FNAME, vault }))[0];
    const stamp = Time.now().toFormat("y-MM-dd HH:mm");
    const entry = `- ${stamp} — ${text}`;

    if (!note) {
      note = NoteUtils.create({
        fname: INBOX_FNAME,
        vault,
        title: "Inbox",
        body: [
          "# Inbox",
          "",
          "Quick captures. Process these into real notes when ready.",
          "",
          entry,
          "",
        ].join("\n"),
      }) as NoteProps;
    } else {
      const body = note.body?.trimEnd() ?? "";
      note = {
        ...note,
        body: body ? `${body}\n${entry}\n` : `${entry}\n`,
      };
    }

    await engine.writeNote(note);

    const choice = await window.showInformationMessage(
      `Captured to inbox: ${text.slice(0, 60)}${text.length > 60 ? "…" : ""}`,
      "Open Inbox"
    );
    if (choice === "Open Inbox") {
      await new GotoNoteCommand(this._ext).execute({
        qs: INBOX_FNAME,
        vault: note.vault,
      });
    }
  }
}
