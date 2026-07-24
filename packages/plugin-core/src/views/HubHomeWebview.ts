import {
  DendronTreeViewKey,
  TaskNoteUtils,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";
import { getLastActivationReport } from "../utils/dev";
import { escapeAttr, escapeHtml } from "../utils/htmlEscape";
import { countOpenInboxBullets } from "../utils/noteBodyUtils";

/**
 * Dendron Home — HTML sidebar dashboard (no React bundle).
 *
 * Shows vault-focus-scoped counts (notes, inbox bullets, open tasks),
 * quick-action buttons that run existing Dendron commands, and recent notes.
 * Register in workspace.ts with retainContextWhenHidden.
 */
export class HubHomeWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.HUB_HOME;
  private _view?: vscode.WebviewView;
  private _ext: IDendronExtension;

  constructor(ext: IDendronExtension) {
    this._ext = ext;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === "openNote" && msg.fname) {
        const vault = this._ext
          .getDWorkspace()
          .vaults.find((v) => VaultUtils.getName(v) === msg.vaultName);
        await new GotoNoteCommand(this._ext).execute({
          qs: msg.fname,
          ...(vault ? { vault } : {}),
        });
      } else if (msg?.type === "command" && msg.command) {
        await vscode.commands.executeCommand(msg.command);
      } else if (msg?.type === "refresh") {
        await this.refresh();
      }
    });
    await this.refresh();
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) void this.refresh();
    });
  }

  public async refresh() {
    if (!this._view) return;
    const stats = await this.computeStats();
    this._view.webview.html = this.render(stats);
  }

  private async computeStats() {
    const engine = this._ext.getEngine();
    let notes = await engine.findNotesMeta({ excludeStub: true });
    notes = WorkspaceModesService.filterNotesByFocus(notes);
    const tasks = notes.filter((n) => TaskNoteUtils.isTaskNote(n));
    const openTasks = tasks.filter((n) => TaskNoteUtils.isOpenTaskNote(n));
    const inbox = notes.find((n) => n.fname === "inbox");
    let inboxOpen = 0;
    if (inbox) {
      const full = (await engine.getNote(inbox.id)).data;
      if (full?.body) {
        inboxOpen = countOpenInboxBullets(full.body);
      }
    }
    const now = Time.now().toSeconds();
    const recent = notes
      .filter((n) => now - n.updated < 7 * 86400 && !n.fname.startsWith("root"))
      .sort((a, b) => b.updated - a.updated)
      .slice(0, 8);

    return {
      noteCount: notes.length,
      inboxOpen,
      openTasks: openTasks.length,
      taskTotal: tasks.length,
      vaultFocus: WorkspaceModesService.getFocusedVaultName() || "all",
      workmode: WorkspaceModesService.getActiveWorkmodeName() || "—",
      activation: (getLastActivationReport() || "").split("\n")[0] || "—",
      recent: recent.map((n) => ({
        fname: n.fname,
        title: n.title,
        vault: VaultUtils.getName(n.vault),
      })),
    };
  }

  private render(stats: Awaited<ReturnType<HubHomeWebview["computeStats"]>>) {
    const recent = stats.recent
      .map(
        (r) =>
          `<li><button class="link" data-fname="${escapeAttr(
            r.fname
          )}" data-vault="${escapeAttr(r.vault)}">${escapeHtml(
            r.title || r.fname
          )}</button></li>`
      )
      .join("");

    const actions: { label: string; cmd: string }[] = [
      { label: "Lookup", cmd: DENDRON_COMMANDS.LOOKUP_NOTE.key },
      { label: "Capture", cmd: DENDRON_COMMANDS.CAPTURE_INBOX.key },
      { label: "Process Inbox", cmd: DENDRON_COMMANDS.PROCESS_INBOX.key },
      { label: "Review Ritual", cmd: DENDRON_COMMANDS.REVIEW_RITUAL.key },
      { label: "Task Board", cmd: DENDRON_COMMANDS.TASK_BOARD.key },
      { label: "Vault Focus", cmd: DENDRON_COMMANDS.VAULT_FOCUS.key },
      { label: "Workmodes", cmd: DENDRON_COMMANDS.WORKMODE.key },
      { label: "Health", cmd: DENDRON_COMMANDS.WORKSPACE_HEALTH.key },
      { label: "Hub Menu", cmd: DENDRON_COMMANDS.SHOW_HUB.key },
    ];

    const actionBtns = actions
      .map(
        (a) =>
          `<button class="act" data-cmd="${escapeAttr(a.cmd)}">${escapeHtml(
            a.label
          )}</button>`
      )
      .join("");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { margin:0; padding:10px; font: 12px/1.45 var(--vscode-font-family); color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
  h1 { font-size: 14px; margin: 0 0 8px; }
  .stats { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:12px; }
  .stat { border:1px solid var(--vscode-panel-border,#444); border-radius:6px; padding:8px; background: var(--vscode-sideBar-background, transparent); }
  .stat b { display:block; font-size:16px; }
  .stat span { opacity:.7; font-size:10px; }
  .acts { display:flex; flex-wrap:wrap; gap:6px; margin: 8px 0 12px; }
  button.act, button.link, #refresh { cursor:pointer; border:1px solid var(--vscode-panel-border,#555); background: var(--vscode-button-secondaryBackground,#3a3d41); color: var(--vscode-button-secondaryForeground,#fff); border-radius:4px; padding:4px 8px; font-size:11px; }
  button.act:hover, #refresh:hover { background: var(--vscode-button-background,#0e639c); }
  button.link { background:transparent; border:none; color: var(--vscode-textLink-foreground); padding:0; text-align:left; }
  ul { padding-left: 16px; margin: 4px 0; }
  .meta { opacity:.75; font-size:11px; margin-bottom:8px; }
</style></head>
<body>
  <h1>Dendron Home</h1>
  <div class="meta">Focus: <b>${escapeHtml(stats.vaultFocus)}</b> · Mode: <b>${escapeHtml(
      stats.workmode
    )}</b>
  <button id="refresh" style="float:right">Refresh</button></div>
  <div class="stats">
    <div class="stat"><b>${stats.noteCount}</b><span>notes in scope</span></div>
    <div class="stat"><b>${stats.inboxOpen}</b><span>inbox open</span></div>
    <div class="stat"><b>${stats.openTasks}</b><span>open tasks</span></div>
    <div class="stat"><b>${stats.taskTotal}</b><span>all tasks</span></div>
  </div>
  <div class="acts">${actionBtns}</div>
  <h1>Recent (7d)</h1>
  <ul>${recent || "<li>—</li>"}</ul>
  <div class="meta" style="margin-top:12px">Activation: ${escapeHtml(
    stats.activation
  )}</div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('refresh').onclick = () => vscode.postMessage({ type: 'refresh' });
    document.querySelectorAll('button.act').forEach(b => {
      b.onclick = () => vscode.postMessage({ type: 'command', command: b.dataset.cmd });
    });
    // Recent list uses GOTO_NOTE via command palette path — open via lookup not available without args; use capture path
    document.querySelectorAll('button.link').forEach(b => {
      b.onclick = () => vscode.postMessage({ type: 'openNote', fname: b.dataset.fname, vaultName: b.dataset.vault });
    });
  </script>
</body></html>`;
  }
}


