"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const GoDownCommand_1 = require("../../commands/GoDownCommand");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("notes", function () {
    let ctx;
    ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    test("basic", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async ({ engine }) => {
                const note = (await engine.getNoteMeta("foo")).data;
                await WSUtils_1.WSUtils.openNote(note);
                await new GoDownCommand_1.GoDownCommand().run({ noConfirm: true });
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                const activeNote = await WSUtils_1.WSUtils.getNoteFromDocument(editor.document);
                (0, testUtilsv2_1.expect)(activeNote?.fname).toEqual("foo.ch1");
                done();
            },
        });
    });
});
//# sourceMappingURL=GoDownCommand.test.js.map