import { ITelemetryClient } from "./ITelemetryClient";
/**
 * No-Op Dummy telemetry client. This doesn't upload anything and is safe to use
 * during development and testing.
 */
export declare class DummyTelemetryClient implements ITelemetryClient {
    track(): Promise<void>;
    identify(): Promise<void>;
}
