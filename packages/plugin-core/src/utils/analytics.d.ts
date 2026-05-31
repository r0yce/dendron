import { ContextualUIEvents, DWorkspaceV2, VSCodeIdentifyProps } from "@dendronhq/common-all";
import { SegmentUtils } from "@dendronhq/common-server";
import * as vscode from "vscode";
export type SegmentContext = Partial<{
    app: Partial<{
        name: string;
        version: string;
        build: string;
    }>;
    os: Partial<{
        name: string;
        version: string;
    }>;
    userAgent: string;
}>;
export declare class AnalyticsUtils {
    static sessionStart: number;
    static getVSCodeSentryRelease(): string;
    static getVSCodeIdentifyProps(): VSCodeIdentifyProps;
    static getCommonTrackProps(): {
        firstWeekSinceInstall: boolean;
        vscodeSessionId: string;
        appVersion: string;
    };
    static getSessionId(): number;
    static isFirstWeek(): boolean;
    static _trackCommon({ event, props, timestamp, }: {
        event: string;
        props?: any;
        timestamp?: Date;
    }): Parameters<typeof SegmentUtils.track>[0];
    static track(event: string, customProps?: any, segmentProps?: {
        timestamp?: Date;
    }): Promise<void>;
    /** Saves analytics to be sent during the next run of Dendron.
     *
     * Make sure any properties you use can be trivially serialized and
     * deserialized, numbers, strings, plain JSON objects, arrays are fine. No
     * Maps or complex objects.
     *
     * This is required for actions that reload the window, where the analytics
     * won't get sent in time before the reload and where delaying the reload
     * would be undesirable.
     */
    static trackForNextRun(event: string, customProps?: any): Promise<void>;
    static sendSavedAnalytics(): Promise<any[]>;
    static identify(props?: Partial<VSCodeIdentifyProps>): void;
    /**
     * Setup segment client
     * Also setup cache flushing in case of missed uploads
     */
    static setupSegmentWithCacheFlush({ context, ws, }: {
        context: vscode.ExtensionContext;
        ws?: DWorkspaceV2;
    }): void;
    static showTelemetryNotice(): void;
}
/**
 * Wraps a callback function with a try/catch block.  In the catch, any
 * exceptions that were encountered will be uploaded to Sentry and then
 * rethrown.
 *
 * Warning! This function will cause the callback function to lose its `this` value.
 * If you are passing a method to this function, you must bind the `this` value:
 *
 * ```ts
 * const wrappedCallback = sentryReportingCallback(
 *   this.callback.bind(this)
 * );
 * ```
 *
 * Otherwise, when the function is called the `this` value will be undefined.
 *
 * @param callback the function to wrap
 * @returns the wrapped callback function
 */
export declare function sentryReportingCallback<A extends any[], R>(callback: (...args: A) => R): (...args: A) => R;
export declare function getAnalyticsPayload(source?: string): {
    source: ContextualUIEvents;
} | {
    source?: never;
};
