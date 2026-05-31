"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const testUtilsV3_1 = require("../testUtilsV3");
const vscode = __importStar(require("vscode"));
const MoveSelectionToCommand_1 = require("../../commands/MoveSelectionToCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const mocha_1 = require("mocha");
const testUtilsv2_1 = require("../testUtilsv2");
suite("MoveSelectionToCommand", function () {
    (0, mocha_1.describe)("GIVEN a note and valid selection", () => {
        let activeNote;
        (0, testUtilsV3_1.describeMultiWS)("WHEN moving to new note", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "active",
                    vault: vaults[0],
                    wsRoot,
                    body: [
                        "## Stuff",
                        "one",
                        "two",
                        "three",
                        "",
                        "some text ^test",
                        "",
                        "same file [[#^test]]",
                    ].join("\n"),
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "refnote",
                    vault: vaults[0],
                    wsRoot,
                    body: [
                        "[[stuff|active#stuff]]",
                        "[[link to anchor|active#^test]]",
                    ].join("\n"),
                    genRandomId: true,
                });
            },
        }, () => {
            test("THEN selection is moved to destination, selection is replaced, and backlinks are updated", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const { vaults } = extension.getDWorkspace();
                await extension.wsUtils.openNote(activeNote);
                const editor = vscode.window.activeTextEditor;
                const cmd = new MoveSelectionToCommand_1.MoveSelectionToCommand(extension);
                editor.selection = new vscode.Selection(new vscode.Position(7, 0), new vscode.Position(13, 0));
                await cmd.run({
                    initialValue: "newNote",
                    noConfirm: true,
                });
                const originalNote = (await extension.getEngine().findNotes({
                    fname: "active",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(originalNote.body.includes("## Stuff")).toBeFalsy();
                (0, testUtilsv2_1.expect)(originalNote.body.includes("same file [[newNote#^test]]"));
                const newNote = (await extension.getEngine().findNotes({
                    fname: "newNote",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(newNote).toBeTruthy();
                (0, testUtilsv2_1.expect)(newNote.body.trim()).toEqual("## Stuff\none\ntwo\nthree\n\nsome text ^test");
                const postRunRefNote = (await extension.getEngine().findNotes({
                    fname: "refnote",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(postRunRefNote.body).toEqual("[[stuff|newNote#stuff]]\n[[link to anchor|newNote#^test]]");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN moving to existing note", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "active",
                    vault: vaults[0],
                    wsRoot,
                    body: [
                        "## Stuff",
                        "one",
                        "two",
                        "three",
                        "",
                        "some text ^test",
                        "",
                        "same file [[#^test]]",
                    ].join("\n"),
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "refnote",
                    vault: vaults[0],
                    wsRoot,
                    body: [
                        "[[stuff|active#stuff]]",
                        "[[link to anchor|active#^test]]",
                    ].join("\n"),
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "anotherNote",
                    vault: vaults[0],
                    wsRoot,
                    body: "anotherNote",
                    genRandomId: true,
                });
            },
        }, () => {
            test("THEN selection is moved to destination, selection is replaced, and backlinks are updated", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const { vaults } = extension.getDWorkspace();
                await extension.wsUtils.openNote(activeNote);
                const editor = vscode.window.activeTextEditor;
                const cmd = new MoveSelectionToCommand_1.MoveSelectionToCommand(extension);
                editor.selection = new vscode.Selection(new vscode.Position(7, 0), new vscode.Position(13, 0));
                await cmd.run({
                    initialValue: "anotherNote",
                    noConfirm: true,
                });
                const originalNote = (await extension.getEngine().findNotes({
                    fname: "active",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(originalNote.body.includes("## Stuff")).toBeFalsy();
                (0, testUtilsv2_1.expect)(originalNote.body.includes("same file [[newNote#^test]]"));
                const anotherNote = (await extension.getEngine().findNotes({
                    fname: "anotherNote",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(anotherNote.body.trim()).toEqual("anotherNote\n\n## Stuff\none\ntwo\nthree\n\nsome text ^test");
                const postRunRefNote = (await extension.getEngine().findNotes({
                    fname: "refnote",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(postRunRefNote.body).toEqual("[[stuff|anotherNote#stuff]]\n[[link to anchor|anotherNote#^test]]");
            });
        });
    });
});
//# sourceMappingURL=MoveSelectionToCommand.test.js.map