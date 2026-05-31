"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const mocha_1 = require("mocha");
const MergeNoteCommand_1 = require("../../commands/MergeNoteCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsV3_1 = require("../testUtilsV3");
const testUtilsv2_1 = require("../testUtilsv2");
suite("MergeNote", function () {
    (0, mocha_1.describe)("GIVEN a source note with no backlinks", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN merged", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "source",
                    wsRoot,
                    vault: vaults[0],
                    body: "Source body\n",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "dest",
                    wsRoot,
                    vault: vaults[0],
                    body: "Dest body\n",
                });
            },
            timeout: 5e3,
        }, () => {
            test("THEN source body is appended to dest, source is deleted, and changes are emitted", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new MergeNoteCommand_1.MergeNoteCommand(extension);
                const engine = extension.getEngine();
                const preRunSource = (await engine.getNote("source")).data;
                const preRunDest = (await engine.getNote("dest")).data;
                if (preRunSource && preRunDest) {
                    await extension.wsUtils.openNote(preRunSource);
                }
                else {
                    throw new Error("source and dest not found.");
                }
                const runOut = await cmd.run({
                    dest: "dest",
                    noConfirm: true,
                });
                const postRunSource = (await engine.getNote("source")).data;
                const postRunDest = (await engine.getNote("dest")).data;
                (0, testUtilsv2_1.expect)(postRunSource).toBeFalsy();
                (0, testUtilsv2_1.expect)(postRunDest).toBeTruthy();
                (0, testUtilsv2_1.expect)(postRunDest?.body).toEqual("Dest body\n\n---\n\n# Source\n\nSource body\n");
                (0, testUtilsv2_1.expect)(runOut?.changed.length).toEqual(3);
                (0, testUtilsv2_1.expect)(runOut?.changed.map((change) => change.status)).toEqual([
                    "update", // dest updated
                    "update", // root updated
                    "delete", // source deleted
                ]);
            });
        });
    });
    (0, mocha_1.describe)("GIVEN a source note with backlinks", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN merged", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "source",
                    wsRoot,
                    vault: vaults[0],
                    body: "Source body\n",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "dest",
                    wsRoot,
                    vault: vaults[0],
                    body: "Dest body\n",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "ref",
                    wsRoot,
                    vault: vaults[0],
                    body: "[[source]]\n[[dendron://vault1/source]]\n![[source]]\n![[dendron://vault1/source]]",
                });
            },
            timeout: 5e3,
        }, () => {
            test("THEN source body is appended to dest, source is deleted, and changes are emitted", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new MergeNoteCommand_1.MergeNoteCommand(extension);
                const engine = extension.getEngine();
                const preRunSource = (await engine.getNote("source")).data;
                const preRunDest = (await engine.getNote("dest")).data;
                const preRunRef = (await engine.getNote("ref")).data;
                if (preRunSource && preRunDest && preRunRef) {
                    await extension.wsUtils.openNote(preRunSource);
                }
                else {
                    throw new Error("Note(s) not found.");
                }
                const runOut = await cmd.run({
                    dest: "dest",
                    noConfirm: true,
                });
                const postRunSource = (await engine.getNote("source")).data;
                const postRunDest = (await engine.getNote("dest")).data;
                const postRunRef = (await engine.getNote("ref")).data;
                (0, testUtilsv2_1.expect)(postRunSource).toBeFalsy();
                (0, testUtilsv2_1.expect)(postRunDest).toBeTruthy();
                (0, testUtilsv2_1.expect)(postRunDest?.body).toEqual("Dest body\n\n---\n\n# Source\n\nSource body\n");
                (0, testUtilsv2_1.expect)(postRunRef?.body).toEqual("[[dest]]\n[[dendron://vault1/dest]]\n![[dest]]\n![[dendron://vault1/dest]]");
                (0, testUtilsv2_1.expect)(runOut?.changed.length).toEqual(12);
                (0, testUtilsv2_1.expect)(runOut?.changed.map((change) => change.status)).toEqual([
                    "update", // dest updated
                    "update", // dest updated
                    "update", // dest updated
                    "update", // dest updated
                    "update", // dest updated
                    "update", // source updated
                    "update", // source updated
                    "update", // source updated
                    "update", // source updated
                    "update", // ref updated
                    "update", // root updated
                    "delete", // source deleted
                ]);
            });
        });
    });
});
//# sourceMappingURL=MergeNoteCommand.test.js.map