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
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
const ImportPod_1 = require("../../commands/ImportPod");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsV3_1 = require("../testUtilsV3");
suite("ImportPod", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => { },
    });
    test("json", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
                await engine_test_utils_1.PODS_CORE.JSON.IMPORT.BASIC.preSetupHook({ wsRoot, vaults });
            },
            onInit: async ({ vaults, wsRoot }) => {
                const podClass = pods_core_1.JSONImportPod;
                const podsDir = path_1.default.join(wsRoot, "pods");
                const configPath = pods_core_1.PodUtils.getConfigPath({ podsDir, podClass });
                const fakePod = () => {
                    return {
                        config: [],
                        execute: async ({ config }) => {
                            (0, fs_extra_1.ensureDirSync)(path_1.default.dirname(configPath));
                            (0, common_server_1.writeYAML)(configPath, config);
                            const cmd = new ImportPod_1.ImportPodCommand();
                            const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.JSONImportPod);
                            // @ts-ignore
                            cmd.gatherInputs = async () => {
                                return { label: "", podChoice };
                            };
                            await cmd.run();
                        },
                    };
                };
                const pod = fakePod();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                await engine_test_utils_1.PODS_CORE.JSON.IMPORT.BASIC.testFunc({
                    engine,
                    wsRoot,
                    vaults,
                    extra: { pod },
                    initResp: {},
                });
                done();
            },
        });
    });
});
//# sourceMappingURL=ImportPod.test.js.map