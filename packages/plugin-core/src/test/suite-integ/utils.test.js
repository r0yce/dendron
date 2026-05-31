"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const utils_1 = require("../../components/lookup/utils");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("Plugin Utils", function () {
    (0, mocha_1.describe)("PickerUtils", function () {
        const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
        test("vault picker", function (done) {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ vaults }) => {
                    const stub = sinon_1.default
                        .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                        .returns({});
                    await utils_1.PickerUtilsV2.promptVault();
                    const items = vaults.map((vault) => ({
                        vault,
                        label: common_all_1.VaultUtils.getName(vault),
                    }));
                    (0, testUtilsv2_1.expect)(stub.calledOnceWith(items)).toBeTruthy();
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=utils.test.js.map