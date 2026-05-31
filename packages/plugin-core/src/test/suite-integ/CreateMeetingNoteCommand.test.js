"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const CreateMeetingNoteCommand_1 = require("../../commands/CreateMeetingNoteCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("GIVEN CreateMeetingNoteCommand in a basic workspace", function () {
    const TEMPLATE_BODY = "test template";
    (0, testUtilsV3_1.describeMultiWS)("WHEN CreateMeetingNoteCommand is executed once", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateMeetingNoteCommand_1.CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
        timeout: 5e3,
    }, () => {
        test("THEN meeting note with correct name created.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const wsUtils = ext.wsUtils;
            const cmd = new CreateMeetingNoteCommand_1.CreateMeetingNoteCommand(ext, true);
            const { engine } = ext.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await wsUtils.openNote(note);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("meet.")).toBeTruthy();
        });
        test("AND the meeting note trait ID is set", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const wsUtils = ext.wsUtils;
            const cmd = new CreateMeetingNoteCommand_1.CreateMeetingNoteCommand(ext, true);
            const { engine } = ext.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await wsUtils.openNote(note);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // TODO: traits isn't exposed in newNote props here because in the test
            //we extract noteProps via `getNoteFromTextEditor` instead of the
            //engine. So for now, test via the raw traitIds that should have been
            //added to the note.
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "meetingNote").toBeTruthy();
        });
        test("AND the meeting note template has been applied", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const wsUtils = ext.wsUtils;
            const cmd = new CreateMeetingNoteCommand_1.CreateMeetingNoteCommand(ext, true);
            const { engine } = ext.getDWorkspace();
            const note = (await engine.getNoteMeta("foo")).data;
            await wsUtils.openNote(note);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
        });
    });
});
//# sourceMappingURL=CreateMeetingNoteCommand.test.js.map