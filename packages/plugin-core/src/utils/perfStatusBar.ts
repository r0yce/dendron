import { globalPerfRing } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { shouldShowPerfStatusBar } from "./quietMode";

let item: vscode.StatusBarItem | undefined;

/**
 * Status bar “Dendron pulse”: activation time + ring sample count.
 * Click opens the Dev performance report command when available.
 */
export function ensurePerfStatusBar(
  context: vscode.ExtensionContext,
): vscode.StatusBarItem | undefined {
  if (!shouldShowPerfStatusBar()) {
    item?.hide();
    return undefined;
  }
  if (!item) {
    item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      90,
    );
    item.command = "dendron.dev.showAllPerfReports";
    item.tooltip = "Dendron performance (click for details)";
    context.subscriptions.push(item);
  }
  return item;
}

export function updatePerfStatusBar(opts: {
  activationMs?: number;
  noteCount?: number;
  label?: string;
}): void {
  if (!item || !shouldShowPerfStatusBar()) {
    return;
  }
  const ring = globalPerfRing.summary(50);
  const parts: string[] = ["$(pulse) Dendron"];
  if (opts.activationMs !== undefined) {
    parts.push(`${Math.round(opts.activationMs)}ms`);
  }
  if (opts.noteCount !== undefined) {
    parts.push(`${opts.noteCount} notes`);
  }
  if (opts.label) {
    parts.push(opts.label);
  } else if (ring.totalEntries > 0) {
    parts.push(`p95 ${ring.p95DurationMs.toFixed(0)}ms`);
  }
  item.text = parts.join(" · ");
  item.show();
}

export function hidePerfStatusBar(): void {
  item?.hide();
}
