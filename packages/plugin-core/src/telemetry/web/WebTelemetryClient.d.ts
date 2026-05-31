import { ITelemetryClient } from "../common/ITelemetryClient";
/**
 * This implementation talks to Segment services via their HTTP API. It's safe
 * to use in both web and node contexts.
 *
 * Note: the Segment Javascript library was not used here because it requires a
 * browser 'window' object, which is not available to web extensions.
 */
export declare class WebTelemetryClient implements ITelemetryClient {
    private anonymousId;
    private extVersion;
    constructor(anonymousId: string, extVersion: string);
    /**
     * This key talks to the 'Dendron-Web-Extension' source in Segment. NOTE: this
     * is different from the 'ide-prod' source.
     */
    private DENDRON_WEB_EXTENSION_SEGMENT_WRITE_KEY;
    private requestConfig;
    track(event: string, customProps?: any, _segmentProps?: {
        timestamp?: Date | undefined;
    } | undefined): Promise<void>;
    identify(): Promise<void>;
}
