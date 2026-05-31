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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const CopyNoteLink_1 = require("../../commands/CopyNoteLink");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
function openNote(note) {
    return ExtensionProvider_1.ExtensionProvider.getExtension().wsUtils.openNote(note);
}
suite("CopyNoteLink", function () {
    // these tests can run long, set timeout to 5s
    this.timeout(5e5);
    let copyNoteLinkCommand;
    (0, mocha_1.beforeEach)(() => {
        copyNoteLinkCommand = new CopyNoteLink_1.CopyNoteLinkCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a basic setup on a single vault workspace", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("WHEN the editor is on a saved file, THEN CopyNoteLink should return link with title and fname of engine note", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "foo.md");
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual("[[Foo|foo]]");
        });
        test("WHEN the editor is on a dirty file, THEN CopyNoteLink should return undefined and cause an onDidSaveTextDocument to be fired", (done) => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNote = common_all_1.NoteUtils.create({
                fname: "foo",
                vault: vaults[0],
            });
            // onEngineNoteStateChanged is not being triggered by save so test to make sure that save is being triggered instead
            const disposable = vscode.workspace.onDidSaveTextDocument((textDocument) => {
                (0, common_test_utils_1.testAssertsInsideCallback)(() => {
                    (0, testUtilsv2_1.expect)(textDocument.getText().includes("id: barbar")).toBeTruthy();
                    disposable.dispose();
                }, done);
            });
            ExtensionProvider_1.ExtensionProvider.getWSUtils()
                .openNote(testNote)
                .then(async (editor) => {
                editor
                    .edit(async (editBuilder) => {
                    // Replace id of frontmatter
                    const startPos = new vscode.Position(1, 4);
                    const endPos = new vscode.Position(1, 7);
                    editBuilder.replace(new vscode.Range(startPos, endPos), "barbar");
                })
                    .then(async () => {
                    copyNoteLinkCommand.run();
                });
            });
        });
        test("WHEN the editor is selecting a header, THEN CopyNoteLink should return a link with that header", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "testHeader",
                vault: vaults[0],
                wsRoot,
                body: "## [[Foo Bar|foo.bar]]",
                engine,
            });
            // Open and select the header
            const editor = await openNote(noteWithLink);
            const start = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
            const end = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
            editor.selection = new vscode.Selection(start, end);
            // generate a wikilink for it
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual(`[[Foo Bar|${noteWithLink.fname}#foo-bar]]`);
        });
        test("WHEN the editor is selecting a header with unicode characters, THEN CopyNoteLink should return a link with that header", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "testUnicode",
                vault: vaults[0],
                wsRoot,
                body: "## Lörem [[Foo：Bar🙂Baz|foo：bar🙂baz]] Ipsum",
                engine,
            });
            // Open and select the header
            const editor = await openNote(noteWithLink);
            const start = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
            const end = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
            editor.selection = new vscode.Selection(start, end);
            // generate a wikilink for it
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual(`[[Lörem Foo：Bar🙂Baz Ipsum|testUnicode#lörem-foobarbaz-ipsum]]`);
        });
        test("WHEN the editor is selecting an anchor, THEN CopyNoteLink should return a link with that anchor", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const noteWithTarget = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.createWithEngine({
                wsRoot,
                vault: vaults[0],
                engine,
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.createWithEngine({
                wsRoot,
                vault: vaults[0],
                engine,
            });
            let editor = await openNote(noteWithTarget);
            const pos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
            const pos2 = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({
                char: 12,
            });
            editor.selection = new vscode.Selection(pos, pos2);
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual(`[[H1|${noteWithTarget.fname}#h1]]`);
            editor = await openNote(noteWithTarget);
            editor.selection = new vscode.Selection(testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }), testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 }));
            const link2 = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link2).toEqual(`[[H2|${noteWithTarget.fname}#h2]]`);
        });
        test("WHEN the editor is selecting a block anchor, THEN CopyNoteLink should return a link with that block anchor", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
                wsRoot,
                vault: vaults[0],
                engine,
            });
            const editor = await openNote(note);
            editor.selection = new vscode.Selection(testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }), testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 }));
            const link = (await copyNoteLinkCommand.execute({}))?.link;
            const body = editor.document.getText();
            // check that the link looks like what we expect
            (0, testUtilsv2_1.expect)(link).toEqual("[[Anchor Target|anchor-target#^block-id]]");
            // should not have inserted any more anchors into the note
            common_test_utils_1.AssertUtils.assertTimesInString({
                body,
                match: [[1, "^"]],
            });
        });
        test("WHEN the editor is selecting a footnote, THEN CopyNoteLink should not confuse it for a block anchor", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "testFootnote",
                vault: vaults[0],
                wsRoot,
                body: "Sapiente accusantium omnis quia. [^est]\n\n[^est]: Quia iure tempore eum.",
                engine,
            });
            const editor = await openNote(note);
            editor.selection = new vscode.Selection(testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition(), testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ char: 10 }));
            const link = (await copyNoteLinkCommand.execute({}))?.link;
            const body = editor.document.getText();
            // check that the link looks like what we expect
            (0, testUtilsv2_1.expect)(link).toNotEqual("[[testFootnote|testFootnote#^est]]");
            const anchor = getAnchorFromLink(link);
            // check that the anchor has been inserted into the note
            await common_test_utils_1.AssertUtils.assertTimesInString({
                body,
                match: [[1, anchor]],
            });
        });
        test("WHEN the note has a block anchor target, THEN CopyNoteLink should generate block anchor", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
                wsRoot,
                vault: vaults[0],
                engine,
                fname: "generateBlockAnchorSingle",
            });
            const editor = await openNote(note);
            editor.selection = new vscode.Selection(testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }), testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 12, char: 12 }));
            const link = (await copyNoteLinkCommand.execute({}))?.link;
            const body = editor.document.getText();
            // check that the link looks like what we expect
            const anchor = getAnchorFromLink(link);
            // check that the anchor has been inserted into the note
            await common_test_utils_1.AssertUtils.assertTimesInString({
                body,
                match: [[1, anchor]],
            });
        });
        test("WHEN the editor is selecting a header of a tag note, THEN CopyNoteLink should return a link with that header", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "tags.foo.bar",
                vault: vaults[0],
                wsRoot,
                body: "## [[Foo Bar|foo.bar]]",
                engine,
            });
            const editor = await openNote(noteWithLink);
            const start = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
            const end = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
            editor.selection = new vscode.Selection(start, end);
            // generate a wikilink for it
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual(`#foo.bar`);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN the alias mode is none, THEN CopyNoteLink should only return a link without a note alias", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setAliasMode(config, "none");
            return config;
        },
    }, () => {
        test("THEN CopyNoteLink should only return a link without a note alias", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "foo.md");
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual("[[foo]]");
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic setup on a multivault workspace with enableXVaultWikiLink enabled", {
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "enableXVaultWikiLink", true);
            return config;
        },
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("WHEN the editor is on a saved file, THEN CopyNoteLink should return link with title and fname of engine note", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "foo.md");
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual("[[Foo|dendron://vault1/foo]]");
        });
        test("WHEN the editor is on a dirty file, THEN CopyNoteLink should return undefined and cause an onDidSaveTextDocument to be fired", (done) => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNote = common_all_1.NoteUtils.create({
                fname: "foo",
                vault: vaults[0],
            });
            // onEngineNoteStateChanged is not being triggered by save so test to make sure that save is being triggered instead
            const disposable = vscode.workspace.onDidSaveTextDocument((textDocument) => {
                (0, common_test_utils_1.testAssertsInsideCallback)(() => {
                    (0, testUtilsv2_1.expect)(textDocument.getText().includes("id: barbar")).toBeTruthy();
                    disposable.dispose();
                }, done);
            });
            ExtensionProvider_1.ExtensionProvider.getWSUtils()
                .openNote(testNote)
                .then(async (editor) => {
                editor
                    .edit(async (editBuilder) => {
                    // Replace id of frontmatter
                    const startPos = new vscode.Position(1, 4);
                    const endPos = new vscode.Position(1, 7);
                    editBuilder.replace(new vscode.Range(startPos, endPos), "barbar");
                })
                    .then(async () => {
                    copyNoteLinkCommand.run();
                });
            });
        });
        test("WHEN the editor is selecting an anchor, THEN CopyNoteLink should return a link with that anchor", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const noteWithTarget = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.createWithEngine({
                wsRoot,
                vault: vaults[0],
                engine,
            });
            const noteWithAnchor = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.createWithEngine({
                wsRoot,
                vault: vaults[1],
                engine,
            });
            let editor = await openNote(noteWithTarget);
            const pos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
            const pos2 = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({
                char: 12,
            });
            editor.selection = new vscode.Selection(pos, pos2);
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual(`[[H1|dendron://vault1/${noteWithTarget.fname}#h1]]`);
            editor = await openNote(noteWithTarget);
            editor.selection = new vscode.Selection(testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 8 }), testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 8, char: 12 }));
            const link2 = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link2).toEqual(`[[H2|dendron://vault1/${noteWithTarget.fname}#h2]]`);
            await openNote(noteWithAnchor);
            const link3 = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link3).toEqual(`[[Beta|dendron://vault2/${noteWithAnchor.fname}]]`);
        });
        test("WHEN the editor is selecting a block anchor, THEN CopyNoteLink should return a link with that block anchor", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
                wsRoot,
                vault: vaults[0],
                engine,
            });
            const editor = await openNote(note);
            editor.selection = new vscode.Selection(testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }), testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 10 }));
            const link = (await copyNoteLinkCommand.execute({}))?.link;
            const body = editor.document.getText();
            // check that the link looks like what we expect
            (0, testUtilsv2_1.expect)(link).toEqual("[[Anchor Target|dendron://vault1/anchor-target#^block-id]]");
            // should not have inserted any more anchors into the note
            common_test_utils_1.AssertUtils.assertTimesInString({
                body,
                match: [[1, "^"]],
            });
        });
        test("WHEN the note has a block anchor target, THEN CopyNoteLink should generate block anchor", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.createWithEngine({
                wsRoot,
                vault: vaults[0],
                engine,
                fname: "generateBlockAnchorMulti",
            });
            const editor = await openNote(note);
            editor.selection = new vscode.Selection(testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 10 }), testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ line: 10, char: 12 }));
            const link = (await copyNoteLinkCommand.execute({}))?.link;
            const body = editor.document.getText();
            // check that the link looks like what we expect
            const anchor = getAnchorFromLink(link);
            (0, testUtilsv2_1.expect)(link.startsWith(`[[${note.fname}|dendron://vault1/${note.fname}#^`)).toBeTruthy();
            // check that the anchor has been inserted into the note
            common_test_utils_1.AssertUtils.assertTimesInString({
                body,
                match: [[1, anchor]],
            });
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN in a non-note file", {}, () => {
        test("THEN creates a link to that file", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const fsPath = path_1.default.join(wsRoot, "test.js");
            await fs_extra_1.default.writeFile(fsPath, "const x = 'Pariatur officiis voluptatem molestiae.'");
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
            const link = (await copyNoteLinkCommand.run())?.link;
            (0, testUtilsv2_1.expect)(link).toEqual("[[test.js]]");
        });
        (0, mocha_1.describe)("AND the file name starts with a dot", async () => {
            test("THEN creates a link to that file", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const fsPath = path_1.default.join(wsRoot, ".config.yaml");
                await fs_extra_1.default.writeFile(fsPath, "x: 1");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(link).toEqual("[[.config.yaml]]");
            });
        });
        (0, mocha_1.describe)("AND the file is in assets", () => {
            test("THEN creates a link using assets", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const dirPath = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "assets");
                await fs_extra_1.default.ensureDir(dirPath);
                const fsPath = path_1.default.join(dirPath, "test.py");
                await fs_extra_1.default.writeFile(fsPath, "x = 'Pariatur officiis voluptatem molestiae.'");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(link).toEqual(path_1.default.join("[[assets", "test.py]]"));
            });
        });
        (0, mocha_1.describe)("AND the file is in a vault, but not in assets", () => {
            test("THEN creates a link from root", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
                const fsPath = path_1.default.join(path_1.default.join(wsRoot, vaultPath), "test.rs");
                await fs_extra_1.default.writeFile(fsPath, "let x = 123;");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(link).toEqual(path_1.default.join(`[[${vaultPath}`, "test.rs]]"));
            });
        });
        (0, mocha_1.describe)("AND the file is in a nested folder", () => {
            test("THEN creates a link to that file", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const dirPath = path_1.default.join(wsRoot, "src", "clj");
                await fs_extra_1.default.ensureDir(dirPath);
                const fsPath = path_1.default.join(dirPath, "test.clj");
                await fs_extra_1.default.writeFile(fsPath, "(set! x 1)");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(link).toEqual(path_1.default.join("[[src", "clj", "test.clj]]"));
            });
        });
    });
    (0, mocha_1.describe)("WHEN using selections in non-note files", () => {
        (0, testUtilsV3_1.describeSingleWS)("AND there's an existing block anchor", {
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setNonNoteLinkAnchorType(config, "block");
                return config;
            },
        }, () => {
            test("THEN creates a link to that file with a block anchor", async () => {
                await prepFileAndSelection(" ^my-block-anchor");
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(await linkHasAnchor("block", ["src", "test.hs"], link, "^my-block-anchor")).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND config is set to line anchor", {
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setNonNoteLinkAnchorType(config, "line");
                return config;
            },
        }, () => {
            test("THEN creates a link to that file with a line anchor", async () => {
                await prepFileAndSelection();
                const link = (await copyNoteLinkCommand.run())?.link;
                // Link should contain an anchor
                (0, testUtilsv2_1.expect)(await linkHasAnchor("line", ["src", "test.hs"], link)).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND config is set to block anchor", {
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setNonNoteLinkAnchorType(config, "block");
                return config;
            },
        }, () => {
            test("THEN creates a link to that file with a block anchor", async () => {
                await prepFileAndSelection();
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(await linkHasAnchor("block", ["src", "test.hs"], link)).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND config is set unset", {}, () => {
            test("THEN creates a link to that file with a block anchor", async () => {
                await prepFileAndSelection();
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(await linkHasAnchor("block", ["src", "test.hs"], link)).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("GIVEN a workspace where config is set to prompt", {
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
                return config;
            },
        }, () => {
            test("WHEN user picks line in the prompt, THEN CopyNoteLinkCommand generates a link anchor ", async () => {
                await prepFileAndSelection();
                const pick = sinon_1.default
                    .stub(vscode.window, "showQuickPick")
                    .resolves({ label: "line" });
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(pick.calledOnce).toBeTruthy();
                (0, testUtilsv2_1.expect)(await linkHasAnchor("line", ["src", "test.hs"], link)).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("GIVEN a workspace where config is set to prompt", {
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
                return config;
            },
        }, () => {
            test("WHEN user picks block in the prompt, THEN CopyNoteLinkCommand generates a block anchor ", async () => {
                await prepFileAndSelection();
                const pick = sinon_1.default
                    .stub(vscode.window, "showQuickPick")
                    .resolves({ label: "block" });
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(pick.calledOnce).toBeTruthy();
                (0, testUtilsv2_1.expect)(await linkHasAnchor("block", ["src", "test.hs"], link)).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("GIVEN a workspace where config is set to prompt", {
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setNonNoteLinkAnchorType(config, "prompt");
                return config;
            },
        }, () => {
            test("WHEN user cancels the prompt, THEN CopyNoteLinkCommand generates a line anchor ", async () => {
                await prepFileAndSelection();
                const pick = sinon_1.default
                    .stub(vscode.window, "showQuickPick")
                    .resolves(undefined);
                const link = (await copyNoteLinkCommand.run())?.link;
                (0, testUtilsv2_1.expect)(pick.calledOnce).toBeTruthy();
                (0, testUtilsv2_1.expect)(await linkHasAnchor("line", ["src", "test.hs"], link)).toBeTruthy();
            });
        });
    });
});
function getAnchorFromLink(link) {
    const anchors = link.match(/\^[a-z0-9A-Z-_]+/g);
    (0, testUtilsv2_1.expect)(anchors).toBeTruthy();
    (0, testUtilsv2_1.expect)(anchors.length).toEqual(1);
    (0, testUtilsv2_1.expect)(anchors[0].length > 0).toBeTruthy();
    return anchors[0];
}
async function prepFileAndSelection(appendText) {
    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const dirPath = path_1.default.join(wsRoot, "src");
    await fs_extra_1.default.ensureDir(dirPath);
    const fsPath = path_1.default.join(dirPath, "test.hs");
    await fs_extra_1.default.writeFile(fsPath, "fibs = 0 : 1 : zipWith (+) fibs (tail fibs)".concat(appendText || ""));
    await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(fsPath));
    // Select a range
    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection = new vscode.Selection(0, 0, 0, 10);
}
async function linkHasAnchor(type, expectedPath, link, expectedAnchor) {
    const { expected, unexpected } = type === "block"
        ? { expected: "^", unexpected: "L" }
        : { expected: "L", unexpected: "^" };
    (0, testUtilsv2_1.expect)(link).toBeTruthy();
    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
        body: link,
        match: [...expectedPath, `#${expected}`, "]]"],
        nomatch: [`#${unexpected}`],
    })).toBeTruthy();
    // Get the anchor from `^` or `L` to `]]`
    const anchor = link.slice(link.indexOf(expected), -2);
    (0, testUtilsv2_1.expect)(anchor.length > 0).toBeTruthy();
    if (expectedAnchor)
        (0, testUtilsv2_1.expect)(anchor).toEqual(expectedAnchor);
    // The file should contain the matching anchor, if it's a block anchor
    if (type === "block")
        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
            body: vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
            match: [anchor],
        })).toBeTruthy();
    return true;
}
//# sourceMappingURL=CopyNoteLink.test.js.map