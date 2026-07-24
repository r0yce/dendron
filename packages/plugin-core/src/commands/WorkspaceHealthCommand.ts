import { TaskNoteUtils, Time } from "@dendronhq/common-all";
import { window, workspace, ViewColumn } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { getLastActivationReport } from "../utils/dev";
import { countOpenInboxBullets } from "../utils/noteBodyUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = void;

/**
 * Workspace Health — markdown dashboard for ritual scope.
 * Counts use shared TaskNoteUtils / noteBodyUtils (same rules as Hub Home).
 * Distinct from CLI `dendron health` (system doctor: sqlite, git, node, …).
 */
export class WorkspaceHealthCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.WORKSPACE_HEALTH.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const engine = this._ext.getEngine();
    const notes = await engine.findNotesMeta({ excludeStub: true });
    const focused = WorkspaceModesService.filterNotesByFocus(notes);

    const tasks = focused.filter((n) => TaskNoteUtils.isTaskNote(n));
    const openTasks = tasks.filter((n) => TaskNoteUtils.isOpenTaskNote(n));

    const inbox = focused.find((n) => n.fname === "inbox");
    let inboxOpen = 0;
    if (inbox) {
      const full = (await engine.getNote(inbox.id)).data;
      if (full?.body) {
        inboxOpen = countOpenInboxBullets(full.body);
      }
    }

    const now = Time.now().toSeconds();
    const stale = focused.filter(
      (n) => now - n.updated > 90 * 86400 && !n.fname.startsWith("root")
    ).length;

    const activation =
      getLastActivationReport() || "(no activation report yet)";
    const vaultFocus =
      WorkspaceModesService.getFocusedVaultName() || "all vaults";
    const workmode =
      WorkspaceModesService.getActiveWorkmodeName() || "(none)";

    const report = [
      `# Dendron Workspace Health`,
      ``,
      `_Generated ${Time.now().toFormat("y-MM-dd HH:mm")}_`,
      ``,
      `## Scope`,
      `- Vault focus: \`${vaultFocus}\``,
      `- Workmode: \`${workmode}\``,
      `- Notes in scope: **${focused.length}** (workspace total ${notes.length})`,
      ``,
      `## Rituals`,
      `- Inbox open bullets: **${inboxOpen}**`,
      `- Task notes: **${tasks.length}** (open-ish: **${openTasks.length}**)`,
      `- Notes not updated in 90+ days: **${stale}**`,
      ``,
      `## Activation / perf`,
      "```",
      typeof activation === "string" ? activation : String(activation),
      "```",
      ``,
      `## Suggested next steps`,
      inboxOpen > 0
        ? `- [ ] Run **Dendron: Process Inbox** (${inboxOpen} items)`
        : `- [x] Inbox clear`,
      openTasks.length > 0
        ? `- [ ] Review **Dendron: Task Board** (${openTasks.length} open)`
        : `- [x] No open tasks detected`,
      `- [ ] **Dendron: Review Ritual** for weekly pass`,
      ``,
    ].join("\n");

    const doc = await workspace.openTextDocument({
      content: report,
      language: "markdown",
    });
    await window.showTextDocument(doc, {
      preview: true,
      viewColumn: ViewColumn.Beside,
    });
  }
}
