"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const RenameNoteCommand_1 = require("../../commands/RenameNoteCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsV3_1 = require("../testUtilsV3");
const testUtilsv2_1 = require("../testUtilsv2");
suite("RenameNoteCommand", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN note with invalid hierarchy", {}, () => {
        test("WHEN renamed to valid hierarchy THEN renamed properly", async () => {
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const { vaults, wsRoot } = extension.getDWorkspace();
            const engine = extension.getEngine();
            const invalidNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: ".foo",
                body: "invalid note body",
                vault: vaults[0],
                engine,
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "some-note",
                body: "[[.foo]]",
                vault: vaults[0],
                wsRoot,
                engine,
            });
            await extension.wsUtils.openNote(invalidNote);
            const cmd = new RenameNoteCommand_1.RenameNoteCommand(extension);
            const vaultName = common_all_1.VaultUtils.getName(vaults[0]);
            const out = await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: invalidNote.fname,
                            vaultName,
                        },
                        newLoc: {
                            fname: "foo",
                            vaultName,
                        },
                    },
                ],
                nonInteractive: true,
                initialValue: "foo",
            });
            // note `.foo` is renamed to `foo`, `some-note`'s reference to `.foo` is updated to `foo`
            (0, testUtilsv2_1.expect)(out.changed.length).toEqual(6);
            const foo = (await engine.findNotes({
                vault: vaults[0],
                fname: "foo",
            }))[0];
            (0, testUtilsv2_1.expect)(foo).toBeTruthy();
            const updatedSomeNote = (await engine.findNotes({
                vault: vaults[0],
                fname: "some-note",
            }))[0];
            (0, testUtilsv2_1.expect)(updatedSomeNote.body).toEqual("[[foo]]");
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a note with reference to user note", {}, () => {
        test("WHEN renamed THEN note ref should not break", async () => {
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const { vaults, wsRoot } = extension.getDWorkspace();
            const engine = extension.getEngine();
            const oldNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "user.one",
                body: "note body",
                vault: vaults[0],
                engine,
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "some-note",
                body: "![[user.one]]",
                vault: vaults[0],
                wsRoot,
                engine,
            });
            await extension.wsUtils.openNote(oldNote);
            const cmd = new RenameNoteCommand_1.RenameNoteCommand(extension);
            const vaultName = common_all_1.VaultUtils.getName(vaults[0]);
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: oldNote.fname,
                            vaultName,
                        },
                        newLoc: {
                            fname: "user.two",
                            vaultName,
                        },
                    },
                ],
                nonInteractive: true,
                initialValue: "user.two",
            });
            // note `user.one` is renamed to `user.two`, `some-note`'s reference to `![[user.one]]` is updated to `![[user.two]]`
            const newNote = (await engine.findNotes({
                vault: vaults[0],
                fname: "user.two",
            }))[0];
            (0, testUtilsv2_1.expect)(newNote).toBeTruthy();
            const updatedSomeNote = (await engine.findNotes({
                vault: vaults[0],
                fname: "some-note",
            }))[0];
            (0, testUtilsv2_1.expect)(updatedSomeNote.body).toEqual("![[user.two]]");
        });
    });
});
//# sourceMappingURL=RenameNoteCommand.test.js.map