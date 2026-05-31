export declare class ActivationTimer {
    private marks;
    private startTs;
    constructor();
    mark(name: string): void;
    finish(): {
        totalMs: number;
    };
    getReport(): {
        totalMs: number;
    };
    /**
     * Returns a nicely formatted multi-line string of the activation phases.
     * Useful for dev commands or logging.
     */
    getDetailedReport(): string;
    /**
     * Returns the raw marks for advanced use (e.g. sending to a webview).
     */
    getMarks(): {
        name: string;
        ts: number;
        deltaFromPrevious: number;
        deltaFromStart: number;
    }[];
}
