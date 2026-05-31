"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const ConfigureLocalOverride_1 = require("../../commands/ConfigureLocalOverride");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("ConfigureLocalOverrideCommand", function () {
    let homeDirStub;
    (0, testUtilsV3_1.describeSingleWS)("WHEN run", {}, () => {
        let cmd;
        (0, mocha_1.beforeEach)(() => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            cmd = new ConfigureLocalOverride_1.ConfigureLocalOverride(ext);
        });
        (0, mocha_1.describe)("AND scopoe is GLOBAL", () => {
            test("THEN the configuration file for the user should open", async () => {
                await cmd.run({ configScope: common_server_1.LocalConfigScope.GLOBAL });
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()).toEqual(common_server_1.DConfig.configOverridePath(wsRoot, common_server_1.LocalConfigScope.GLOBAL).toLowerCase());
            });
        });
        (0, mocha_1.describe)("AND scope is LOCAL", () => {
            (0, mocha_1.beforeEach)(() => {
                homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
            });
            (0, mocha_1.afterEach)(() => {
                homeDirStub.restore();
            });
            test("THEN the configuration file for the workspace should open", async () => {
                await cmd.run({ configScope: common_server_1.LocalConfigScope.WORKSPACE });
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.toLowerCase()).toEqual(common_server_1.DConfig.configOverridePath(wsRoot, common_server_1.LocalConfigScope.WORKSPACE).toLowerCase());
            });
        });
    });
});
//# sourceMappingURL=ConfigureLocalOverride.test.js.map