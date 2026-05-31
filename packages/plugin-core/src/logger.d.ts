import { IDendronError } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { ExtensionContext, OutputChannel } from "vscode";
export type TraceLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogPayload = Partial<{
    ctx: string;
    error: IDendronError;
    msg: string;
}>;
export declare const UNKNOWN_ERROR_MSG = "You found a bug! We didn't think this could happen but you proved us wrong. Please file the bug here -->  https://github.com/dendronhq/dendron/issues/new?assignees=&labels=&template=bug_report.md&title= We will put our best bug exterminators on this right away!";
export declare class Logger {
    static output: OutputChannel | undefined;
    static logger: ReturnType<typeof createLogger> | undefined;
    static logPath?: string;
    static configure(context: ExtensionContext, level: TraceLevel): void;
    private static _level;
    /**
     * Shortcut to check if logger is set to debug
     */
    static isDebug(): boolean;
    static cmpLevel(lvl: TraceLevel): boolean;
    /**
     * Is lvl1 >= lvl2
     * @param lvl1
     * @param lvl2
     */
    static cmpLevels(lvl1: TraceLevel, lvl2: TraceLevel): boolean;
    static get level(): TraceLevel;
    static set level(value: TraceLevel);
    /** Log an error.
     *
     * If an `error` is attached to log payload, the error is also sent to Sentry.
     * This should be used for internal Dendron errors that we can fix, or for
     * problems we assume should never happen.
     *
     * If the error is expected in regular execution, you can log it with
     * {@link Logger.info} instead.
     *
     * If the error is unexpected, but also not something we could fix (i.e. the
     * user misconfigured something), you'll probably want to use
     * {@link Logger.warn} instead. That way we can debug the issue in a bug
     * report by looking at the logs, but it doesn't clog up Sentry.
     */
    static error(payload: LogPayload): void;
    static info(payload: any, show?: boolean): void;
    static debug(payload: any): void;
    /** Use this to log an error without submitting it to Sentry.
     *
     * This should be used for errors related to users setup etc., where
     * we wouldn't be able to do anything on our part to fix the problem.
     */
    static warn(payload: any): void;
    static log: (payload: LogPayload, lvl: TraceLevel, _opts?: {
        show?: boolean;
    }) => void;
    /**
     * Extract full path from the payload when it exists in the error
     * otherwise return undefined. This path is meant to be used for user to be
     * able to navigate to the file at fault.
     *   */
    static tryExtractFullPath(payload: LogPayload): string | undefined;
}
