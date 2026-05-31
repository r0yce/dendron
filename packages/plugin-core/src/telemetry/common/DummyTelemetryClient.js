"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyTelemetryClient = void 0;
/**
 * No-Op Dummy telemetry client. This doesn't upload anything and is safe to use
 * during development and testing.
 */
class DummyTelemetryClient {
    track() {
        return Promise.resolve();
    }
    identify() {
        return Promise.resolve();
    }
}
exports.DummyTelemetryClient = DummyTelemetryClient;
//# sourceMappingURL=DummyTelemetryClient.js.map