import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { CalendarView } from "../views/CalendarView";
import { HubHomeWebview } from "../views/HubHomeWebview";
import { SampleView } from "../views/SampleView";
import { TaskBoardWebview } from "../views/TaskBoardWebview";

/**
 * Register HTML / simple WebviewView side panels.
 *
 * Must run in the same turn as HistoryService "initialized" so VS Code can
 * resolve visible sidebar views (do not defer with setTimeout).
 *
 * Returns disposables for context.subscriptions (callers also push backlinks/
 * tip-of-day/graph which need the DendronExtension instance methods).
 */
export function registerHtmlSidePanels(
  ext: IDendronExtension,
  context: vscode.ExtensionContext
): void {
  const sampleView = new SampleView();
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SampleView.viewType,
      sampleView
    )
  );

  const calendarView = new CalendarView(ext);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CalendarView.viewType,
      calendarView
    )
  );

  // Task Board + Hub Home (HTML, no CRA bundle)
  const taskBoard = new TaskBoardWebview(ext);
  const hubHome = new HubHomeWebview(ext);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TaskBoardWebview.viewType,
      taskBoard,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      HubHomeWebview.viewType,
      hubHome,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}
