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
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const MoveNoteCommand_1 = require("../../commands/MoveNoteCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const createEngine = (0, testUtilsV3_1.createEngineFactory)({
    renameNote: (opts) => {
        const rename = async ({ oldLoc, newLoc }) => {
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            const vpathOld = (0, common_server_1.vault2Path)({
                vault: common_all_1.VaultUtils.getVaultByName({
                    vaults: opts.vaults,
                    vname: oldLoc.vaultName,
                }),
                wsRoot: opts.wsRoot,
            });
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(path_1.default.join(vpathOld, oldLoc.fname + ".md")));
            const resp = await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: oldLoc.fname,
                            vaultName: oldLoc.vaultName,
                        },
                        newLoc: {
                            fname: newLoc.fname,
                            vaultName: newLoc.vaultName,
                        },
                    },
                ],
            });
            return {
                data: resp?.changed,
            };
        };
        return rename;
    },
    findNotes: () => {
        const findNotes = async ({ fname, vault }) => {
            return ExtensionProvider_1.ExtensionProvider.getEngine().findNotes({ fname, vault });
        };
        return findNotes;
    },
    findNotesMeta: () => {
        const findNotesMeta = async ({ fname, vault, }) => {
            return ExtensionProvider_1.ExtensionProvider.getEngine().findNotesMeta({ fname, vault });
        };
        return findNotesMeta;
    },
    getNote: () => {
        const getNote = async (id) => {
            return ExtensionProvider_1.ExtensionProvider.getEngine().getNote(id);
        };
        return getNote;
    },
    getNoteMeta: () => {
        const getNoteMeta = async (id) => {
            return ExtensionProvider_1.ExtensionProvider.getEngine().getNoteMeta(id);
        };
        return getNoteMeta;
    },
});
suite("MoveNoteCommand", function () {
    lodash_1.default.map(lodash_1.default.omit(engine_test_utils_1.ENGINE_RENAME_PRESETS["NOTES"], [
        "NO_UPDATE",
        "NO_UPDATE_NUMBER_IN_FM",
        "NO_UPDATE_DOUBLE_QUOTE_IN_FM",
        "RENAME_FOR_CACHE",
    ]), (TestCase, name) => {
        const { testFunc, preSetupHook } = TestCase;
        (0, testUtilsV3_1.describeMultiWS)(name, {
            preSetupHook,
        }, () => {
            test("THEN correct results", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const engineMock = createEngine({ wsRoot, vaults });
                const results = await testFunc({
                    engine: engineMock,
                    vaults,
                    wsRoot,
                    initResp: {},
                });
                await (0, common_test_utils_1.runJestHarnessV2)(results, testUtilsv2_1.expect);
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN update body", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
    }, () => {
        test("THEN correct results ", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultDir = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
            const vaultFrom = vaults[0];
            const vaultTo = vaults[0];
            {
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(path_1.default.join(vaultDir, "foo.md")));
                let active = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await vscode.commands.executeCommand("cursorDown");
                await active.edit((builder) => {
                    const pos = active.selection.active;
                    builder.insert(pos, "hello");
                });
                await active.document.save();
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
                const resp = await cmd.execute({
                    moves: [
                        {
                            oldLoc: {
                                fname: "foo",
                                vaultName: common_all_1.VaultUtils.getName(vaultFrom),
                            },
                            newLoc: {
                                fname: "foobar",
                                vaultName: common_all_1.VaultUtils.getName(vaultTo),
                            },
                        },
                    ],
                });
                (0, testUtilsv2_1.expect)(resp?.changed?.length).toEqual(6);
                active = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                (0, testUtilsv2_1.expect)(common_all_1.DNodeUtils.fname(active.document.uri.fsPath)).toEqual("foobar");
                (0, testUtilsv2_1.expect)(active.document.getText().indexOf("hello") >= 0).toBeTruthy();
            }
        });
    });
    let tagNote;
    (0, testUtilsV3_1.describeMultiWS)("WHEN update hashtag", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            tagNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "tags.test-tag.0",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "test",
                body: "#test-tag.0",
            });
        },
    }, () => {
        test("THEN update hashtags correctly", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(tagNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: "tags.test-tag.0",
                            vaultName: common_all_1.VaultUtils.getName(vaults[0]),
                        },
                        newLoc: {
                            fname: "tags.new-0-tag.1",
                            vaultName: common_all_1.VaultUtils.getName(vaults[0]),
                        },
                    },
                ],
            });
            const testNote = (await engine.findNotes({ fname: "test", vault: vaults[0] }))[0];
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body: testNote?.body,
                match: ["#new-0-tag.1"],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN moving a note into `tags.`", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            tagNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "not-really-tag",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "test",
                body: "[[not-really-tag]]",
            });
        },
    }, () => {
        test("THEN  turns links to hashtags", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(tagNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: "not-really-tag",
                            vaultName: common_all_1.VaultUtils.getName(vaults[0]),
                        },
                        newLoc: {
                            fname: "tags.actually-tag",
                            vaultName: common_all_1.VaultUtils.getName(vaults[0]),
                        },
                    },
                ],
            });
            const testNote = (await engine.findNotes({ fname: "test", vault: vaults[0] }))[0];
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body: testNote?.body,
                match: ["#actually-tag"],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN moving a note out of `tags.`", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            tagNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "tags.actually-tag",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: vaults[0],
                wsRoot,
                fname: "test",
                body: "#actually-tag",
            });
        },
    }, () => {
        test("THEN turns hashtags into regular links", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(tagNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: "tags.actually-tag",
                            vaultName: common_all_1.VaultUtils.getName(vaults[0]),
                        },
                        newLoc: {
                            fname: "not-really-tag",
                            vaultName: common_all_1.VaultUtils.getName(vaults[0]),
                        },
                    },
                ],
            });
            const testNote = (await engine.findNotes({ fname: "test", vault: vaults[0] }))[0];
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body: testNote?.body,
                match: ["[[not-really-tag]]"],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN move note in same vault", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
    }, () => {
        test("THEN note moved correctly", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultFrom = vaults[0];
            const vaultTo = vaults[0];
            const fooNote = (await engine.findNotesMeta({ fname: "foo", vault: vaultFrom }))[0];
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(fooNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: "foo",
                            vaultName: common_all_1.VaultUtils.getName(vaultFrom),
                        },
                        newLoc: {
                            fname: "newFoo",
                            vaultName: common_all_1.VaultUtils.getName(vaultTo),
                        },
                    },
                ],
            });
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(path_1.default.join("vault1", "newFoo.md"))).toBeTruthy();
            // note not in old vault
            (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                wsRoot,
                vault: vaultFrom,
                match: ["newFoo.md"],
                nomatch: ["foo.md"],
            })).toBeTruthy();
            // note foo is now a stub
            const fooNoteAfter = (await engine.findNotes({ fname: "foo" }))[0];
            (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(fooNoteAfter) && fooNoteAfter.stub).toBeTruthy();
            // newFoo is in the first vault
            (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined((await engine.findNotesMeta({ fname: "newFoo", vault: vaultFrom }))[0])).toBeFalsy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN move scratch note", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
    }, () => {
        test("THEN do right thing", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const vault1 = vaults[0];
            const vault2 = vaults[0];
            const fname = "scratch.2020.02.03.0123";
            const scratchNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname,
                vault: vaults[0],
                wsRoot,
                engine,
            });
            await ext.wsUtils.openNote(scratchNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(ext);
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname,
                            vaultName: common_all_1.VaultUtils.getName(vault1),
                        },
                        newLoc: {
                            fname: "newScratch",
                            vaultName: common_all_1.VaultUtils.getName(vault2),
                        },
                    },
                ],
            });
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(path_1.default.join("vault1", "newScratch.md"))).toBeTruthy();
            const note = await engine.getNote(fname);
            (0, testUtilsv2_1.expect)(note.data).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN move note to new vault", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
    }, () => {
        test("THEN do right thing", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault1 = vaults[0];
            const vault2 = vaults[1];
            const fooNote = (await engine.findNotes({ fname: "foo", vault: vault1 }))[0];
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(fooNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: "foo",
                            vaultName: common_all_1.VaultUtils.getName(vault1),
                        },
                        newLoc: {
                            fname: "foo",
                            vaultName: common_all_1.VaultUtils.getName(vault2),
                        },
                    },
                ],
            });
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(path_1.default.join("vault2", "foo.md"))).toBeTruthy();
            // note not in old vault
            (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                wsRoot,
                vault: vault1,
                nomatch: ["foo.md"],
            })).toBeTruthy();
            (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                wsRoot,
                vault: vault2,
                match: ["foo.md"],
            })).toBeTruthy();
            const fooNotes = await engine.findNotesMeta({ fname: "foo" });
            const vault1Foo = fooNotes.find((note) => note.vault.fsPath === "vault1");
            const vault2Foo = fooNotes.find((note) => note.vault.fsPath === "vault2");
            (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(vault1Foo) && vault1Foo.stub).toBeTruthy();
            (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(vault2Foo)).toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined((await engine.findNotes({ fname: "foo", vault: vault2 }))[0])).toBeFalsy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN bulk-move: move 2 notes from different vaults to new vault", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti({ wsRoot, vaults });
        },
    }, () => {
        test("THEN do right thing", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault1 = vaults[0];
            const vault2 = vaults[1];
            const vault3 = vaults[2];
            const fooNote = (await engine.findNotes({ fname: "foo", vault: vault1 }))[0];
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(fooNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            sinon_1.default
                .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                .returns(Promise.resolve("proceed"));
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: "foo",
                            vaultName: common_all_1.VaultUtils.getName(vault1),
                        },
                        newLoc: {
                            fname: "foo",
                            vaultName: common_all_1.VaultUtils.getName(vault3),
                        },
                    },
                    {
                        oldLoc: {
                            fname: "bar",
                            vaultName: common_all_1.VaultUtils.getName(vault2),
                        },
                        newLoc: {
                            fname: "bar",
                            vaultName: common_all_1.VaultUtils.getName(vault3),
                        },
                    },
                ],
            });
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(path_1.default.join("vault3", "foo.md"))).toBeTruthy();
            // Check that the files are not in old vaults anymore
            (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                wsRoot,
                vault: vault2,
                nomatch: ["bar.md"],
            })).toBeTruthy();
            const vault1Foo = (await engine.findNotesMeta({
                fname: "foo",
                vault: vault1,
            }))[0];
            (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(vault1Foo) && vault1Foo.stub).toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined((await engine.findNotes({ fname: "bar", vault: vault2 }))[0])).toBeTruthy();
            // Should be in vault 3
            (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                wsRoot,
                vault: vault3,
                match: ["foo.md", "bar.md"],
            })).toBeTruthy();
            (0, testUtilsv2_1.expect)((await engine.findNotes({ fname: "foo", vault: vault3 }))[0]).toBeTruthy();
            (0, testUtilsv2_1.expect)((await engine.findNotes({ fname: "bar", vault: vault3 }))[0]).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN bulk-move: move 2 notes from same vault to new vault", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
        },
    }, () => {
        test("THEN do right thing", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault1 = vaults[0];
            const vault2 = vaults[1];
            const fooNote = (await engine.findNotes({ fname: "foo", vault: vault1 }))[0];
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            await extension.wsUtils.openNote(fooNote);
            const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
            sinon_1.default
                .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                .returns(Promise.resolve("proceed"));
            await cmd.execute({
                moves: [
                    {
                        oldLoc: {
                            fname: "foo",
                            vaultName: common_all_1.VaultUtils.getName(vault1),
                        },
                        newLoc: {
                            fname: "foo",
                            vaultName: common_all_1.VaultUtils.getName(vault2),
                        },
                    },
                    {
                        oldLoc: {
                            fname: "foo.ch1",
                            vaultName: common_all_1.VaultUtils.getName(vault1),
                        },
                        newLoc: {
                            fname: "foo.ch1",
                            vaultName: common_all_1.VaultUtils.getName(vault2),
                        },
                    },
                ],
            });
            (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.fileName.endsWith(path_1.default.join("vault2", "foo.md"))).toBeTruthy();
            (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                wsRoot,
                vault: vault1,
                nomatch: ["foo.md", "foo.ch1.md"],
            })).toBeTruthy();
            // Since there are no more children, stubs should not exist
            (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined((await engine.findNotes({ fname: "foo", vault: vault1 }))[0])).toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined((await engine.findNotes({ fname: "foo.ch1", vault: vault1 }))[0])).toBeTruthy();
            (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                wsRoot,
                vault: vault1,
                nomatch: ["foo.md", "foo.ch1.md"],
            })).toBeTruthy();
            (0, testUtilsv2_1.expect)((await engine.findNotes({ fname: "foo", vault: vault2 }))[0]).toBeTruthy();
            (0, testUtilsv2_1.expect)((await engine.findNotes({ fname: "foo.ch1", vault: vault2 }))[0]).toBeTruthy();
        });
    });
    const preSetupHook = async ({ wsRoot, vaults }) => {
        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
    };
    const mockProvider = {
        provide: () => { },
        onUpdatePickerItems: () => { },
        onDidAccept: () => { },
    };
    (0, testUtilsV3_1.describeMultiWS)("WHEN prompt vault selection if multi vault", {
        preSetupHook,
        timeout: 3e6,
    }, () => {
        test("THEN do right thing", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault1 = vaults[0];
            const fooNote = (await engine.findNotes({ fname: "foo", vault: vault1 }))[0];
            await WSUtils_1.WSUtils.openNote(fooNote);
            const lc = ExtensionProvider_1.ExtensionProvider.getExtension().lookupControllerFactory.create({
                nodeType: "note",
            });
            const initialValue = path_1.default.basename(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "", ".md");
            await lc.show({
                title: "Move note",
                placeholder: "foo",
                provider: mockProvider,
                initialValue,
            });
            (0, testUtilsv2_1.expect)(lc.quickPick.buttons[0].pressed).toBeTruthy();
            lc.onHide();
        });
    });
});
//# sourceMappingURL=MoveNoteCommand.test.js.map