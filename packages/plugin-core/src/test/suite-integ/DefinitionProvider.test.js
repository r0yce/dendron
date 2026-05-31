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
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const DefinitionProvider_1 = __importDefault(require("../../features/DefinitionProvider"));
const files_1 = require("../../utils/files");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const GotoNotePreset_1 = require("../presets/GotoNotePreset");
const testUtils_1 = require("../testUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
async function provide(editor) {
    const doc = editor?.document;
    const provider = new DefinitionProvider_1.default();
    const locations = await provider.provideDefinition(doc, testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition(), null);
    return locations;
}
suite("DefinitionProvider", function () {
    (0, mocha_1.describe)("same vault", () => {
        let noteWithLink;
        let noteWithTarget;
        let _wsRoot;
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                _wsRoot = wsRoot;
                noteWithTarget = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                    wsRoot,
                    vault: vaults[0],
                    genRandomId: true,
                });
                noteWithLink = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                    wsRoot,
                    vault: vaults[0],
                });
            },
        }, () => {
            test("THEN provide correct definitions", async () => {
                const editor = await WSUtils_1.WSUtils.openNote(noteWithTarget);
                const location = (await provide(editor));
                (0, testUtilsv2_1.expect)(location.uri.fsPath.toLowerCase()).toEqual(common_all_1.NoteUtils.getFullPath({
                    wsRoot: _wsRoot,
                    note: noteWithLink,
                }).toLowerCase());
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN vault prefix", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                await (0, engine_test_utils_1.callSetupHook)(engine_test_utils_1.SETUP_HOOK_KEYS.WITH_LINKS, {
                    workspaceType: "single",
                    wsRoot,
                    vaults,
                    withVaultPrefix: true,
                });
            },
        }, () => {
            test("THEN provide correct definitions", async () => {
                const { wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = (await engine.getNoteMeta("alpha")).data;
                const beta = (await engine.getNoteMeta("beta")).data;
                const editor = await WSUtils_1.WSUtils.openNote(note);
                const location = (await provide(editor));
                (0, testUtilsv2_1.expect)(location.uri.fsPath.toLowerCase()).toEqual(common_all_1.NoteUtils.getFullPath({ wsRoot, note: beta }).toLowerCase());
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN anchor", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                await GotoNotePreset_1.GOTO_NOTE_PRESETS.ANCHOR.preSetupHook({ wsRoot, vaults });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "beta",
                    vault,
                    body: `[[alpha#h3]]`,
                    wsRoot,
                });
            },
        }, () => {
            test("THEN provide correct definitions", async () => {
                const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = (await engine.getNoteMeta("beta")).data;
                const editor = await WSUtils_1.WSUtils.openNote(note);
                const doc = editor?.document;
                const provider = new DefinitionProvider_1.default();
                const pos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
                const loc = (await provider.provideDefinition(doc, pos, null));
                (0, testUtilsv2_1.expect)(testUtilsv2_1.LocationTestUtils.getBasenameFromLocation(loc)).toEqual("alpha.md");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN alias", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                _wsRoot = wsRoot;
                noteWithTarget = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                    wsRoot,
                    vault: vaults[0],
                });
                noteWithLink = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
                    wsRoot,
                    vault: vaults[0],
                });
            },
        }, () => {
            test("THEN provide correct definitions", async () => {
                const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                const location = (await provide(editor));
                (0, testUtilsv2_1.expect)(location.uri.fsPath.toLowerCase()).toEqual(common_all_1.NoteUtils.getFullPath({
                    wsRoot: _wsRoot,
                    note: noteWithTarget,
                }).toLowerCase());
            });
        });
        const { ANCHOR_WITH_SPECIAL_CHARS } = GotoNotePreset_1.GOTO_NOTE_PRESETS;
        (0, testUtilsV3_1.describeMultiWS)("GIVEN anchor with special characters", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                const { specialCharsHeader } = await ANCHOR_WITH_SPECIAL_CHARS.preSetupHook({
                    wsRoot,
                    vaults: [vault],
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "beta",
                    vault,
                    body: `[[alpha#${(0, common_all_1.getSlugger)().slug(specialCharsHeader)}]]`,
                    wsRoot,
                });
            },
        }, () => {
            test("THEN provide correct definitions", async () => {
                const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = (await engine.getNoteMeta("beta")).data;
                const editor = await WSUtils_1.WSUtils.openNote(note);
                const doc = editor?.document;
                const provider = new DefinitionProvider_1.default();
                const pos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
                const loc = (await provider.provideDefinition(doc, pos, null));
                (0, testUtilsv2_1.expect)(testUtilsv2_1.LocationTestUtils.getBasenameFromLocation(loc)).toEqual("alpha.md");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN multi vault", {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupLinksMulti({ wsRoot, vaults });
        },
    }, () => {
        test("THEN provide correct definitions", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNoteMeta("alpha")).data;
            const editor = await WSUtils_1.WSUtils.openNote(note);
            const doc = editor?.document;
            const provider = new DefinitionProvider_1.default();
            const locations = (await provider.provideDefinition(doc, testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition(), null));
            (0, testUtilsv2_1.expect)(locations.uri.fsPath.toLowerCase()).toEqual(path_1.default.join(wsRoot, vaults[1].fsPath, "beta.md").toLowerCase());
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN multi vault with prefix", {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await (0, engine_test_utils_1.callSetupHook)(engine_test_utils_1.SETUP_HOOK_KEYS.WITH_LINKS, {
                workspaceType: "multi",
                wsRoot,
                vaults,
                withVaultPrefix: true,
            });
        },
    }, () => {
        test("THEN provide correct definitions", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNoteMeta("alpha")).data;
            const editor = await WSUtils_1.WSUtils.openNote(note);
            const doc = editor?.document;
            const provider = new DefinitionProvider_1.default();
            const locations = (await provider.provideDefinition(doc, testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition(), null));
            (0, testUtilsv2_1.expect)(locations.uri.fsPath.toLowerCase()).toEqual(path_1.default.join(wsRoot, vaults[1].fsPath, "beta.md").toLowerCase());
        });
    });
    let noteTarget1;
    let noteTarget2;
    let noteWithLink;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN multi vault with same name", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            noteTarget1 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
                genRandomId: true,
            });
            noteTarget2 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[1],
                genRandomId: true,
            });
            noteWithLink = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
        },
    }, () => {
        test("THEN provide correct definitions", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
            const locations = (await provide(editor));
            (0, testUtilsv2_1.expect)(locations.length).toEqual(2);
            (0, testUtilsv2_1.expect)(locations.map((l) => l.uri.fsPath.toLowerCase())).toEqual([
                common_all_1.NoteUtils.getFullPath({
                    wsRoot,
                    note: noteTarget1,
                }).toLowerCase(),
                common_all_1.NoteUtils.getFullPath({
                    wsRoot,
                    note: noteTarget2,
                }).toLowerCase(),
            ]);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN notes with same name", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            noteTarget1 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
                genRandomId: true,
            });
            noteTarget2 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[1],
                genRandomId: true,
            });
            noteWithLink = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
        },
    }, () => {
        test("THEN provide correct definitions", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
            const locations = (await provide(editor));
            (0, testUtilsv2_1.expect)(locations.length).toEqual(2);
            (0, testUtilsv2_1.expect)(locations.map((l) => l.uri.fsPath.toLowerCase())).toEqual([
                common_all_1.NoteUtils.getFullPath({
                    wsRoot,
                    note: noteTarget1,
                }).toLowerCase(),
                common_all_1.NoteUtils.getFullPath({
                    wsRoot,
                    note: noteTarget2,
                }).toLowerCase(),
            ]);
        });
    });
    (0, mocha_1.describe)("WHEN used on a link to a non-note file", () => {
        (0, testUtilsV3_1.describeSingleWS)("AND it's a text file", {}, () => {
            (0, mocha_1.before)(async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.txt"), "Et voluptatem autem sunt.");
            });
            test("THEN finds the correct definiton for that file", async () => {
                const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    wsRoot,
                    vault: vaults[0],
                    fname: "test.note",
                    body: "[[/test.txt]]",
                    engine,
                });
                await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
                vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                    new vscode.Selection(7, 1, 7, 1);
                const { document } = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                const pos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
                const location = (await new DefinitionProvider_1.default().provideDefinition(document, pos, (0, testUtilsV3_1.stubCancellationToken)()));
                // The open file should not have changed
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("test.note.md");
                // Should have provided the right file as definition
                (0, testUtilsv2_1.expect)(location).toBeTruthy();
                (0, testUtilsv2_1.expect)(location.uri.fsPath).toEqual(path_1.default.join(wsRoot, "test.txt"));
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND it's a binary file", {}, () => {
            (0, mocha_1.before)(async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.txt"), "Et voluptatem autem sunt.");
                await fs_extra_1.default.ensureFile(path_1.default.join(wsRoot, "test.png"));
            });
            test("THEN doesn't open the non-note binary file", async () => {
                const openWithDefaultApp = sinon_1.default
                    .stub(files_1.PluginFileUtils, "openWithDefaultApp")
                    .resolves();
                const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const note = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    wsRoot,
                    vault: vaults[0],
                    fname: "test.note",
                    body: "[[/test.png]]",
                    engine,
                });
                await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
                vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().selection =
                    new vscode.Selection(7, 1, 7, 1);
                const { document } = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                const pos = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
                await new DefinitionProvider_1.default().provideDefinition(document, pos, (0, testUtilsV3_1.stubCancellationToken)());
                // The open file should not have changed
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)()).toEqual("test.note.md");
                // The file should not have opened in default app
                (0, testUtilsv2_1.expect)(openWithDefaultApp.called).toBeFalsy();
                openWithDefaultApp.restore();
            });
        });
    });
});
//# sourceMappingURL=DefinitionProvider.test.js.map