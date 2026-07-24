import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import {
  handleTaskBoardMessage,
  loadTaskRows,
  renderTaskBoardHtml,
} from "./taskBoardShared";

/**
 * Editor-area Task Board kanban (full WebviewPanel, not sidebar).
 * Opened by Dendron: Task Board.
 */
export class TaskBoardPanelFactory {
  private static _panel: vscode.WebviewPanel | undefined;
  private static _ext: IDendronExtension | undefined;

  static async open(ext: IDendronExtension): Promise<vscode.WebviewPanel> {
    this._ext = ext;
    if (this._panel) {
      this._panel.reveal(vscode.ViewColumn.One);
      await this.refresh();
      return this._panel;
    }

    const panel = vscode.window.createWebviewPanel(
      "dendron.taskBoardEditor",
      "Task Board",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
      }
    );
    this._panel = panel;

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (!this._ext) return;
      await handleTaskBoardMessage(this._ext, msg, () => this.refresh());
    });

    panel.onDidDispose(() => {
      this._panel = undefined;
    });

    await this.refresh();
    return panel;
  }

  static async refresh(): Promise<void> {
    if (!this._panel || !this._ext) return;
    const tasks = await loadTaskRows(this._ext);
    this._panel.webview.html = renderTaskBoardHtml(tasks, "editor");
    this._panel.title = `Task Board (${tasks.length})`;
  }
}
