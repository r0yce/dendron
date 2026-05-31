"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const sinon_1 = __importDefault(require("sinon"));
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const TaskStatus_1 = require("../../commands/TaskStatus");
suite("GIVEN TaskStatus", function () {
    this.timeout(5e3);
    (0, testUtilsV3_1.describeSingleWS)("WHEN a link to a task note is selected", {}, () => {
        let taskNote;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            showQuickPick = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({
                label: "y",
            });
            taskNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "task.test",
                vault: vaults[0],
                wsRoot,
                body: "",
                custom: {
                    status: "",
                },
            });
            const currentNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "base",
                vault: vaults[0],
                wsRoot,
                body: "[[task.test]]",
            });
            const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(currentNote);
            editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
            const cmd = new TaskStatus_1.TaskStatusCommand(extension);
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            showQuickPick.restore();
        });
        test("THEN prompts for the status", () => {
            (0, testUtilsv2_1.expect)(showQuickPick.calledOnce).toBeTruthy();
        });
        test("THEN updates the task status", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const task = (await engine.findNotesMeta({
                fname: "task.test",
                vault: taskNote.vault,
            }))[0];
            (0, testUtilsv2_1.expect)(task?.custom.status === "y");
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN a broken link is selected", {}, () => {
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            showQuickPick = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({
                label: "y",
            });
            const currentNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "base",
                vault: vaults[0],
                wsRoot,
                body: "[[task.test]]",
            });
            const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(currentNote);
            editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
            const cmd = new TaskStatus_1.TaskStatusCommand(extension);
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            showQuickPick.restore();
        });
        test("THEN didn't prompt for the status", () => {
            (0, testUtilsv2_1.expect)(showQuickPick.called).toBeFalsy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN the selected link is ambiguous", 
    // test is flaky
    { timeout: 1e4 }, () => {
        let taskNote;
        let otherTaskNote;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            taskNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "task.test",
                vault: vaults[0],
                wsRoot,
                body: "",
                genRandomId: true,
                custom: {
                    status: "",
                },
            });
            otherTaskNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "task.test",
                vault: vaults[1],
                wsRoot,
                body: "",
                genRandomId: true,
                custom: {
                    status: "",
                },
            });
            const currentNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "base",
                vault: vaults[0],
                wsRoot,
                body: "[[task.test]]",
            });
            const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(currentNote);
            editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
            showQuickPick = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            showQuickPick
                .onFirstCall()
                .resolves({ label: taskNote.title, detail: taskNote.vault.fsPath });
            showQuickPick.onSecondCall().resolves({
                label: "y",
            });
            const cmd = new TaskStatus_1.TaskStatusCommand(extension);
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            showQuickPick.restore();
        });
        test("THEN prompts for the note and the status", () => {
            (0, testUtilsv2_1.expect)(showQuickPick.callCount).toEqual(2);
        });
        test("THEN updates the task status for the right task", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const task = (await engine.getNote(taskNote.id)).data;
            (0, testUtilsv2_1.expect)(task?.custom.status === "y");
            const otherTask = (await engine.getNote(otherTaskNote.id)).data;
            (0, testUtilsv2_1.expect)(lodash_1.default.isEmpty(otherTask?.custom?.status)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)("WHEN no link is selected", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND a task note is open", {}, () => {
            let taskNote;
            let showQuickPick;
            (0, mocha_1.before)(async () => {
                const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                taskNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    engine,
                    fname: "task.test",
                    vault: vaults[0],
                    wsRoot,
                    body: "",
                    genRandomId: true,
                    custom: {
                        status: "",
                    },
                });
                await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(taskNote);
                showQuickPick = sinon_1.default
                    .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                    .resolves({ label: "y" });
                const cmd = new TaskStatus_1.TaskStatusCommand(extension);
                await cmd.run();
            });
            test("THEN prompts for the status", () => {
                (0, testUtilsv2_1.expect)(showQuickPick.calledOnce).toBeTruthy();
            });
            test("THEN sets the status for the current note", async () => {
                const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const task = (await engine.getNote(taskNote.id)).data;
                (0, testUtilsv2_1.expect)(task?.custom.status === "y");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND the current note is NOT a task", {}, () => {
            let otherNote;
            let showQuickPick;
            (0, mocha_1.before)(async () => {
                const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                otherNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    engine,
                    fname: "test",
                    vault: vaults[0],
                    wsRoot,
                    body: "",
                });
                await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(otherNote);
                showQuickPick = sinon_1.default
                    .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                    .resolves({ label: "y" });
                const cmd = new TaskStatus_1.TaskStatusCommand(extension);
                await cmd.run();
            });
            test("THEN doesn't prompt for the status", () => {
                (0, testUtilsv2_1.expect)(showQuickPick.called).toBeFalsy();
            });
            test("THEN doesn't set a status for the current note", async () => {
                const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = (await engine.getNote(otherNote.id)).data;
                (0, testUtilsv2_1.expect)(note?.custom?.status === undefined).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND no note is open", {}, () => {
            let showQuickPick;
            (0, mocha_1.before)(async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                showQuickPick = sinon_1.default
                    .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                    .resolves({ label: "y" });
                const cmd = new TaskStatus_1.TaskStatusCommand(extension);
                await cmd.run();
            });
            test("THEN doesn't prompt for the status", () => {
                (0, testUtilsv2_1.expect)(showQuickPick.called).toBeFalsy();
            });
        });
    });
});
//# sourceMappingURL=TaskStatus.test.js.map