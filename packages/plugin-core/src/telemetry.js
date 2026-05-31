"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSegmentClient = setupSegmentClient;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const logger_1 = require("./logger");
/** Creates a SegmentClient for telemetry, if enabled, and listens for vscode telemetry settings to disable it when requested. */
function setupSegmentClient({ ws, cachePath, }) {
    try {
        const disabledByWorkspace = ws
            ? common_all_1.ConfigUtils.getWorkspace(ws.config).disableTelemetry
            : false;
        const segment = common_server_1.SegmentClient.instance({
            forceNew: true,
            cachePath,
            disabledByWorkspace,
        });
        logger_1.Logger.info({ msg: `Telemetry is disabled? ${segment.hasOptedOut}` });
        logger_1.Logger.info({ msg: "Segment Residual Cache Path is at " + cachePath });
    }
    catch (err) {
        logger_1.Logger.error({
            msg: "Error when trying to listen to the telemetry preference change event",
        });
    }
}
//# sourceMappingURL=telemetry.js.map