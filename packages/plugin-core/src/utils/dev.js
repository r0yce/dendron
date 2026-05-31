"use strict";
/**
 * Development-only utilities for the Dendron extension.
 * These are only meant to be used when running in the Extension Development Host.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLastActivationReport = setLastActivationReport;
exports.getLastActivationReport = getLastActivationReport;
exports.recordPerfReport = recordPerfReport;
exports.getAllPerfReports = getAllPerfReports;
exports.clearPerfReports = clearPerfReports;
exports.getDevOutputChannel = getDevOutputChannel;
exports.logPerfReport = logPerfReport;
let _lastActivationReport;
function setLastActivationReport(report) {
    _lastActivationReport = report;
}
function getLastActivationReport() {
    return _lastActivationReport;
}
// Session-level collection of perf reports
const _perfReports = [];
function recordPerfReport(name, report) {
    _perfReports.push({ timestamp: new Date(), name, report });
    // Keep only last 50 reports to avoid memory bloat
    if (_perfReports.length > 50) {
        _perfReports.shift();
    }
}
function getAllPerfReports() {
    return [..._perfReports];
}
function clearPerfReports() {
    _perfReports.length = 0;
}
/**
 * Opens (or creates) a dedicated "Dendron Dev" output channel
 * and returns it. Useful for clean dev logging without polluting
 * the main "Dendron" channel.
 */
let _devChannel;
function getDevOutputChannel() {
    // Lazy import to avoid loading vscode in non-VSCode contexts
    const vscode = require("vscode");
    if (!_devChannel) {
        _devChannel = vscode.window.createOutputChannel("Dendron Dev");
    }
    return _devChannel;
}
/**
 * Logs a performance report cleanly to the "Dendron Dev" output channel.
 * This provides a much nicer view than raw JSON in the main channel.
 */
function logPerfReport(timerName, report) {
    const channel = getDevOutputChannel();
    channel.appendLine(`\n=== ${timerName} ===`);
    channel.appendLine(report);
    channel.appendLine("=".repeat(30 + timerName.length));
    channel.show(true); // show without taking focus
    // Record for session view
    recordPerfReport(timerName, report);
}
//# sourceMappingURL=dev.js.map