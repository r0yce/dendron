/**
 * Development-only utilities for the Dendron extension.
 * These are only meant to be used when running in the Extension Development Host.
 */
export declare function setLastActivationReport(report: string): void;
export declare function getLastActivationReport(): string | undefined;
export declare function recordPerfReport(name: string, report: string): void;
export declare function getAllPerfReports(): Array<{
    timestamp: Date;
    name: string;
    report: string;
}>;
export declare function clearPerfReports(): void;
export declare function getDevOutputChannel(): import("vscode").OutputChannel;
/**
 * Logs a performance report cleanly to the "Dendron Dev" output channel.
 * This provides a much nicer view than raw JSON in the main channel.
 */
export declare function logPerfReport(timerName: string, report: string): void;
