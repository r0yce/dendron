"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const GoUpCommand_1 = require("../../commands/GoUpCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("GoUpCommand", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    test("basic", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async ({ engine }) => {
                const note = (await engine.getNoteMeta("foo")).data;
                await WSUtils_1.WSUtils.openNote(note);
                await new GoUpCommand_1.GoUpCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith("root.md")).toBeTruthy();
                done();
            },
        });
    });
    test("go up with stub", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async ({ engine }) => {
                const note = (await engine.getNoteMeta("foo.ch1")).data;
                await WSUtils_1.WSUtils.openNote(note);
                await new GoUpCommand_1.GoUpCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith("foo.md")).toBeTruthy();
                done();
            },
        });
    });
});
//# sourceMappingURL=GoUpCommand.test.js.map