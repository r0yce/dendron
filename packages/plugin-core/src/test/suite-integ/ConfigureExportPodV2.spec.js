"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const pods_core_1 = require("@dendronhq/pods-core");
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const ConfigureExportPodV2_1 = require("../../commands/pods/ConfigureExportPodV2");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const PodControls_1 = require("../../components/pods/PodControls");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const mocha_1 = require("mocha");
suite("Configure ExportPod V2 ", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        afterHook: () => {
            sinon_1.default.restore();
        },
    });
    (0, mocha_1.describe)("GIVEN Configure Export V2 is run", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN New Export option is selected from the Quickpick", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN new config must be created", async () => {
                const cmd = new ConfigureExportPodV2_1.ConfigureExportPodV2();
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptForExportConfigOrNewExport")
                    .returns(Promise.resolve("New Export"));
                const podType = pods_core_1.PodV2Types.GoogleDocsExportV2;
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptForPodType")
                    .returns(Promise.resolve(podType));
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptForGenericId")
                    .returns(Promise.resolve("foo"));
                await cmd.run();
                const activePath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
                (0, testUtilsv2_1.expect)(activePath?.endsWith(path_1.default.join("pods", "custom", "config.foo.yml"))).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN a custom pod ID is selected", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN config of selected podId must open", async () => {
                const cmd = new ConfigureExportPodV2_1.ConfigureExportPodV2();
                sinon_1.default
                    .stub(PodControls_1.PodUIControls, "promptForExportConfigOrNewExport")
                    .returns(Promise.resolve({ podId: "foobar" }));
                //setup
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const configPath = pods_core_1.PodUtils.getCustomConfigPath({
                    wsRoot,
                    podId: "foobar",
                });
                (0, fs_extra_1.ensureDirSync)(path_1.default.dirname(configPath));
                (0, common_server_1.writeYAML)(configPath, {
                    podType: pods_core_1.PodV2Types.MarkdownExportV2,
                    podId: "foobar",
                    exportScope: "Note",
                });
                await cmd.run();
                const activePath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
                (0, testUtilsv2_1.expect)(activePath?.endsWith(path_1.default.join("pods", "custom", "config.foobar.yml"))).toBeTruthy();
            });
        });
    });
});
//# sourceMappingURL=ConfigureExportPodV2.spec.js.map