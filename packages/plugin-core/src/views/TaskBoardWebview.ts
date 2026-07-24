import { DendronTreeViewKey } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import {
  handleTaskBoardMessage,
  loadTaskRows,
  renderTaskBoardHtml,
} from "./taskBoardShared";

/**
 * Sidebar Task Board (WebviewView).
 * Full-width editor kanban: TaskBoardPanelFactory / Dendron: Task Board.
 */
export class TaskBoardWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.TASK_BOARD;
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
      await handleTaskBoardMessage(this._ext, msg, () => this.refresh());
    });
    await this.refresh();
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) void this.refresh();
    });
  }

  public async refresh() {
    if (!this._view) return;
    const tasks = await loadTaskRows(this._ext);
    this._view.webview.html = renderTaskBoardHtml(tasks, "sidebar");
  }
}
