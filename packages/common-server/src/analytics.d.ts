import { CLIIdentifyProps, CLIProps, VSCodeIdentifyProps, VSCodeProps } from "@dendronhq/common-all";
import Analytics from "analytics-node";
declare enum SiteEvents {
    PUBLISH_CLICKED = "sitePublishClick",
    SOURCE_INFO_ENTER = "sitePublishInfoEnter",
    CREATED = "siteCreate",
    UPDATE_START = "siteUpdateStart",
    UPDATE_STOP = "siteUpdateStop",
    VISIT_SITE = "siteVisit"
}
declare enum SubscriptionEvents {
    CREATED = "subscriptionCreated"
}
export type UserEventProps = {
    tier: UserTier;
};
export type RevenueEventProps = {
    $quantity: number;
    $revenue: number;
    $price: number;
};
export type SiteEventProps = {
    isCustomDomain?: boolean;
    isFirstTime?: boolean;
    domain: string;
};
export type SiteUpdatedEventProps = {
    source: "hook";
    progress: "start" | "stop";
    status?: CompletionStatus;
};
export type SubscriptionEventProps = {
    tier: UserTier;
};
declare enum CompletionStatus {
    OK = "ok"
}
declare enum UserTier {
    SEED = "seed"
}
export type SegmentClientOpts = {
    key?: string;
    forceNew?: boolean;
    cachePath?: string;
    /**
     * Workspace configuration disable analytics
     */
    disabledByWorkspace?: boolean;
};
export declare const SEGMENT_EVENTS: {
    SiteEvents: typeof SiteEvents;
    SubscriptionEvents: typeof SubscriptionEvents;
};
type SegmentExtraArg = {
    context?: any;
};
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
export declare enum TelemetryStatus {
    /** The user set that telemetry should be disabled in the workspace config. */
    DISABLED_BY_WS_CONFIG = "disabled by ws config",
    /** The user set that telemetry should be disabled in VSCode settings. */
    DISABLED_BY_VSCODE_CONFIG = "disabled by vscode config",
    /** The user used the Disable Telemetry command to disable telemetry. */
    DISABLED_BY_COMMAND = "disabled by command",
    /** The user disabled telemetry using dendron-cli */
    DISABLED_BY_CLI_COMMAND = "disabled by cli command",
    /** The user disabled telemetry in configuration, but used the Enable Telemetry command to give permission. */
    ENABLED_BY_COMMAND = "enabled by command",
    /** The user allowed telemetry by configuration. */
    ENABLED_BY_CONFIG = "enabled by config",
    /** The user did not opt out of telemetry prior to 0.46.0 update */
    ENABLED_BY_MIGRATION = "enabled by migration",
    /** The user enabled telemetry using dendron-cli */
    ENABLED_BY_CLI_COMMAND = "enabled by cli command",
    /** The user used dendron-cli before setting telemetry with vscode or plugin */
    ENABLED_BY_CLI_DEFAULT = "enabled by cli default"
}
export type TelemetryConfig = {
    status: TelemetryStatus;
};
export type SegmentEventProps = {
    event: string;
    properties?: {
        [key: string]: any;
    };
    context?: any;
    timestamp?: Date;
    integrations?: {
        [key: string]: any;
    };
};
export declare class SegmentClient {
    _segmentInstance: Analytics;
    private _anonymousId;
    private _hasOptedOut;
    private logger;
    private _cachePath?;
    static _locked: boolean;
    static _singleton: undefined | SegmentClient;
    /**
     * This is used to _unlock_ Segment client.
     * Before this is called, calling {@link SegmentClient.instance()} will throw an error.
     * This is to prevent accidental instantiation during module load time, as this will globally affect
     * how clients report data.
     */
    static unlock(): void;
    static instance(opts?: SegmentClientOpts): SegmentClient;
    /** Legacy: If exists, Dendron telemetry has been disabled. */
    static getDisableConfigPath(): string;
    /** May contain configuration for Dendron telemetry. */
    static getConfigPath(): string;
    static readConfig(): TelemetryConfig | undefined;
    static getStatus(): TelemetryStatus;
    static isDisabled(status?: TelemetryStatus): boolean;
    static isEnabled(status?: TelemetryStatus): boolean;
    static enable(why: TelemetryStatus.ENABLED_BY_COMMAND | TelemetryStatus.ENABLED_BY_CLI_COMMAND | TelemetryStatus.ENABLED_BY_CLI_DEFAULT | TelemetryStatus.ENABLED_BY_CONFIG | TelemetryStatus.ENABLED_BY_MIGRATION): void;
    static disable(why: TelemetryStatus.DISABLED_BY_COMMAND | TelemetryStatus.DISABLED_BY_CLI_COMMAND | TelemetryStatus.DISABLED_BY_VSCODE_CONFIG | TelemetryStatus.DISABLED_BY_WS_CONFIG): void;
    constructor(_opts?: SegmentClientOpts);
    identifyAnonymous(props?: {
        [key: string]: any;
    }, opts?: SegmentExtraArg): void;
    identify(id?: string, props?: {
        [key: string]: any;
    }, opts?: SegmentExtraArg): void;
    /**
     * Track an event with Segment. If the event fails to upload for any reason,
     * it will be saved to a residual cache file, which will be retried at a later
     * point.
     * @param event
     * @param data
     * @param opts
     * @returns a Promise which resolves when either the event has been
     * successfully uploaded to Segment or has been written to the cache file. It
     * is not recommended to await this function for metrics tracking.
     */
    track(opts: SegmentEventProps): Promise<void>;
    private trackInternal;
    /**
     * Writes a tracked data point to the residual cache file. If the file exceeds
     * 5Mb than the write will fail silently.
     * @param filename
     * @param data
     * @returns
     */
    writeToResidualCache(filename: string, data: SegmentEventProps): Promise<void>;
    /**
     * Tries to upload data in the residual cache file to Segment. A separate
     * attempt is made to upload each data point - if any fail due to a retryable
     * error (such as no network), then it is kept in the cache file for the next
     * iteration. Any successfully uploaded data points or data deemed as a
     * non-recoverable error (for example, invalid format) are removed.
     * @returns
     */
    tryFlushResidualCache(): Promise<{
        successCount: number;
        nonRetryableErrorCount: number;
        retryableErrorCount: number;
    }>;
    get hasOptedOut(): boolean;
    get anonymousId(): string;
}
export declare class SegmentUtils {
    private static _trackCommon;
    /**
     * Async tracking. Do not await this method as track calls can take ~8s to finish
     */
    static track(opts: SegmentEventProps & {
        platformProps: VSCodeProps | CLIProps;
    }): Promise<void>;
    /**
     * Sync tracking. NOTE that the downstream function must await this function in order for this to be synchronous
     * @param opts
     * @returns
     */
    static trackSync(opts: SegmentEventProps & {
        platformProps: VSCodeProps | CLIProps;
    }): Promise<void>;
    static identify(identifyProps: VSCodeIdentifyProps | CLIIdentifyProps): void;
    static getCommonProps(): {
        arch: NodeJS.Architecture;
        nodeVersion: string;
    };
}
export {};
