"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const fs_1 = __importDefault(require("fs"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const vscode_1 = __importDefault(require("vscode"));
const GoToSiblingCommand_1 = require("../../commands/GoToSiblingCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const createNotes = async ({ opts, fnames, }) => {
    Promise.all(fnames.map(async (fname) => common_test_utils_1.NoteTestUtilsV4.createNote({ ...opts, fname })));
};
const getPostSetupHookForNonJournalNotes = (fnames) => async ({ wsRoot, vaults }) => {
    await createNotes({
        opts: { wsRoot, vault: vaults[0] },
        fnames,
    });
};
const getPostHostSetupHookForJournalNotes = (fnames) => async ({ wsRoot, vaults }) => {
    await createNotes({
        opts: { wsRoot, vault: vaults[0], props: { traits: ["journalNote"] } },
        fnames: fnames.map((name) => "journal." + name),
    });
};
suite("GoToSibling", () => {
    (0, mocha_1.describe)("WHEN non-journal note is open", async () => {
        (0, testUtilsV3_1.describeSingleWS)("basic", { postSetupHook: getPostSetupHookForNonJournalNotes(["foo.a", "foo.b"]) }, () => {
            test("Next sibling should open", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "foo.a");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("foo.b.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("go over index", { postSetupHook: getPostSetupHookForNonJournalNotes(["foo.a", "foo.b"]) }, () => {
            test("Sibling navigation should wrap", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "foo.b");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("foo.a.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("numeric siblings sort correctly", {
            postSetupHook: getPostSetupHookForNonJournalNotes([
                "foo.1",
                "foo.2",
                "foo.3",
            ]),
        }, () => {
            test("Sibling navigation should be in numeric order", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "foo.1");
                const resp1 = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp1).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("foo.2.md")).toBeTruthy();
                const resp2 = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp2).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("foo.3.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("numeric and alphabetic siblings", {
            postSetupHook: getPostSetupHookForNonJournalNotes([
                "foo.a",
                "foo.b",
                "foo.3",
                "foo.300",
            ]),
        }, () => {
            test("Both alphabetical and numerical orders should be respected", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "foo.300");
                const resp1 = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp1).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith("foo.a.md")).toBeTruthy();
                const resp2 = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp2).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith("foo.b.md")).toBeTruthy();
                const resp4 = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp4).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith("foo.3.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("no siblings", { postSetupHook: getPostSetupHookForNonJournalNotes(["foo"]) }, () => {
            test("Warning message should appear", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "foo");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "other_error" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("foo.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("no editor", {}, () => {
            test("Warning message should appear", async () => {
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "no_editor" });
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("no active dendron note", {}, () => {
            test("Warning message should appear", async () => {
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                // Create a file that is not a Dendron note and show it on editor
                const workspaceRootPath = ExtensionProvider_1.ExtensionProvider.getEngine().wsRoot;
                const filePath = path_1.default.join(workspaceRootPath, "test.txt");
                fs_1.default.writeFileSync(filePath, "sample file content", "utf8");
                const fileUri = vscode_1.default.Uri.file(filePath);
                const doc = await vscode_1.default.workspace.openTextDocument(fileUri);
                await vscode_1.default.window.showTextDocument(doc);
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "other_error" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("test.txt")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("nav in root", { postSetupHook: getPostSetupHookForNonJournalNotes(["foo"]) }, () => {
            test("Sibling navigation should be performed on the children of the root note", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "root");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("foo.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("nav in multi-root", {
            postSetupHook: async ({ wsRoot, vaults }) => {
                Promise.all(vaults.map(async (vault) => {
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault,
                        fname: "foo.a",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault,
                        fname: "foo.b",
                    });
                }));
            },
        }, () => {
            test("Sibling navigation should treat notes in different vaults separately", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "foo.a");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("foo.b.md")).toBeTruthy();
            });
        });
    });
    (0, mocha_1.describe)("WHEN journal note is open", async () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN next sibling is next day", {
            postSetupHook: getPostHostSetupHookForJournalNotes([
                "2022.07.06",
                "2022.07.07",
            ]),
        }, () => {
            test("THEN the note for the next day should open", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "journal.2022.07.06");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("journal.2022.07.07.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN next sibling is the first day of the next month", {
            postSetupHook: getPostHostSetupHookForJournalNotes([
                "2022.06.30",
                "2022.07.01",
            ]),
        }, () => {
            test("THEN the note for the first day of the next month should open", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "journal.2022.06.30");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("journal.2022.07.01.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN next sibling is the first day of the next year", {
            postSetupHook: getPostHostSetupHookForJournalNotes([
                "2021.12.31",
                "2022.01.01",
            ]),
        }, () => {
            test("THEN the note for the first day of the next year should open", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "journal.2021.12.31");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("journal.2022.01.01.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN next sibling is not the next day in sequence", {
            postSetupHook: getPostHostSetupHookForJournalNotes([
                "2021.07.04",
                "2023.07.05",
                "2022.07.06",
            ]),
        }, () => {
            test("THEN the note for the closest day should open", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "journal.2021.07.04");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("journal.2022.07.06.md")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN date config for journal notes is note default", {
            postSetupHook: getPostHostSetupHookForJournalNotes([
                "06.01",
                "06.30",
                "07.01",
            ]),
            modConfigCb: (config) => {
                // Change journal date config on dendron.yml for the current workspace
                config.workspace.journal.dateFormat = "MM.dd";
                return config;
            },
        }, () => {
            test("THEN the default non-chronological one-parent-level navigation should be used", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await openNote(ext, "journal.06.30");
                const resp = await new GoToSiblingCommand_1.GoToSiblingCommand().execute({
                    direction: "next",
                });
                (0, testUtilsv2_1.expect)(resp).toEqual({ msg: "ok" });
                (0, testUtilsv2_1.expect)(getActiveDocumentFname()?.endsWith("journal.06.01.md")).toBeTruthy();
            });
        });
    });
});
const getActiveDocumentFname = () => vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
const openNote = async (ext, fname, vault) => {
    const { engine } = ext.getDWorkspace();
    const hitNotes = await engine.findNotesMeta({ fname, vault });
    if (hitNotes.length === 0)
        throw Error("Cannot find the active note");
    await new WSUtilsV2_1.WSUtilsV2(ext).openNote(hitNotes[0]);
};
//# sourceMappingURL=GoToSibling.test.js.map