import {
  ConfigUtils,
  DendronTreeViewKey,
  TaskNoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";

type TaskRow = {
  id: string;
  fname: string;
  title: string;
  status: string;
  due?: string;
  vaultName: string;
};

/**
 * Awesome list: sidebar task board webview with status columns.
 */
export class TaskBoardWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.TASK_BOARD; // dendron.task-board
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
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === "open" && msg.fname) {
        const vault = this._ext
          .getDWorkspace()
          .vaults.find((v) => VaultUtils.getName(v) === msg.vaultName);
        await new GotoNoteCommand(this._ext).execute({
          qs: msg.fname,
          ...(vault ? { vault } : {}),
        });
      } else if (msg?.type === "setStatus" && msg.id && msg.status !== undefined) {
        const engine = this._ext.getEngine();
        const note = (await engine.getNote(msg.id)).data;
        if (note) {
          await engine.writeNote({
            ...note,
            custom: { ...(note.custom || {}), status: msg.status },
          });
          await this.refresh();
        }
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
    const tasks = await this.loadTasks();
    this._view.webview.html = this.renderHtml(tasks);
  }

  private async loadTasks(): Promise<TaskRow[]> {
    const engine = this._ext.getEngine();
    const config = this._ext.getDWorkspace().config;
    const taskConfig = ConfigUtils.getTask(config);
    let notes = await engine.findNotesMeta({ excludeStub: true });
    notes = WorkspaceModesService.filterNotesByFocus(notes);
    const complete = new Set(
      (taskConfig.taskCompleteStatus || ["done", "x"]).map((s) =>
        s.toLowerCase()
      )
    );

    return notes
      .filter((n) => TaskNoteUtils.isTaskNote(n))
      .map((n) => {
        const statusRaw = String((n as any).custom?.status ?? "").trim();
        const status = !statusRaw
          ? "open"
          : complete.has(statusRaw.toLowerCase())
          ? "done"
          : statusRaw;
        return {
          id: n.id,
          fname: n.fname,
          title: n.title || n.fname,
          status,
          due: (n as any).custom?.due,
          vaultName: VaultUtils.getName(n.vault),
        };
      });
  }

  private renderHtml(tasks: TaskRow[]): string {
    const columns = ["open", "wip", "blocked", "pending", "done"];
    const byCol = _.groupBy(tasks, (t) =>
      columns.includes(t.status) ? t.status : "open"
    );
    // Put unknown statuses into open column section extras
    for (const t of tasks) {
      if (!columns.includes(t.status)) {
        byCol.open = byCol.open || [];
        if (!byCol.open.find((x) => x.id === t.id)) byCol.open.push(t);
      }
    }

    const colHtml = columns
      .map((col) => {
        const items = byCol[col] || [];
        const cards = items
          .map(
            (t) => `
          <div class="card" data-id="${escapeHtml(t.id)}" data-fname="${escapeHtml(
              t.fname
            )}" data-vault="${escapeHtml(t.vaultName)}">
            <div class="title">${escapeHtml(t.title)}</div>
            <div class="meta">${escapeHtml(t.fname)}${
              t.due ? ` · due ${escapeHtml(String(t.due))}` : ""
            }</div>
            <div class="actions">
              <button data-act="open">Open</button>
              ${
                col !== "wip"
                  ? `<button data-act="status" data-status="wip">WIP</button>`
                  : ""
              }
              ${
                col !== "done"
                  ? `<button data-act="status" data-status="done">Done</button>`
                  : ""
              }
              ${
                col !== "open"
                  ? `<button data-act="status" data-status="">Open</button>`
                  : ""
              }
            </div>
          </div>`
          )
          .join("");
        return `<div class="col"><h3>${col.toUpperCase()} <span>${
          items.length
        }</span></h3>${cards || '<div class="empty">—</div>'}</div>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; font: 12px/1.4 var(--vscode-font-family); color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
  .board { display:flex; gap:8px; padding:8px; overflow-x:auto; min-height:100vh; box-sizing:border-box; }
  .col { min-width: 140px; flex:1; background: var(--vscode-sideBar-background, rgba(127,127,127,.08)); border-radius:6px; padding:6px; }
  h3 { margin:0 0 8px; font-size:11px; letter-spacing:.04em; opacity:.9; display:flex; justify-content:space-between; }
  .card { background: var(--vscode-editor-background); border:1px solid var(--vscode-panel-border,#444); border-radius:6px; padding:8px; margin-bottom:6px; }
  .title { font-weight:600; margin-bottom:4px; }
  .meta { opacity:.7; font-size:10px; word-break:break-all; }
  .actions { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
  button { font-size:10px; cursor:pointer; border:1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-secondaryBackground, #3a3d41); color: var(--vscode-button-secondaryForeground, #fff); border-radius:3px; padding:2px 6px; }
  button:hover { background: var(--vscode-button-background,#0e639c); }
  .empty { opacity:.4; text-align:center; padding:12px 0; }
  .toolbar { padding:6px 8px; border-bottom:1px solid var(--vscode-panel-border,#444); display:flex; gap:8px; align-items:center; }
</style>
</head>
<body>
  <div class="toolbar">
    <strong>Task Board</strong>
    <span style="opacity:.7">${tasks.length} tasks</span>
    <button id="refresh">Refresh</button>
  </div>
  <div class="board">${colHtml}</div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('refresh').onclick = () => vscode.postMessage({ type: 'refresh' });
    document.querySelectorAll('.card').forEach(card => {
      card.querySelectorAll('button').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const act = btn.getAttribute('data-act');
          if (act === 'open') {
            vscode.postMessage({ type: 'open', fname: card.dataset.fname, vaultName: card.dataset.vault });
          } else if (act === 'status') {
            vscode.postMessage({ type: 'setStatus', id: card.dataset.id, status: btn.getAttribute('data-status') || '' });
          }
        };
      });
      card.ondblclick = () => vscode.postMessage({ type: 'open', fname: card.dataset.fname, vaultName: card.dataset.vault });
    });
  </script>
</body>
</html>`;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
