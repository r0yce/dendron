"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
(0, testUtilsV3_1.runSuiteButSkipForWindows)()("GIVEN testing code setupLegacyWorkspaceMulti", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, testUtilsV3_1.describeMultiWS)("WHEN configured for NATIVE workspace", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        ctx,
        workspaceType: common_all_1.WorkspaceType.NATIVE,
    }, () => {
        test("THEN initializes correctly", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNote = (await engine.getNoteMeta("foo")).data;
            (0, testUtilsv2_1.expect)(testNote).toBeTruthy();
        });
        test("THEN is of NATIVE type", (done) => {
            const { type } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(type).toEqual(common_all_1.WorkspaceType.NATIVE);
            done();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN configured for CODE workspace", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        ctx,
        workspaceType: common_all_1.WorkspaceType.CODE,
    }, () => {
        test("THEN initializes correctly", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNote = (await engine.getNoteMeta("foo")).data;
            (0, testUtilsv2_1.expect)(testNote).toBeTruthy();
        });
        test("THEN is of CODE type", (done) => {
            const { type } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(type).toEqual(common_all_1.WorkspaceType.CODE);
            done();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN workspace type is not specified", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        ctx,
    }, () => {
        test("THEN initializes correctly", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNote = (await engine.getNoteMeta("foo")).data;
            (0, testUtilsv2_1.expect)(testNote).toBeTruthy();
        });
        test("THEN is of CODE type", (done) => {
            const { type } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(type).toEqual(common_all_1.WorkspaceType.CODE);
            done();
        });
    });
});
//# sourceMappingURL=WorkspaceInit.test.js.map