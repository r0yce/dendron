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
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const GotoNote_1 = require("../../commands/GotoNote");
const utils_1 = require("../../components/lookup/utils");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const files_1 = require("../../utils/files");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const GotoNotePreset_1 = require("../presets/GotoNotePreset");
const testUtils_1 = require("../testUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const { ANCHOR_WITH_SPECIAL_CHARS, ANCHOR } = GotoNotePreset_1.GOTO_NOTE_PRESETS;
function createGoToNoteCmd() {
    return new GotoNote_1.GotoNoteCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
}
suite("GotoNote", function () {
    (0, mocha_1.describe)("new style tests", () => {
        const preSetupHook = engine_test_utils_1.ENGINE_HOOKS.setupBasic;
        (0, testUtilsV3_1.describeMultiWS)("WHEN pass in note", {
            preSetupHook,
        }, () => {
            test("THEN goto note", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const note = (await engine.getNoteMeta("foo")).data;
                const { note: out } = (await createGoToNoteCmd().run({
                    qs: "foo",
                    vault,
                }));
                (0, testUtilsv2_1.expect)(out).toEqual(note);
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("foo.md");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN goto stub", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                fs_extra_1.default.removeSync(path_1.default.join(vpath, "foo.md"));
            },
        }, () => {
            test("THEN get note", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const note = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(note, ["fname", "stub"])).toEqual({
                    fname: "foo",
                    stub: true,
                });
                const { note: out } = (await createGoToNoteCmd().run({
                    qs: "foo",
                    vault,
                }));
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(out, ["fname", "stub", "id"])).toEqual({
                    fname: "foo",
                    id: note.id,
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("foo.md");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN goto new note", {
            preSetupHook,
        }, () => {
            test("THEN note created", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const { note: out } = (await createGoToNoteCmd().run({
                    qs: "foo.ch2",
                    vault,
                }));
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(out, ["fname", "stub"])).toEqual({
                    fname: "foo.ch2",
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("foo.ch2.md");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN goto existing note via wikilink", {
            preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.preSetupHook,
            timeout: 5e3,
        }, () => {
            test("THEN user is not prompted to select vault", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.beforeTestResults({
                    ext,
                });
                const promptVaultSpy = sinon_1.default.spy(utils_1.PickerUtilsV2, "promptVault");
                const cmd = createGoToNoteCmd();
                await cmd.run();
                (0, testUtilsv2_1.expect)(promptVaultSpy.called).toBeFalsy();
                await (0, common_test_utils_1.runMochaHarness)(GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_TO_NOTE_IN_SAME_VAULT.results);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN goto new note with invalid filename", {
            preSetupHook,
        }, () => {
            test("THEN note is not created, and error toast is displayed", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const cmd = createGoToNoteCmd();
                const errorSpy = sinon_1.default.spy(cmd, "displayInvalidFilenameError");
                const out = await cmd.run({
                    qs: "foo..bar",
                    vault,
                });
                (0, testUtilsv2_1.expect)(out).toEqual(undefined);
                (0, testUtilsv2_1.expect)(errorSpy.called).toBeTruthy();
                errorSpy.restore();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN goto new note with valid filename", {
            preSetupHook: async (opts) => {
                const { vaults, wsRoot } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "origin",
                    vault: vaults[0],
                    wsRoot,
                    body: "[[new-note]]",
                });
            },
        }, () => {
            test("THEN note is created", async () => {
                const cmd = createGoToNoteCmd();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const originNote = (await engine.getNote("origin")).data;
                const out = await cmd.run({
                    originNote,
                    qs: "new-note",
                    vault: vaults[0],
                });
                (0, testUtilsv2_1.expect)(out).toBeTruthy();
                const newNote = (await engine.findNotes({
                    fname: "new-note",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(newNote).toBeTruthy();
                (0, testUtilsv2_1.expect)(newNote.links.length).toEqual(1);
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(newNote.links[0], "from", "type", "value")).toEqual({
                    from: {
                        fname: "origin",
                        id: "origin",
                        vaultName: "vault1",
                    },
                    type: "backlink",
                    value: "new-note",
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN goto note with template", {
            preSetupHook,
            postSetupHook: async ({ wsRoot, vaults }) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
            },
        }, () => {
            test("THEN apply template", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                await createGoToNoteCmd().run({
                    qs: "bar.ch1",
                    vault,
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("bar.ch1.md");
                const content = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.getText();
                (0, testUtilsv2_1.expect)(content.indexOf("ch1 template") >= 0).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN a new note and a template in different vaults", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
            },
        }, () => {
            test("THEN new note uses that template", async () => {
                // Template is in vault 1. Note is in vault 2
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[1];
                await createGoToNoteCmd().run({
                    qs: "bar.ch1",
                    vault,
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("bar.ch1.md");
                const content = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.getText();
                (0, testUtilsv2_1.expect)(content.indexOf("ch1 template") >= 0).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN a new note and multiple templates in different vaults with the same name", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Template is in vault 1 and 3
                await engine_test_utils_1.ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    genRandomId: true,
                    body: "food ch2 template in vaultThree",
                    fname: "bar.template.ch1",
                    vault: vaults[2],
                });
            },
        }, () => {
            let showQuickPick;
            (0, mocha_1.beforeEach)(() => {
                showQuickPick = sinon_1.default.stub(vscode.window, "showQuickPick");
            });
            (0, mocha_1.afterEach)(() => {
                showQuickPick.restore();
            });
            test("AND user picks from prompted vault, THEN template body gets applied to new note", async () => {
                // Try to create note in vault 3
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[2];
                // Pick vault 2
                showQuickPick.onFirstCall().returns(Promise.resolve({
                    label: "vaultThree",
                    vault: vaults[2],
                }));
                await createGoToNoteCmd().run({
                    qs: "bar.ch1",
                    vault,
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("bar.ch1.md");
                const content = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.getText();
                (0, testUtilsv2_1.expect)(content.indexOf("food ch2 template in vaultThree") >= 0).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN a new note and multiple templates in different vaults with the same name", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1 and specifies template in vault 2
                const vault = vaults[0];
                // Template is in vault2 and vaultThree
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    genRandomId: true,
                    body: "food ch2 template in vault 2",
                    fname: "template.ch2",
                    vault: vaults[1],
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    genRandomId: true,
                    body: "food ch2 template in vaultThree",
                    fname: "template.ch2",
                    vault: vaults[2],
                });
                const template = {
                    id: `dendron://${common_all_1.VaultUtils.getName(vaults[1])}/template.ch2`,
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
                });
            },
        }, () => {
            test("WHEN schema template uses xvault notation, THEN correct template body gets applied to new note", async () => {
                // Try to create note in vault 3
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[2];
                await createGoToNoteCmd().run({
                    qs: "food.ch2",
                    vault,
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("food.ch2.md");
                const content = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.getText();
                (0, testUtilsv2_1.expect)(content.indexOf("food ch2 template in vault 2") >= 0).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN goto note with anchor", {
            preSetupHook: async (opts) => {
                await ANCHOR.preSetupHook(opts);
            },
        }, () => {
            test("THEN goto anchor", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                await createGoToNoteCmd().run({
                    qs: "alpha",
                    vault,
                    anchor: {
                        type: "header",
                        value: "H3",
                    },
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("alpha.md");
                const selection = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection;
                (0, testUtilsv2_1.expect)(selection?.start.line).toEqual(9);
                (0, testUtilsv2_1.expect)(selection?.start.character).toEqual(0);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN go to note header with wikilink and unicode characters", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "target-note",
                    body: "\n\n## Lörem [[Foo：Bar🙂Baz|foo：bar🙂baz]] Ipsum\n\nlorem ipsum",
                });
            },
        }, () => {
            test("THEN goto ehader", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                await createGoToNoteCmd().run({
                    qs: "target-note",
                    vault,
                    anchor: {
                        type: "header",
                        value: "lörem-foo：barbaz-ipsum",
                    },
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("target-note.md");
                const selection = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection;
                (0, testUtilsv2_1.expect)(selection?.start.line).toEqual(9);
                (0, testUtilsv2_1.expect)(selection?.start.character).toEqual(0);
            });
        });
        let specialCharsHeader;
        (0, testUtilsV3_1.describeMultiWS)("WHEN anchor with special chars", {
            preSetupHook: async (opts) => {
                ({ specialCharsHeader } =
                    await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook(opts));
            },
        }, () => {
            test("THEN goto anchor", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                await createGoToNoteCmd().run({
                    qs: "alpha",
                    vault,
                    anchor: {
                        type: "header",
                        value: specialCharsHeader,
                    },
                });
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("alpha.md");
                const selection = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection;
                (0, testUtilsv2_1.expect)(selection?.start.line).toEqual(9);
                (0, testUtilsv2_1.expect)(selection?.start.character).toEqual(0);
            });
        });
    });
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    (0, mocha_1.describe)("using args", () => {
        test("block anchor", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
                        wsRoot,
                        vault: vaults[0],
                    });
                },
                onInit: async ({ vaults }) => {
                    const vault = vaults[0];
                    await createGoToNoteCmd().run({
                        qs: "anchor-target",
                        vault,
                        anchor: {
                            type: "block",
                            value: "block-id",
                        },
                    });
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("anchor-target.md");
                    const selection = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.selection;
                    (0, testUtilsv2_1.expect)(selection?.start.line).toEqual(10);
                    (0, testUtilsv2_1.expect)(selection?.start.character).toEqual(0);
                    done();
                },
            });
        });
        (0, mocha_1.describe)("hashtag", () => {
            let note;
            (0, testUtilsV3_1.describeMultiWS)("WHEN go to note used on hashtag", {
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        body: "#my.test-0.tag",
                    });
                },
            }, () => {
                test("THEN go to note referenced by hashtag", async () => {
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const { vaults } = extension.getEngine();
                    const promptVaultStub = sinon_1.default
                        .stub(utils_1.PickerUtilsV2, "promptVault")
                        .returns(Promise.resolve(vaults[1]));
                    await extension.wsUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(new vscode.Position(7, 1), new vscode.Position(7, 1));
                    await createGoToNoteCmd().run();
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("tags.my.test-0.tag.md");
                    (0, testUtilsv2_1.expect)(promptVaultStub.calledOnce).toBeTruthy();
                    promptVaultStub.restore();
                });
            });
        });
        (0, mocha_1.describe)("usertag", () => {
            let note;
            (0, testUtilsV3_1.describeMultiWS)("WHEN go to note used on usertag", {
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        body: "@test.mctestface",
                    });
                },
            }, () => {
                test("THEN go to note referenced by usertag", async () => {
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const { vaults } = extension.getEngine();
                    const promptVaultStub = sinon_1.default
                        .stub(utils_1.PickerUtilsV2, "promptVault")
                        .returns(Promise.resolve(vaults[1]));
                    await extension.wsUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(new vscode.Position(7, 1), new vscode.Position(7, 1));
                    await createGoToNoteCmd().run();
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("user.test.mctestface.md");
                    (0, testUtilsv2_1.expect)(promptVaultStub.calledOnce).toBeTruthy();
                    promptVaultStub.restore();
                });
            });
        });
        (0, mocha_1.describe)("frontmatter tags", () => {
            let note;
            (0, testUtilsV3_1.describeMultiWS)("WHEN single tag", {
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        props: {
                            tags: "my.test-0.tag",
                        },
                    });
                },
            }, () => {
                test("THEN go to note referenced in frontmatter", async () => {
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const { vaults } = extension.getEngine();
                    const promptVaultStub = sinon_1.default
                        .stub(utils_1.PickerUtilsV2, "promptVault")
                        .returns(Promise.resolve(vaults[1]));
                    await extension.wsUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(new vscode.Position(6, 8), new vscode.Position(6, 8));
                    await createGoToNoteCmd().run();
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("tags.my.test-0.tag.md");
                    (0, testUtilsv2_1.expect)(promptVaultStub.calledOnce).toBeTruthy();
                    promptVaultStub.restore();
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN tag contains space", {
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        props: {
                            tags: "one ",
                        },
                    });
                },
            }, () => {
                test("THEN go to note referenced in frontmatter", async () => {
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const { vaults } = extension.getEngine();
                    const promptVaultStub = sinon_1.default
                        .stub(utils_1.PickerUtilsV2, "promptVault")
                        .returns(Promise.resolve(vaults[1]));
                    await extension.wsUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(new vscode.Position(6, 8), new vscode.Position(6, 8));
                    await createGoToNoteCmd().run();
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("tags.one.md");
                    (0, testUtilsv2_1.expect)(promptVaultStub.calledOnce).toBeTruthy();
                    promptVaultStub.restore();
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN multiple tags", {
                preSetupHook: async ({ wsRoot, vaults }) => {
                    note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        props: {
                            tags: ["foo", "my.test-0.tag", "bar"],
                        },
                    });
                },
            }, () => {
                test("THEN go to note referenced in frontmatter", async () => {
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const { vaults } = extension.getEngine();
                    const promptVaultStub = sinon_1.default
                        .stub(utils_1.PickerUtilsV2, "promptVault")
                        .returns(Promise.resolve(vaults[1]));
                    await extension.wsUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(new vscode.Position(8, 6), new vscode.Position(8, 6));
                    await createGoToNoteCmd().run();
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("tags.my.test-0.tag.md");
                    (0, testUtilsv2_1.expect)(promptVaultStub.calledOnce).toBeTruthy();
                    promptVaultStub.restore();
                });
            });
        });
    });
    (0, mocha_1.describe)("using selection", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN link in code block", {
            preSetupHook: GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.preSetupHook,
        }, () => {
            test("THEN opens the note", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.beforeTestResults({ ext });
                await createGoToNoteCmd().run();
                await (0, common_test_utils_1.runMochaHarness)(GotoNotePreset_1.GOTO_NOTE_PRESETS.LINK_IN_CODE_BLOCK.results);
            });
        });
        test("xvault", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupLinksMulti(opts);
                },
                onInit: async ({ engine, vaults }) => {
                    const note = (await engine.getNoteMeta(common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname)).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    const linkPos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
                    editor.selection = new vscode.Selection(linkPos, linkPos);
                    // foo.ch1.md
                    await createGoToNoteCmd().run({});
                    const editor2 = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const suffix = path_1.default.join(vaults[1].fsPath, common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.fname) + ".md";
                    (0, testUtilsv2_1.expect)(editor2.document.uri.fsPath.endsWith(suffix)).toBeTruthy();
                    done();
                },
            });
        });
        (0, mocha_1.describe)("multiple notes & xvault link", () => {
            test("non-xvault link prompts for vault", (done) => {
                let note;
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async (opts) => {
                        note = await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
                    },
                    onInit: async ({ vaults, wsRoot }) => {
                        const prompt = sinon_1.default
                            .stub(utils_1.PickerUtilsV2, "promptVault")
                            .returns(Promise.resolve(vaults[1]));
                        try {
                            const editor = await WSUtils_1.WSUtils.openNote(note);
                            editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
                                line: 7,
                            });
                            await createGoToNoteCmd().run();
                            const openedNote = await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document);
                            (0, testUtilsv2_1.expect)(openedNote?.fname).toEqual("eggs");
                            (0, testUtilsv2_1.expect)(common_all_1.VaultUtils.isEqual(openedNote.vault, vaults[1], wsRoot)).toBeTruthy();
                            (0, testUtilsv2_1.expect)(prompt.calledOnce).toBeTruthy();
                            done();
                        }
                        finally {
                            prompt.restore();
                        }
                    },
                });
            });
            test("xvault link to other vault", (done) => {
                let note;
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async (opts) => {
                        note = await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
                    },
                    onInit: async ({ vaults, wsRoot }) => {
                        const editor = await WSUtils_1.WSUtils.openNote(note);
                        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
                            line: 8,
                        });
                        await createGoToNoteCmd().run();
                        const openedNote = await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document);
                        (0, testUtilsv2_1.expect)(openedNote?.fname).toEqual("eggs");
                        (0, testUtilsv2_1.expect)(common_all_1.VaultUtils.isEqual(openedNote.vault, vaults[0], wsRoot)).toBeTruthy();
                        done();
                    },
                });
            });
            test("xvault link to same vault", (done) => {
                let note;
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async (opts) => {
                        note = await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
                    },
                    onInit: async ({ vaults, wsRoot }) => {
                        const editor = await WSUtils_1.WSUtils.openNote(note);
                        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
                            line: 9,
                        });
                        await createGoToNoteCmd().run();
                        const openedNote = await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document);
                        (0, testUtilsv2_1.expect)(openedNote?.fname).toEqual("eggs");
                        (0, testUtilsv2_1.expect)(common_all_1.VaultUtils.isEqual(openedNote.vault, vaults[1], wsRoot)).toBeTruthy();
                        done();
                    },
                });
            });
            test("xvault link to non-existant note", (done) => {
                let note;
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async (opts) => {
                        note = await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
                    },
                    onInit: async ({ vaults, wsRoot }) => {
                        const editor = await WSUtils_1.WSUtils.openNote(note);
                        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
                            line: 10,
                        });
                        await createGoToNoteCmd().run();
                        const openedNote = await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document);
                        // Should have created the note in this vault
                        (0, testUtilsv2_1.expect)(openedNote?.fname).toEqual("eggs");
                        (0, testUtilsv2_1.expect)(common_all_1.VaultUtils.isEqual(openedNote.vault, vaults[2], wsRoot)).toBeTruthy();
                        done();
                    },
                });
            });
            test("xvault link to non-existant vault", (done) => {
                let note;
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async (opts) => {
                        note = await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
                    },
                    onInit: async ({ vaults, wsRoot }) => {
                        const editor = await WSUtils_1.WSUtils.openNote(note);
                        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
                            line: 11,
                        });
                        await createGoToNoteCmd().run();
                        const openedNote = await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document);
                        // Should not have changed notes
                        (0, testUtilsv2_1.expect)(openedNote?.fname).toEqual("test");
                        (0, testUtilsv2_1.expect)(common_all_1.VaultUtils.isEqual(openedNote.vault, vaults[1], wsRoot)).toBeTruthy();
                        done();
                    },
                });
            });
        });
        test("xvault with multiple matches", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupLinksMulti(opts);
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
                        vault: opts.vaults[2],
                        wsRoot: opts.wsRoot,
                        genRandomId: true,
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    sinon_1.default
                        .stub(utils_1.PickerUtilsV2, "promptVault")
                        .returns(Promise.resolve(vaults[1]));
                    const note = (await engine.getNoteMeta(common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname)).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    const linkPos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
                    editor.selection = new vscode.Selection(linkPos, linkPos);
                    await createGoToNoteCmd().run({});
                    const editor2 = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const suffix = path_1.default.join(vaults[1].fsPath, common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.fname) + ".md";
                    (0, testUtilsv2_1.expect)(editor2.document.uri.fsPath.endsWith(suffix)).toBeTruthy();
                    done();
                },
            });
        });
        test("multi-link in same line", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                    const { wsRoot } = opts;
                    const vault = opts.vaults[0];
                    await common_test_utils_1.NoteTestUtilsV4.modifyNoteByPath({ wsRoot, vault, fname: "foo" }, (note) => {
                        note.body =
                            "this is a [[foolink]]. this is another link [[foo.ch1]]";
                        return note;
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const note = (await engine.getNoteMeta("foo")).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    // put cursor in location on 48
                    editor.selection = new vscode.Selection(new vscode.Position(7, 48), new vscode.Position(7, 48));
                    // foo.ch1.md
                    await createGoToNoteCmd().run({
                        vault: vaults[0],
                    });
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("foo.ch1.md");
                    done();
                },
            });
        });
        (0, mocha_1.describe)("GIVEN non-note files", () => {
            (0, testUtilsV3_1.describeMultiWS)("WHEN used on a link to a non-note file", { ctx }, () => {
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.txt"), "Et voluptatem autem sunt.");
                    await fs_extra_1.default.ensureDir(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[1]), "assets"));
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[1]), "assets", "test.txt"), "Et hic est voluptatem eum quia quas pariatur.");
                });
                test("THEN opens the non-note file", async () => {
                    const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        body: "[[/test.txt]]",
                        engine,
                    });
                    await WSUtils_1.WSUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(7, 1, 7, 1);
                    await createGoToNoteCmd().run();
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("test.txt");
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText().trim()).toEqual("Et voluptatem autem sunt.");
                });
                (0, mocha_1.describe)("AND the link doesn't include a slash", () => {
                    (0, mocha_1.before)(async () => {
                        const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                            wsRoot,
                            vault: vaults[0],
                            fname: "test.note",
                            body: "[[test.txt]]",
                            engine,
                        });
                        await WSUtils_1.WSUtils.openNote(note);
                        vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                            new vscode.Selection(7, 1, 7, 1);
                        await createGoToNoteCmd().run();
                    });
                    test("THEN opens the non-note file", async () => {
                        (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("test.txt");
                        (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText().trim()).toEqual("Et voluptatem autem sunt.");
                    });
                });
                (0, mocha_1.describe)("AND the link starts with assets", () => {
                    (0, mocha_1.before)(async () => {
                        const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                        const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                            wsRoot,
                            vault: vaults[0],
                            fname: "test.note2",
                            body: "[[assets/test.txt]]",
                            engine,
                        });
                        await WSUtils_1.WSUtils.openNote(note);
                        vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                            new vscode.Selection(7, 1, 7, 1);
                        await createGoToNoteCmd().run();
                    });
                    test("THEN opens the non-note file inside assets", async () => {
                        (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("test.txt");
                        (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText().trim()).toEqual("Et hic est voluptatem eum quia quas pariatur.");
                    });
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN there's a note and non-note file with the same name", { ctx }, () => {
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        body: "[[test.txt]]",
                        engine,
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.txt",
                        body: "Accusantium id et sunt cum esse.",
                        engine,
                    });
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.txt"), "Et voluptatem autem sunt.");
                    await WSUtils_1.WSUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(7, 1, 7, 1);
                    await createGoToNoteCmd().run();
                });
                test("THEN opens the note", async () => {
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("test.txt.md");
                    (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                        body: vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                        match: ["Accusantium id et sunt cum esse."],
                        nomatch: ["Voluptatibus et totam qui eligendi qui quaerat."],
                    })).toBeTruthy();
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN linked to a specific line inside of that file", { ctx }, () => {
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        body: "[[test.txt#L3]]",
                        engine,
                    });
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.txt"), [
                        "Aut fugit eos sint eos explicabo.",
                        "Ut dolores fugit qui deserunt.",
                        "Animi et recusandae in blanditiis sapiente.",
                        "Consequatur est repellat non.",
                    ].join("\n"));
                    await WSUtils_1.WSUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(7, 1, 7, 1);
                    await createGoToNoteCmd().run();
                });
                test("THEN opens the file at that line", async () => {
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("test.txt");
                    (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                        body: vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                        match: ["Animi et recusandae in blanditiis sapiente."],
                    })).toBeTruthy();
                    (0, testUtilsv2_1.expect)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection.start.line
                    // Link is 1-indexed, while VSCode is 0-indexed
                    ).toEqual(2);
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN linked to a file starting with a dot", { ctx }, () => {
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        body: "[[.test/file.txt]]",
                        engine,
                    });
                    await fs_extra_1.default.ensureDir(path_1.default.join(wsRoot, ".test"));
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, ".test", "file.txt"), ["Et corporis assumenda quia libero illo."].join("\n"));
                    await WSUtils_1.WSUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(7, 1, 7, 1);
                    await createGoToNoteCmd().run();
                });
                test("THEN opens that file", async () => {
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("file.txt");
                    (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                        body: vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                        match: ["Et corporis assumenda quia libero illo."],
                    })).toBeTruthy();
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN linked to a binary file", { ctx }, () => {
                const filename = "test.zip";
                const notename = "test.note";
                let openWithDefaultApp;
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: notename,
                        body: `[[/${filename}]]`,
                        engine,
                    });
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, filename), "");
                    openWithDefaultApp = sinon_1.default.stub(files_1.PluginFileUtils, "openWithDefaultApp");
                    await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(7, 1, 7, 1);
                    await createGoToNoteCmd().run();
                });
                test("THEN opens that file in the default app", async () => {
                    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    // The open note didn't change
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)().startsWith(notename)).toBeTruthy();
                    // Used the stubbed function to open in default app
                    (0, testUtilsv2_1.expect)(openWithDefaultApp.calledOnceWith(path_1.default.join(wsRoot, filename)));
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN linked to a file under assets where assets is in root and not a vault", { ctx }, () => {
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: "test.note",
                        body: "[[assets/file.txt]]",
                        engine,
                    });
                    await fs_extra_1.default.ensureDir(path_1.default.join(wsRoot, "assets"));
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "assets", "file.txt"), ["Dolorum sed earum enim rem expedita nemo."].join("\n"));
                    await WSUtils_1.WSUtils.openNote(note);
                    vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                        new vscode.Selection(7, 1, 7, 1);
                    await createGoToNoteCmd().run();
                });
                test("THEN opens that file", async () => {
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("file.txt");
                    (0, testUtilsv2_1.expect)(common_test_utils_1.AssertUtils.assertInString({
                        body: vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.getText(),
                        match: ["Dolorum sed earum enim rem expedita nemo."],
                    })).toBeTruthy();
                });
            });
        });
    });
});
//# sourceMappingURL=GotoNote.test.js.map