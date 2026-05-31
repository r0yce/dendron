"use strict";
// @ts-nocheck
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
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const WorkspaceWatcher_1 = require("../../WorkspaceWatcher");
const windowWatcher_1 = require("../../windowWatcher");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const vscode_1 = require("vscode");
const WSUtils_1 = require("../../WSUtils");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const MockPreviewProxy_1 = require("../MockPreviewProxy");
const setupBasic = async (opts) => {
    const { wsRoot, vaults } = opts;
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        vault: vaults[0],
        fname: "oldfile",
        body: "oldfile",
    });
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        wsRoot,
        vault: vaults[0],
        fname: "foo.one",
        body: `[[oldfile]]`,
    });
};
// eslint-disable-next-line camelcase
const UNSAFE_getWorkspaceWatcherPropsForTesting = (watcher) => {
    return watcher.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
};
async function doesSchemaExist(schemaId) {
    const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const schema = await engine.getSchema(schemaId);
    return schema.data !== undefined;
}
(0, testUtilsV3_1.runSuiteButSkipForWindows)()("WorkspaceWatcher schema update tests", function () {
    /**
     * Skip this test - the previous validation would always return true, and
     * the test condition was not actually passing. Eventually,
     * ISchemaSyncService will get removed in favor of engine events for
     * schemas.
     */
    testUtilsV3_1.describeMultiWS.skip("WHEN setup with schema", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupInlineSchema,
    }, () => {
        test("AND new schema is schema file saved THEN schema is updated in engine.", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNote = (await engine.getNoteMeta("foo")).data;
            (0, testUtilsv2_1.expect)(testNote).toBeTruthy();
            const opened = await WSUtils_1.WSUtils.openSchema((await engine.getSchema("plain_schema")).data);
            (0, testUtilsv2_1.expect)(await doesSchemaExist("new_schema")).toBeFalsy();
            await opened.edit((editBuilder) => {
                const line = opened.document.getText().split("\n").length;
                const newElement = [`  - id: new_schema`, `    parent: root`].join("\n");
                editBuilder.insert(new vscode_1.Position(line, 0), newElement);
            });
            // The save should trigger workspace watcher but for some reason within tests
            // its not triggering onDidSaveTextDocument event (although it works within manual testing).
            // So for now we will call the instance of SchemaSyncService to make
            // sure at least that is working as expected.
            (0, testUtilsv2_1.expect)(await opened.document.save()).toBeTruthy();
            await ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService.onDidSave({
                document: opened.document,
            });
            (0, testUtilsv2_1.expect)(await doesSchemaExist("new_schema")).toBeTruthy();
        });
    });
});
suite("WorkspaceWatcher", function () {
    let watcher;
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a basic setup on a single vault workspace", {
        postSetupHook: setupBasic,
        timeout: 1e6,
    }, () => {
        test("WHEN user renames a file outside of dendron rename command, THEN all of its references are also updated", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const windowWatcher = new windowWatcher_1.WindowWatcher({
                extension,
                previewProxy,
            });
            watcher = new WorkspaceWatcher_1.WorkspaceWatcher({
                schemaSyncService: ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService,
                extension,
                windowWatcher,
            });
            const oldPath = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "oldfile.md");
            const oldUri = vscode.Uri.file(oldPath);
            const newPath = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "newfile.md");
            const newUri = vscode.Uri.file(newPath);
            const args = {
                files: [
                    {
                        oldUri,
                        newUri,
                    },
                ],
                // eslint-disable-next-line no-undef
                waitUntil: (_args) => {
                    _args.then(async () => {
                        const reference = (await engine.findNotes({
                            fname: "foo.one",
                            vault: vaults[0],
                        }))[0];
                        (0, testUtilsv2_1.expect)(reference.body).toEqual(`[[newfile]]`);
                    });
                },
            };
            watcher.onWillRenameFiles(args);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a basic setup on a single vault workspace", {
        postSetupHook: setupBasic,
    }, () => {
        test("WHEN user renames a file outside of dendron rename command, THEN the title of fileName is also updated", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const windowWatcher = new windowWatcher_1.WindowWatcher({
                extension,
                previewProxy,
            });
            watcher = new WorkspaceWatcher_1.WorkspaceWatcher({
                schemaSyncService: ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService,
                extension,
                windowWatcher,
            });
            const oldPath = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "oldfile.md");
            const oldUri = vscode.Uri.file(oldPath);
            const newPath = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "newfile.md");
            const newUri = vscode.Uri.file(newPath);
            const args = {
                files: [
                    {
                        oldUri,
                        newUri,
                    },
                ],
                // eslint-disable-next-line no-undef
                waitUntil: (_args) => {
                    _args.then(async () => {
                        const newFile = (await engine.findNotes({
                            fname: "newfile",
                            vault: vaults[0],
                        }))[0];
                        (0, testUtilsv2_1.expect)(newFile.title).toEqual(`Newfile`);
                    });
                },
            };
            watcher.onWillRenameFiles(args);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a basic setup on a single vault workspace", {
        postSetupHook: setupBasic,
        timeout: 5e3,
    }, () => {
        test("WHEN user saves a file and content has not changed, THEN updated timestamp in frontmatter is not updated", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const windowWatcher = new windowWatcher_1.WindowWatcher({
                extension,
                previewProxy,
            });
            watcher = new WorkspaceWatcher_1.WorkspaceWatcher({
                schemaSyncService: ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService,
                extension,
                windowWatcher,
            });
            const fooNote = (await engine.getNoteMeta("foo.one")).data;
            const updatedBefore = fooNote.updated;
            const editor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(fooNote);
            const vscodeEvent = {
                document: editor.document,
                // eslint-disable-next-line no-undef
                waitUntil: (_args) => {
                    _args.then(async () => {
                        // Engine note body hasn't been updated yet
                        const foo = (await engine.getNote("foo.one")).data;
                        (0, testUtilsv2_1.expect)(foo.updated).toEqual(updatedBefore);
                    });
                },
            };
            const changes = await watcher.onWillSaveTextDocument(vscodeEvent);
            (0, testUtilsv2_1.expect)(changes).toBeTruthy();
            (0, testUtilsv2_1.expect)(changes?.changes.length).toEqual(0);
            (0, testUtilsv2_1.expect)(fooNote.updated).toEqual(updatedBefore);
        });
        test("WHEN user saves a file and content has changed, THEN updated timestamp in frontmatter is updated", (done) => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const windowWatcher = new windowWatcher_1.WindowWatcher({
                extension,
                previewProxy,
            });
            watcher = new WorkspaceWatcher_1.WorkspaceWatcher({
                schemaSyncService: ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService,
                extension,
                windowWatcher,
            });
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const fooNote = common_all_1.NoteUtils.create({
                fname: "foo.one",
                vault: vaults[0],
            });
            const bodyBefore = "[[oldfile]]";
            const updatedBefore = 1;
            const textToAppend = "new text here";
            ExtensionProvider_1.ExtensionProvider.getWSUtils()
                .openNote(fooNote)
                .then(async (editor) => {
                await editor.edit((editBuilder) => {
                    const line = editor.document.getText().split("\n").length;
                    editBuilder.insert(new vscode.Position(line, 0), textToAppend);
                });
                await editor.document.save().then(() => {
                    const vscodeEvent = {
                        document: editor.document,
                        // eslint-disable-next-line no-undef
                        waitUntil: (_args) => {
                            _args.then(async () => {
                                // Engine note hasn't been updated yet
                                const foo = (await engine.getNote("foo.one")).data;
                                (0, testUtilsv2_1.expect)(foo.body).toEqual(bodyBefore);
                                (0, testUtilsv2_1.expect)(foo.updated).toEqual(updatedBefore);
                                done();
                            });
                        },
                    };
                    watcher.onWillSaveTextDocument(vscodeEvent);
                });
            });
        });
    });
    (0, mocha_1.describe)("GIVEN the user opening a file", () => {
        let ext;
        let workspaceWatcher;
        (0, mocha_1.beforeEach)(async () => {
            ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
            const windowWatcher = new windowWatcher_1.WindowWatcher({
                extension: ext,
                previewProxy,
            });
            workspaceWatcher = new WorkspaceWatcher_1.WorkspaceWatcher({
                schemaSyncService: ext.schemaSyncService,
                extension: ext,
                windowWatcher,
            });
        });
        (0, mocha_1.afterEach)(async () => {
            // imporant since we activate workspace watchers
            await ext.deactivate();
        });
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN user opens non dendron file for the first time", {}, () => {
            test("THEN do not affect frontmatter", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await common_test_utils_1.FileTestUtils.createFiles(wsRoot, [{ path: "sample" }]);
                const notePath = path_1.default.join(wsRoot, "sample");
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const { onFirstOpen } = UNSAFE_getWorkspaceWatcherPropsForTesting(workspaceWatcher);
                (0, testUtilsv2_1.expect)(await onFirstOpen(editor)).toBeFalsy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN user opens non dendron markdown file for the first time", {}, () => {
            test("THEN do not affect frontmatter", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await common_test_utils_1.FileTestUtils.createFiles(wsRoot, [{ path: "sample.md" }]);
                const notePath = path_1.default.join(wsRoot, "sample.md");
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const { onFirstOpen } = UNSAFE_getWorkspaceWatcherPropsForTesting(workspaceWatcher);
                (0, testUtilsv2_1.expect)(await onFirstOpen(editor)).toBeFalsy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN user opens dendron note for the first time", {}, () => {
            let note;
            (0, mocha_1.before)(async () => {
                const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    engine,
                    fname: "test",
                    vault: vaults[0],
                    wsRoot,
                });
            });
            test("THEN the cursor moves past the frontmatter", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const wsutils = new WSUtilsV2_1.WSUtilsV2(ext);
                const editor = await wsutils.openNote(note);
                const { onFirstOpen } = UNSAFE_getWorkspaceWatcherPropsForTesting(workspaceWatcher);
                const stubTimeout = sinon_1.default.stub(common_all_1.Wrap, "setTimeout");
                (0, testUtilsv2_1.expect)(await onFirstOpen(editor)).toBeTruthy();
                stubTimeout.callArg(0);
                // the selection should have been moved past the frontmatter
                const { line, character } = editor.selection.active;
                (0, testUtilsv2_1.expect)(line).toEqual(7);
                (0, testUtilsv2_1.expect)(character).toEqual(3);
                stubTimeout.restore();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN the user opens the file through the search", {}, () => {
            let note;
            (0, mocha_1.before)(async () => {
                const { engine, vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    engine,
                    fname: "test",
                    vault: vaults[0],
                    wsRoot,
                });
            });
            test("THEN the cursor moves past the frontmatter", async () => {
                const stubTimeout = sinon_1.default.stub(common_all_1.Wrap, "setTimeout");
                const editor = await WSUtils_1.WSUtils.openNote(note);
                // pre-move the selection, like what would happen when opening through the serach
                editor.selection = new vscode.Selection(5, 0, 5, 0);
                WorkspaceWatcher_1.WorkspaceWatcher.moveCursorPastFrontmatter(editor);
                stubTimeout.callArg(0);
                // the selection didn't move from what it was before
                const { line, character } = editor.selection.active;
                (0, testUtilsv2_1.expect)(line).toEqual(5);
                (0, testUtilsv2_1.expect)(character).toEqual(0);
                stubTimeout.restore();
            });
        });
    });
});
//# sourceMappingURL=WorkspaceWatcher.test.js.map