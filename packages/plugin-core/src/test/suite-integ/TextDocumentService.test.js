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
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const TextDocumentService_1 = require("../../services/node/TextDocumentService");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
async function openAndEdit(fname) {
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const testNoteProps = (await engine.getNote(fname)).data;
    const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(testNoteProps);
    const textToAppend = "new text here";
    editor.edit((editBuilder) => {
        const line = editor.document.getText().split("\n").length;
        editBuilder.insert(new vscode.Position(line, 0), textToAppend);
    });
    await editor.document.save();
    return { editor, engine, note: testNoteProps, textToAppend };
}
function setupTextDocumentService() {
    const textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
    const { onDidSave } = textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
    return { textDocumentService, onDidSave };
}
suite("TextDocumentService", function testSuite() {
    let textDocumentService;
    let onDidChangeTextDocumentHandler;
    this.timeout(5000);
    (0, mocha_1.afterEach)(() => {
        if (textDocumentService) {
            textDocumentService.dispose();
        }
        if (onDidChangeTextDocumentHandler) {
            onDidChangeTextDocumentHandler.dispose();
        }
    });
    (0, mocha_1.describe)("Given a TextDocumentChangeEvent", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN the contents have changed", {
            postSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault,
                    fname: "alpha",
                    body: "First Line\n",
                });
            },
        }, () => {
            test("THEN processTextDocumentChangeEvent should return note with updated text", (done) => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const textToAppend = "new text here";
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = common_all_1.NoteUtils.create({
                    fname: "alpha",
                    vault: vaults[0],
                });
                onDidChangeTextDocumentHandler =
                    vscode.workspace.onDidChangeTextDocument(async (event) => {
                        if (event.document.isDirty) {
                            const maybeNote = await textDocumentService?.processTextDocumentChangeEvent(event);
                            (0, testUtilsv2_1.expect)(maybeNote?.body).toEqual("First Line\n" + textToAppend);
                            // Make sure updated has not changed
                            const alphaNote = (await engine.getNoteMeta("alpha")).data;
                            (0, testUtilsv2_1.expect)(maybeNote?.updated).toEqual(alphaNote.updated);
                            done();
                        }
                    });
                ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openNote(note)
                    .then((editor) => {
                    editor.edit((editBuilder) => {
                        const line = editor.document.getText().split("\n").length;
                        editBuilder.insert(new vscode.Position(line, 0), textToAppend);
                    });
                });
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the contents have changed tags", {
            postSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "foo",
                    wsRoot,
                    vault,
                    body: "foo body",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "tags.test",
                    wsRoot,
                    vault,
                });
            },
        }, () => {
            test("THEN processTextDocumentChangeEvent should return note with updated links", (done) => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const foo = common_all_1.NoteUtils.create({
                    fname: "foo",
                    vault: vaults[0],
                });
                onDidChangeTextDocumentHandler =
                    vscode.workspace.onDidChangeTextDocument(async (event) => {
                        if (event.document.isDirty) {
                            const maybeNote = await textDocumentService?.processTextDocumentChangeEvent(event);
                            (0, testUtilsv2_1.expect)(maybeNote?.links.length).toEqual(1);
                            (0, testUtilsv2_1.expect)(maybeNote?.links[0].type).toEqual("frontmatterTag");
                            (0, testUtilsv2_1.expect)(maybeNote?.links[0].to?.fname).toEqual("tags.test");
                            done();
                        }
                    });
                ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openNote(foo)
                    .then((editor) => {
                    editor.edit((editBuilder) => {
                        const pos = new vscode.Position(6, 0);
                        editBuilder.insert(pos, `tags: test\n`);
                    });
                });
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the editor has not changed contents", {
            postSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault,
                    fname: "beta",
                    body: "First Line\n",
                });
            },
        }, () => {
            test("THEN processTextDocumentChangeEvent should not be called", (done) => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const currentNote = common_all_1.NoteUtils.create({
                    fname: "beta",
                    vault: vaults[0],
                });
                onDidChangeTextDocumentHandler =
                    vscode.workspace.onDidChangeTextDocument(() => {
                        (0, common_all_1.assert)(false, "Callback not expected");
                    });
                ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openNote(currentNote)
                    .then((editor) => {
                    editor.edit((editBuilder) => {
                        const line = editor.document.getText().split("\n").length;
                        editBuilder.insert(new vscode.Position(line, 0), "");
                    });
                });
                // Small sleep to ensure callback doesn't fire.
                (0, testUtilsV3_1.waitInMilliseconds)(10).then(() => done());
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the contents of the event are the same as what's in the engine", {
            postSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault,
                    fname: "beta",
                    body: "First Line\n",
                });
            },
        }, () => {
            test("THEN processTextDocumentChangeEvent should return original note", (done) => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = common_all_1.NoteUtils.create({
                    fname: "beta",
                    vault: vaults[0],
                });
                onDidChangeTextDocumentHandler =
                    vscode.workspace.onDidChangeTextDocument(async (event) => {
                        if (event.document.isDirty) {
                            // Set content hash to be same as event to enter content no change logic
                            const currentNote = (await engine.getNote("beta")).data;
                            currentNote.contentHash = (0, common_all_1.genHash)(event.document.getText());
                            await engine.writeNote(currentNote, { metaOnly: true });
                            const maybeNote = await textDocumentService?.processTextDocumentChangeEvent(event);
                            (0, testUtilsv2_1.expect)(maybeNote).toEqual(currentNote);
                            done();
                        }
                    });
                ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openNote(note)
                    .then((editor) => {
                    editor.edit((editBuilder) => {
                        const line = editor.document.getText().split("\n").length;
                        editBuilder.insert(new vscode.Position(line, 0), "1");
                    });
                });
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the contents don't match any notes", {}, () => {
            test("THEN processTextDocumentChangeEvent should return undefined", (done) => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const textToAppend = "new text here";
                const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "blahblah123",
                    body: `[[beta]]`,
                    vault: vaults[0],
                    wsRoot,
                }).then((testNoteProps) => {
                    ExtensionProvider_1.ExtensionProvider.getWSUtils()
                        .openNote(testNoteProps)
                        .then((editor) => {
                        editor.edit((editBuilder) => {
                            const line = editor.document.getText().split("\n").length;
                            editBuilder.insert(new vscode.Position(line, 0), textToAppend);
                        });
                    });
                });
                onDidChangeTextDocumentHandler =
                    vscode.workspace.onDidChangeTextDocument(async (event) => {
                        if (event.document.isDirty) {
                            const noteProp = (await engine.getNote("blahblah123")).data;
                            (0, testUtilsv2_1.expect)(noteProp).toBeFalsy();
                            const maybeNote = await textDocumentService?.processTextDocumentChangeEvent(event);
                            (0, testUtilsv2_1.expect)(maybeNote).toBeFalsy();
                            done();
                        }
                    });
            });
        });
    });
    (0, mocha_1.describe)("GIVEN a vscode.workspace.onDidSaveTextDocument event is fired", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN the contents of the note has changed", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN engine note contents should be updated", async () => {
                const fname = "foo";
                const { onDidSave } = setupTextDocumentService();
                const { engine, editor, note, textToAppend } = await openAndEdit(fname);
                const updatedNote = await onDidSave(editor.document);
                (0, testUtilsv2_1.expect)(updatedNote?.body).toEqual(note.body + textToAppend);
                const noteProp = (await engine.getNote(fname)).data;
                (0, testUtilsv2_1.expect)(noteProp.body).toEqual(note.body + textToAppend);
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the contents of the note has changed", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN update engine events should be fired", (done) => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const testNoteProps = common_all_1.NoteUtils.create({
                    fname: "foo",
                    vault: vaults[0],
                });
                const textToAppend = "new text here";
                const disposable = (0, testUtilsV3_1.subscribeToEngineStateChange)((noteChangeEntries) => {
                    const createEntries = (0, common_all_1.extractNoteChangeEntriesByType)(noteChangeEntries, "create");
                    const deleteEntries = (0, common_all_1.extractNoteChangeEntriesByType)(noteChangeEntries, "delete");
                    const updateEntries = (0, common_all_1.extractNoteChangeEntriesByType)(noteChangeEntries, "update");
                    (0, common_test_utils_1.testAssertsInsideCallback)(async () => {
                        (0, testUtilsv2_1.expect)(createEntries.length).toEqual(0);
                        (0, testUtilsv2_1.expect)(updateEntries.length).toEqual(1);
                        (0, testUtilsv2_1.expect)(deleteEntries.length).toEqual(0);
                        const updateEntry = updateEntries[0];
                        (0, testUtilsv2_1.expect)(updateEntry.note.fname).toEqual("foo");
                        const testNoteProps = (await engine.getNote("foo")).data;
                        (0, testUtilsv2_1.expect)(updateEntry.note.body).toEqual(testNoteProps.body);
                        (0, testUtilsv2_1.expect)(updateEntry.note.body.includes(textToAppend)).toBeTruthy();
                        disposable.dispose();
                    }, done);
                });
                ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openNote(testNoteProps)
                    .then((editor) => {
                    editor.edit((editBuilder) => {
                        const line = editor.document.getText().split("\n").length;
                        editBuilder.insert(new vscode.Position(line, 0), textToAppend);
                    });
                    editor.document.save();
                });
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the original note contains wikilink and backlink", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupLinks,
        }, () => {
            test("THEN the wikilink and backlink should remain unchanged", async () => {
                const fname = "alpha";
                const { onDidSave } = setupTextDocumentService();
                const { engine, editor, note } = await openAndEdit(fname);
                const updatedNote = await onDidSave(editor.document);
                (0, testUtilsv2_1.expect)(updatedNote?.links).toEqual(note.links);
                const testNote = (await engine.getNoteMeta(fname)).data;
                (0, testUtilsv2_1.expect)(testNote.links).toEqual(note.links);
                (0, testUtilsv2_1.expect)(updatedNote?.links.length).toEqual(2);
                (0, testUtilsv2_1.expect)(updatedNote?.links[0].value).toEqual("beta");
                (0, testUtilsv2_1.expect)(updatedNote?.links[0].type).toEqual("wiki");
                (0, testUtilsv2_1.expect)(updatedNote?.links[0].alias).toEqual(undefined);
                (0, testUtilsv2_1.expect)(updatedNote?.links[0].position).toEqual({
                    end: {
                        column: 9,
                        line: 1,
                        offset: 8,
                    },
                    indent: [],
                    start: {
                        column: 1,
                        line: 1,
                        offset: 0,
                    },
                });
                (0, testUtilsv2_1.expect)(updatedNote?.links[1].value).toEqual("alpha");
                (0, testUtilsv2_1.expect)(updatedNote?.links[1].type).toEqual("backlink");
                (0, testUtilsv2_1.expect)(updatedNote?.links[1].alias).toEqual(undefined);
                (0, testUtilsv2_1.expect)(updatedNote?.links[1].position).toEqual({
                    end: {
                        column: 13,
                        line: 1,
                        offset: 12,
                    },
                    indent: [],
                    start: {
                        column: 1,
                        line: 1,
                        offset: 0,
                    },
                });
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the original note contains only backlink", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupRefs,
        }, () => {
            test("THEN the backlink should remain unchanged", async () => {
                const fname = "simple-note-ref.one";
                const { onDidSave } = setupTextDocumentService();
                const { engine, editor, note } = await openAndEdit(fname);
                const updatedNote = await onDidSave(editor.document);
                (0, testUtilsv2_1.expect)(updatedNote?.links).toEqual(note.links);
                const testNote = (await engine.getNoteMeta(fname)).data;
                (0, testUtilsv2_1.expect)(testNote.links).toEqual(note.links);
                (0, testUtilsv2_1.expect)(updatedNote?.links[0].value).toEqual("simple-note-ref.one");
                (0, testUtilsv2_1.expect)(updatedNote?.links[0].position).toEqual({
                    end: {
                        column: 25,
                        line: 1,
                        offset: 24,
                    },
                    indent: [],
                    start: {
                        column: 1,
                        line: 1,
                        offset: 0,
                    },
                });
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the original note contains frontmatter tag", {
            postSetupHook: async (opts) => {
                const vault = opts.vaults[0];
                await engine_test_utils_1.ENGINE_HOOKS.setupRefs(opts);
                await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_FM_TAG.create({ ...opts, vault });
            },
        }, () => {
            test("THEN the fm-tag should remain unchanged", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const fname = "fm-tag";
                const { onDidSave } = setupTextDocumentService();
                const { engine, editor, note } = await openAndEdit(fname);
                const updatedNote = await onDidSave(editor.document);
                (0, testUtilsv2_1.expect)(updatedNote?.links).toEqual(note.links);
                const testNote = (await engine.getNoteMeta(fname)).data;
                (0, testUtilsv2_1.expect)(testNote.links).toEqual(note.links);
                (0, testUtilsv2_1.expect)(updatedNote?.links).toEqual([
                    {
                        alias: "foo",
                        from: {
                            fname: "fm-tag",
                            id: "fm-tag",
                            vaultName: common_all_1.VaultUtils.getName(vaults[0]),
                        },
                        to: {
                            fname: "tags.foo",
                        },
                        type: "frontmatterTag",
                        value: "tags.foo",
                        xvault: false,
                    },
                ]);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN the contents of the note has not changed", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN onDidSave should return original note and engine note contents should be untouched", async () => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const testNoteProps = (await engine.getNote("foo")).data;
                const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(testNoteProps);
                const { onDidSave } = textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
                const updatedNote = await onDidSave(editor.document);
                (0, testUtilsv2_1.expect)(updatedNote).toBeTruthy();
                (0, testUtilsv2_1.expect)(updatedNote).toEqual(testNoteProps);
                const foo = (await engine.getNote("foo")).data;
                (0, testUtilsv2_1.expect)(foo.body).toEqual(testNoteProps.body);
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the contents don't match any note", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN onDidSave should return undefined and engine note contents should be untouched", async () => {
                textDocumentService = new TextDocumentService_1.TextDocumentService(ExtensionProvider_1.ExtensionProvider.getExtension(), vscode.workspace.onDidSaveTextDocument);
                const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const testNoteProps = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "blahblah123",
                    body: `[[beta]]`,
                    vault: vaults[0],
                    wsRoot,
                });
                const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(testNoteProps);
                const noteProp = (await engine.getNote("blahblah123")).data;
                (0, testUtilsv2_1.expect)(noteProp).toBeFalsy();
                const { onDidSave } = textDocumentService.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
                const updatedNote = await onDidSave(editor.document);
                (0, testUtilsv2_1.expect)(updatedNote).toBeFalsy();
            });
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("Given a note with frontmatter", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            const vault = vaults[0];
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                vault,
                fname: "alpha",
                body: "First Line\n",
            });
        },
    }, () => {
        test("WHEN the note has frontmatter, THEN getFrontmatterPosition should return true", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const alphaNote = (await engine.getNoteMeta("alpha")).data;
            const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alphaNote);
            const hasFrontmatter = TextDocumentService_1.TextDocumentService.containsFrontmatter(editor.document);
            (0, testUtilsv2_1.expect)(hasFrontmatter).toBeTruthy();
        });
        test("WHEN frontmatter is removed, THEN getFrontmatterPosition should return false", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const alphaNote = (await engine.getNoteMeta("alpha")).data;
            const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alphaNote);
            editor.edit((editBuilder) => {
                editBuilder.delete(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 0)));
            });
            await editor.document.save();
            const hasFrontmatter = TextDocumentService_1.TextDocumentService.containsFrontmatter(editor.document);
            (0, testUtilsv2_1.expect)(hasFrontmatter).toBeFalsy();
        });
    });
});
//# sourceMappingURL=TextDocumentService.test.js.map