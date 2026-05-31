"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const vscode_1 = __importDefault(require("vscode"));
const TogglePreview_1 = require("../../commands/TogglePreview");
const PreviewViewFactory_1 = require("../../components/views/PreviewViewFactory");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("GIVEN TogglePreview", function () {
    let cmd;
    (0, mocha_1.beforeEach)(() => {
        cmd = new TogglePreview_1.TogglePreviewCommand(PreviewViewFactory_1.PreviewPanelFactory.create(ExtensionProvider_1.ExtensionProvider.getExtension()));
    });
    // After each test, run Toggle Preview to close the preview panel
    (0, mocha_1.afterEach)(async () => {
        await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN opening the preview from the command bar", {}, () => {
        let note;
        (0, mocha_1.before)(async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "preview-test",
            });
            // Open the note so that's the current note
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
        });
        (0, mocha_1.test)("THEN the current note is opened", async () => {
            const out = await cmd.run();
            (0, testUtilsv2_1.expect)(out?.note).toBeTruthy();
            (0, testUtilsv2_1.expect)(out.note.id).toEqual(note.id);
            (0, testUtilsv2_1.expect)(out.note.fname).toEqual(note.fname);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN opening the preview from a context menu AND a note is open", {}, () => {
        let note;
        (0, mocha_1.before)(async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "preview-test",
            });
            const wrongNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "wrong-note",
            });
            // A different note is open this time
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(wrongNote);
        });
        (0, mocha_1.test)("THEN the selected note is opened", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // When opened from a menu, the file path will be passed as an argument
            const path = vscode_1.default.Uri.file(common_all_1.NoteUtils.getFullPath({ note, wsRoot }));
            const out = await cmd.run(path);
            (0, testUtilsv2_1.expect)(out?.note).toBeTruthy();
            (0, testUtilsv2_1.expect)(out.note.id).toEqual(note.id);
            (0, testUtilsv2_1.expect)(out.note.fname).toEqual(note.fname);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN opening the preview from a context menu AND no note is open", {}, () => {
        let note;
        (0, mocha_1.before)(async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "preview-test",
            });
            // Make sure no note is open
            await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
        });
        (0, mocha_1.test)("THEN the selected note is opened", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // When opened from a menu, the file path will be passed as an argument
            const path = vscode_1.default.Uri.file(common_all_1.NoteUtils.getFullPath({ note, wsRoot }));
            const out = await cmd.run(path);
            (0, testUtilsv2_1.expect)(out?.note).toBeTruthy();
            (0, testUtilsv2_1.expect)(out.note.id).toEqual(note.id);
            (0, testUtilsv2_1.expect)(out.note.fname).toEqual(note.fname);
        });
    });
    // });
    (0, testUtilsV3_1.describeSingleWS)("WHEN opening a non-note file from the content menu", {}, () => {
        let fsPath;
        (0, mocha_1.before)(async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            fsPath = path_1.default.join(wsRoot, "foo-bar.md");
            await fs_extra_1.default.writeFile(fsPath, "foo bar");
            // Make sure no note is open
            await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
        });
        (0, mocha_1.test)("THEN the selected non-note file is opened", async () => {
            // When opened from a menu, the file path will be passed as an argument
            const path = vscode_1.default.Uri.file(fsPath);
            const out = await cmd.run(path);
            (0, testUtilsv2_1.expect)(out?.fsPath).toEqual(fsPath);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN opening a non-note file from the command bar", {}, () => {
        let fsPath;
        let uri;
        (0, mocha_1.before)(async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            fsPath = path_1.default.join(wsRoot, "foo-bar.md");
            await fs_extra_1.default.writeFile(fsPath, "foo bar");
            uri = vscode_1.default.Uri.file(fsPath);
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
        });
        (0, mocha_1.test)("THEN the current non-note file is opened", async () => {
            const out = await cmd.run();
            (0, testUtilsv2_1.expect)(out?.fsPath).toEqual(fsPath);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN preview is open for a note containing link with .md in its name", //[[lorem.ipsum.mdone.first]]
    {}, () => {
        let note;
        (0, mocha_1.before)(async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "lorem.ipsum.mdone.first",
                body: "Lorem ipsum",
            });
            note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "preview-link-test",
                body: "[[lorem.ipsum.mdone.first]]",
            });
        });
        (0, mocha_1.test)("THEN preview must link to the correct note", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // When opened from a menu, the file path will be passed as an argument
            const path = vscode_1.default.Uri.file(common_all_1.NoteUtils.getFullPath({ note, wsRoot }));
            const out = await cmd.run(path);
            (0, testUtilsv2_1.expect)(out?.note).toBeTruthy();
            (0, testUtilsv2_1.expect)(out.note.fname).toEqual(note.fname);
            const links = out.note.links;
            (0, testUtilsv2_1.expect)(links[0].value).toEqual("lorem.ipsum.mdone.first");
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN preview panel is already open", {}, () => {
        let note;
        (0, mocha_1.before)(async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                wsRoot,
                vault: vaults[0],
                fname: "preview-test",
            });
            // Open the note so that's the current note
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
            // Open the preview panel
            await cmd.run();
        });
        (0, mocha_1.test)("THEN the preview should be hidden", async () => {
            /* When the preview goes hidden, the command retruns undefined */
            const out = await cmd.run();
            (0, testUtilsv2_1.expect)(out?.note).toBeFalsy();
        });
    });
});
//# sourceMappingURL=TogglePreview.test.js.map