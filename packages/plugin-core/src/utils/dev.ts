/**
 * Development-only utilities for the Dendron extension.
 * These are only meant to be used when running in the Extension Development Host.
 */

let _lastActivationReport: string | undefined;

export function setLastActivationReport(report: string) {
  _lastActivationReport = report;
}

export function getLastActivationReport(): string | undefined {
  return _lastActivationReport;
}

/**
 * Opens (or creates) a dedicated "Dendron Dev" output channel
 * and returns it. Useful for clean dev logging without polluting
 * the main "Dendron" channel.
 */
let _devChannel: import("vscode").OutputChannel | undefined;

export function getDevOutputChannel() {
  // Lazy import to avoid loading vscode in non-VSCode contexts
  const vscode = require("vscode") as typeof import("vscode");

  if (!_devChannel) {
    _devChannel = vscode.window.createOutputChannel("Dendron Dev");
  }
  return _devChannel;
}

/**
 * Logs a performance report cleanly to the "Dendron Dev" output channel.
 * This provides a much nicer view than raw JSON in the main channel.
 */
export function logPerfReport(timerName: string, report: string) {
  const channel = getDevOutputChannel();
  channel.appendLine(`\n=== ${timerName} ===`);
  channel.appendLine(report);
  channel.appendLine("=".repeat(30 + timerName.length));
  channel.show(true); // show without taking focus
}
