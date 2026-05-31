import { Ora } from "ora";
export declare class CLIUtils {
    /**
     * Takes an object like
     *     {
     *     		foo: "42",
     *     		bar: 10
     *     }
     * and returns "foo=42,bar=10"
     * @param ent: config object
     * @returns
     */
    static objectConfig2StringConfig: (ent: any) => string;
    static getClientVersion(): any;
    /**
     * Simple console "table" renderer for HealthCheckResult[] (no extra deps).
     * Uses emoji status + padded columns + | separators for readability.
     * Timings appended in verbose mode (per-check ms from PerformanceTimer capture).
     * Used by `dendron health` (DoctorCommand) non-JSON output path.
     * Keeps output scriptable + human friendly; ora spinners can wrap slow checks later.
     */
    static renderHealthChecks(checks: Array<{
        name: string;
        status: string;
        detail: string;
        fixable?: boolean;
        fixHint?: string;
        timingMs?: number;
    }>, opts?: {
        verbose?: boolean;
        timings?: Record<string, number>;
        summary?: {
            pass: number;
            warn: number;
            fail: number;
        };
        exitCode?: number;
        fixNote?: boolean;
    }): void;
}
export declare class SpinnerUtils {
    /**
     * Given a Ora spinner, render given text with optional symbol
     * Continue spinning.
     * @param opts
     */
    static renderAndContinue(opts: {
        spinner: Ora;
        text?: string;
        symbol?: string;
    }): void;
}
