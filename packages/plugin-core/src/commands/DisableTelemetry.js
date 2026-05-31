"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisableTelemetryCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const analytics_1 = require("../utils/analytics");
const base_1 = require("./base");
class DisableTelemetryCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.DISABLE_TELEMETRY.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        const reason = common_server_1.TelemetryStatus.DISABLED_BY_COMMAND;
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.DisableTelemetry, { reason });
        common_server_1.SegmentClient.disable(reason);
        vscode_1.window.showInformationMessage("telemetry disabled");
    }
}
exports.DisableTelemetryCommand = DisableTelemetryCommand;
//# sourceMappingURL=DisableTelemetry.js.map