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
const ConfigurePodCommand_1 = require("../../commands/ConfigurePodCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("ConfigurePod", function () {
    let root;
    let podsDir;
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => {
            root = (0, common_server_1.tmpDir)();
            podsDir = path_1.default.join(root.name, "pods");
        },
    });
    test("no config", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async () => {
                const cmd = new ConfigurePodCommand_1.ConfigurePodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.JSONExportPod);
                cmd.gatherInputs = async () => {
                    return { podClass: podChoice.podClass };
                };
                await cmd.run();
                const activePath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
                (0, testUtilsv2_1.expect)(activePath?.endsWith("pods/dendron.json/config.export.yml")).toBeTruthy();
                done();
            },
        });
    });
    test("config present", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async () => {
                const cmd = new ConfigurePodCommand_1.ConfigurePodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.JSONExportPod);
                const podClass = podChoice.podClass;
                cmd.gatherInputs = async () => {
                    return { podClass };
                };
                // setup
                const configPath = pods_core_1.PodUtils.getConfigPath({ podsDir, podClass });
                const exportDest = path_1.default.join(pods_core_1.PodUtils.getPath({ podsDir, podClass }), "export.json");
                (0, fs_extra_1.ensureDirSync)(path_1.default.dirname(configPath));
                (0, common_server_1.writeYAML)(configPath, { dest: exportDest });
                await cmd.run();
                const activePath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
                (0, testUtilsv2_1.expect)(activePath?.endsWith("pods/dendron.json/config.export.yml")).toBeTruthy();
                done();
            },
        });
    });
});
//# sourceMappingURL=ConfigurePod.spec.js.map