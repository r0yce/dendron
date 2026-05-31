"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const DiagnosticsReport_1 = require("../../commands/DiagnosticsReport");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("GIVEN DiagnosticsReport", function () {
    (0, testUtilsV3_1.describeMultiWS)("WHEN run Diagnostics Report", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN generate diagnostics report", async () => {
            const logDst = path_1.default.join(path_1.default.dirname((0, common_all_1.env)("LOG_DST")), "dendron.server.log");
            fs_extra_1.default.writeFileSync(logDst, "foobar", { encoding: "utf8" });
            const cmd = new DiagnosticsReport_1.DiagnosticsReportCommand();
            await cmd.execute();
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            const body = editor?.document.getText();
            const isInString = await common_test_utils_1.AssertUtils.assertInString({
                body,
                match: ["foobar", "Dendron Config", "Plugin Logs", "Workspace File"],
            });
            (0, testUtilsv2_1.expect)(isInString).toBeTruthy();
        });
    });
});
//# sourceMappingURL=DiagnosticsReport.test.js.map