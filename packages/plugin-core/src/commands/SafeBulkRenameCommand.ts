import { NotePropsMeta, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import path from "path";
import {
  ProgressLocation,
  Uri,
  ViewColumn,
  window,
  workspace,
} from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { BasicCommand } from "./base";
import { RenameNoteV2aCommand } from "./RenameNoteV2a";

type CommandOpts = {
  match: string;
  replace: string;
};

type CommandOutput = { applied: number; planned: number };

type PlanRow = {
  oldFname: string;
  newFname: string;
  vaultName: string;
  note: NotePropsMeta;
};

/**
 * Sprint 4: safe bulk rename — dry-run preview of hierarchy renames, then apply.
 */
export class SafeBulkRenameCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SAFE_BULK_RENAME.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const match = await window.showInputBox({
      title: "Safe Bulk Rename · match",
      prompt: "Regex matched against full note fname (e.g. ^proj\\.old)",
      placeHolder: "^oldPrefix",
      ignoreFocusOut: true,
    });
    if (match === undefined || !match.trim()) return;

    try {
      // eslint-disable-next-line no-new
      new RegExp(match);
    } catch (err: any) {
      window.showErrorMessage(`Invalid regex: ${err?.message || err}`);
      return;
    }

    const replace = await window.showInputBox({
      title: "Safe Bulk Rename · replace",
      prompt: "Replacement pattern (JS string replace, $1 ok)",
      placeHolder: "newPrefix",
      ignoreFocusOut: true,
    });
    if (replace === undefined) return;

    return { match: match.trim(), replace };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const engine = this._ext.getEngine();
    let notes = await engine.findNotesMeta({ excludeStub: true });
    notes = WorkspaceModesService.filterNotesByFocus(notes);

    const re = new RegExp(opts.match);
    const plan: PlanRow[] = [];
    for (const note of notes) {
      if (!re.test(note.fname)) continue;
      const newFname = note.fname.replace(re, opts.replace);
      if (newFname === note.fname) continue;
      if (!newFname.trim()) continue;
      plan.push({
        oldFname: note.fname,
        newFname,
        vaultName: VaultUtils.getName(note.vault),
        note,
      });
    }

    if (plan.length === 0) {
      window.showInformationMessage("No notes matched that rename pattern.");
      return { applied: 0, planned: 0 };
    }

    const existing = new Set(notes.map((n) => `${n.vault.fsPath}::${n.fname}`));
    const conflicts = plan.filter((p) =>
      existing.has(`${p.note.vault.fsPath}::${p.newFname}`)
    );

    const focus = WorkspaceModesService.getFocusedVaultName();
    const preview = [
      `# Safe Bulk Rename — Dry Run`,
      ``,
      `- Match: \`${opts.match}\``,
      `- Replace: \`${opts.replace}\``,
      `- Planned renames: **${plan.length}**`,
      `- Conflicts: **${conflicts.length}**`,
      `- Vault focus: \`${focus || "all"}\``,
      ``,
      `## Planned`,
      ``,
      `| Vault | From | To |`,
      `| --- | --- | --- |`,
      ...plan.map(
        (p) => `| ${p.vaultName} | \`${p.oldFname}\` | \`${p.newFname}\` |`
      ),
      ``,
      conflicts.length
        ? [
            `## Conflicts (will be skipped)`,
            ``,
            ...conflicts.map(
              (c) => `- \`${c.newFname}\` already exists in ${c.vaultName}`
            ),
            ``,
          ].join("\n")
        : "",
      `Review this list, then confirm in the prompt to apply.`,
      ``,
    ].join("\n");

    await window.showTextDocument(
      await workspace.openTextDocument({
        content: preview,
        language: "markdown",
      }),
      { preview: true, viewColumn: ViewColumn.Beside }
    );

    if (conflicts.length === plan.length) {
      window.showErrorMessage(
        "All planned renames conflict with existing notes. Aborting."
      );
      return { applied: 0, planned: plan.length };
    }

    const confirm = await window.showWarningMessage(
      `Apply ${plan.length - conflicts.length} rename(s)? This updates files and links.`,
      { modal: true },
      "Apply renames"
    );
    if (confirm !== "Apply renames") {
      window.showInformationMessage("Bulk rename cancelled.");
      return { applied: 0, planned: plan.length };
    }

    const conflictKeys = new Set(
      conflicts.map((c) => `${c.note.vault.fsPath}::${c.newFname}`)
    );
    const toApply = plan.filter(
      (p) => !conflictKeys.has(`${p.note.vault.fsPath}::${p.newFname}`)
    );

    const renamer = new RenameNoteV2aCommand();
    let applied = 0;
    const wsRoot = engine.wsRoot;

    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Safe bulk rename",
        cancellable: false,
      },
      async () => {
        for (const row of toApply) {
          try {
            const oldUri = Uri.file(
              NoteUtils.getFullPath({ note: row.note, wsRoot })
            );
            const dir = path.dirname(
              NoteUtils.getFullPath({ note: row.note, wsRoot })
            );
            const newUri = Uri.file(path.join(dir, `${row.newFname}.md`));
            await renamer.execute({
              files: [{ oldUri, newUri }],
              silent: true,
              closeCurrentFile: false,
              openNewFile: false,
            });
            applied += 1;
          } catch (err: any) {
            window.showWarningMessage(
              `Failed rename ${row.oldFname} → ${row.newFname}: ${
                err?.message || err
              }`
            );
          }
        }
      }
    );

    window.showInformationMessage(
      `Safe bulk rename applied ${applied}/${toApply.length} (planned ${plan.length}).`
    );
    return { applied, planned: plan.length };
  }
}
