"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const CreateJournalNoteCommand_1 = require("../../commands/CreateJournalNoteCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("CreateJournalNoteCommand", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN command executed", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN journal note with correct name created.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const wsUtils = ext.wsUtils;
            const cmd = new CreateJournalNoteCommand_1.CreateJournalNoteCommand(ext);
            const { engine } = ext.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await wsUtils.openNote(note);
            await cmd.run({ noConfirm: true });
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("foo.journal.")).toBeTruthy();
        });
    });
});
//# sourceMappingURL=CreateJournalNoteCommand.test.js.map