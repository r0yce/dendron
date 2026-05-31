"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTelemetryClient = void 0;
/**
 * TODO: Not sure we actually need this implementation.  The WebTelemetryClient,
 * which uses the HTTP API, works perfectly fine in Node as well. The only thing
 * we may want to swap is the WRITE_KEY.
 */
class NodeTelemetryClient {
    track(_event, _customProps, _segmentProps) {
        throw new Error("NodeTelemetryClient - Method not implemented.");
    }
    identify() {
        throw new Error("NodeTelemetryClient - Method not implemented.");
    }
}
exports.NodeTelemetryClient = NodeTelemetryClient;
//# sourceMappingURL=NodeTelemetryClient.js.map