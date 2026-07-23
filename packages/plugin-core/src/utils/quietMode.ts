import * as vscode from "vscode";

/**
 * Personal-fork UX: quiet mode suppresses surveys, lapsed-user modals,
 * feature showcase toasts, and other non-essential prompts.
 *
 * Default: ON (this is a maintenance fork for daily use, not growth marketing).
 * Setting: `dendron.quietMode`
 */
export function isQuietMode(): boolean {
  const cfg = vscode.workspace.getConfiguration();
  // Prefer explicit setting; default true for this fork.
  const v = cfg.get<boolean>("dendron.quietMode");
  if (v === undefined || v === null) {
    return true;
  }
  return v;
}

/**
 * Whether to show the performance status bar item.
 * Setting: `dendron.showPerfStatusBar` (default true).
 */
export function shouldShowPerfStatusBar(): boolean {
  const cfg = vscode.workspace.getConfiguration();
  const v = cfg.get<boolean>("dendron.showPerfStatusBar");
  if (v === undefined || v === null) {
    return true;
  }
  return v;
}
