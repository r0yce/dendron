import {
  ConfigUtils,
  TaskNoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { GotoNoteCommand } from "../commands/GotoNote";
import { IDendronExtension } from "../dendronExtensionInterface";
import { WorkspaceModesService } from "../services/WorkspaceModesService";

export type TaskRow = {
  id: string;
  fname: string;
  title: string;
  status: string;
  due?: string;
  vaultName: string;
};

export type TaskBoardLayout = "sidebar" | "editor";

export async function loadTaskRows(ext: IDendronExtension): Promise<TaskRow[]> {
  const engine = ext.getEngine();
  const config = ext.getDWorkspace().config;
  const taskConfig = ConfigUtils.getTask(config);
  let notes = await engine.findNotesMeta({ excludeStub: true });
  notes = WorkspaceModesService.filterNotesByFocus(notes);
  const complete = new Set(
    (taskConfig.taskCompleteStatus || ["done", "x"]).map((s) => s.toLowerCase())
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

export async function handleTaskBoardMessage(
  ext: IDendronExtension,
  msg: any,
  refresh: () => Promise<void>
): Promise<void> {
  if (msg?.type === "open" && msg.fname) {
    const vault = ext
      .getDWorkspace()
      .vaults.find((v) => VaultUtils.getName(v) === msg.vaultName);
    await new GotoNoteCommand(ext).execute({
      qs: msg.fname,
      ...(vault ? { vault } : {}),
    });
  } else if (msg?.type === "setStatus" && msg.id && msg.status !== undefined) {
    const engine = ext.getEngine();
    const note = (await engine.getNote(msg.id)).data;
    if (note) {
      await engine.writeNote({
        ...note,
        custom: { ...(note.custom || {}), status: msg.status },
      });
      await refresh();
    }
  } else if (msg?.type === "refresh") {
    await refresh();
  }
}

export function renderTaskBoardHtml(
  tasks: TaskRow[],
  layout: TaskBoardLayout = "sidebar"
): string {
  const columns = ["open", "wip", "blocked", "pending", "done"];
  const byCol = _.groupBy(tasks, (t) =>
    columns.includes(t.status) ? t.status : "open"
  );
  for (const t of tasks) {
    if (!columns.includes(t.status)) {
      byCol.open = byCol.open || [];
      if (!byCol.open.find((x) => x.id === t.id)) byCol.open.push(t);
    }
  }

  const colMin = layout === "editor" ? "200px" : "140px";
  const fontSize = layout === "editor" ? "13px" : "12px";
  const titleSize = layout === "editor" ? "13px" : "12px";
  const pad = layout === "editor" ? "12px" : "8px";

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
              ${
                col !== "blocked"
                  ? `<button data-act="status" data-status="blocked">Blocked</button>`
                  : ""
              }
              ${
                col !== "pending"
                  ? `<button data-act="status" data-status="pending">Pending</button>`
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

  const focus = WorkspaceModesService.getFocusedVaultName() || "all vaults";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  :root { color-scheme: light dark; }
  body {
    margin:0;
    font: ${fontSize}/1.45 var(--vscode-font-family);
    color: var(--vscode-editor-foreground);
    background: var(--vscode-editor-background);
  }
  .toolbar {
    padding: ${pad};
    border-bottom:1px solid var(--vscode-panel-border,#444);
    display:flex; gap:10px; align-items:center; flex-wrap:wrap;
    position: sticky; top: 0; z-index: 2;
    background: var(--vscode-editor-background);
  }
  .toolbar strong { font-size: ${titleSize}; }
  .toolbar .meta { opacity:.7; }
  .board {
    display:flex; gap:10px; padding: ${pad};
    overflow-x:auto; min-height: calc(100vh - 48px);
    box-sizing:border-box; align-items:flex-start;
  }
  .col {
    min-width: ${colMin}; flex:1;
    background: var(--vscode-sideBar-background, rgba(127,127,127,.08));
    border-radius:8px; padding:10px;
    max-height: calc(100vh - 72px); overflow-y:auto;
  }
  h3 {
    margin:0 0 10px; font-size:11px; letter-spacing:.05em; opacity:.9;
    display:flex; justify-content:space-between; position:sticky; top:0;
    background: inherit; padding-bottom:4px;
  }
  .card {
    background: var(--vscode-editor-background);
    border:1px solid var(--vscode-panel-border,#444);
    border-radius:6px; padding:10px; margin-bottom:8px;
    cursor: default;
  }
  .card:hover { border-color: var(--vscode-focusBorder, #007fd4); }
  .title { font-weight:600; margin-bottom:4px; font-size: ${titleSize}; }
  .meta { opacity:.7; font-size:11px; word-break:break-all; }
  .actions { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
  button {
    font-size:11px; cursor:pointer;
    border:1px solid var(--vscode-button-border, transparent);
    background: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #fff);
    border-radius:3px; padding:3px 8px;
  }
  button:hover { background: var(--vscode-button-background,#0e639c); }
  button#refresh, button.primary {
    background: var(--vscode-button-background,#0e639c);
    color: var(--vscode-button-foreground,#fff);
  }
  .empty { opacity:.4; text-align:center; padding:16px 0; }
</style>
</head>
<body>
  <div class="toolbar">
    <strong>Task Board</strong>
    <span class="meta">${tasks.length} tasks · focus: ${escapeHtml(focus)}</span>
    <button id="refresh" class="primary">Refresh</button>
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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
