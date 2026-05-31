"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const mocha_1 = require("mocha");
const vscode_1 = __importDefault(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const RenameProvider_1 = __importDefault(require("../../features/RenameProvider"));
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("RenameProvider", function () {
    let activeNote;
    let targetNote;
    let editor;
    let provider;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN wikilink", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "active",
                vault: vaults[0],
                wsRoot,
                body: [
                    "[[target]]", // line 7, char 2 ~ 8
                    "[[Target|target]]", // line 8, char 9 ~ 15
                    "[[Target|dendron://vault1/target]]", // line 9, char 26 ~ 32
                    "[[Target|dendron://vault1/target#foo]]", // line 10, 26 ~ 32
                ].join("\n"),
            });
            targetNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "target",
                vault: vaults[0],
                wsRoot,
                body: ["# Foo"].join("\n"),
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link",
                vault: vaults[0],
                wsRoot,
                body: ["[[target]]"].join("\n"),
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link-in-another-vault",
                vault: vaults[1],
                wsRoot,
                body: ["[[dendron://vault1/target]]"].join("\n"),
            });
        },
    }, () => {
        (0, mocha_1.beforeEach)(async () => {
            editor = await WSUtils_1.WSUtils.openNote(activeNote);
            provider = new RenameProvider_1.default();
        });
        test("THEN range is properly provided", async () => {
            const positions = [
                new vscode_1.default.Position(7, 0),
                new vscode_1.default.Position(8, 0),
                new vscode_1.default.Position(9, 0),
                new vscode_1.default.Position(10, 0),
            ];
            const actualRanges = await Promise.all(positions.map(async (position) => {
                const range = await provider.prepareRename(editor.document, position);
                return range;
            }));
            const expectRanges = [
                new vscode_1.default.Range(new vscode_1.default.Position(7, 2), new vscode_1.default.Position(7, 8)),
                new vscode_1.default.Range(new vscode_1.default.Position(8, 9), new vscode_1.default.Position(8, 15)),
                new vscode_1.default.Range(new vscode_1.default.Position(9, 26), new vscode_1.default.Position(9, 32)),
                new vscode_1.default.Range(new vscode_1.default.Position(10, 26), new vscode_1.default.Position(10, 32)),
            ];
            (0, testUtilsv2_1.expect)(actualRanges).toEqual(expectRanges);
        });
        (0, mocha_1.describe)("WHEN rename is executed", () => {
            let executeOut;
            (0, mocha_1.before)(async () => {
                provider.targetNote = targetNote;
                executeOut = await provider.executeRename({ newName: "new-target" });
            });
            test("THEN correctly renamed at symbol position", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const active = (await engine.findNotes({ fname: "active", vault: vaults[0] }))[0];
                const expectedBody = [
                    "[[new-target]]",
                    "[[New Target|new-target]]",
                    "[[New Target|dendron://vault1/new-target]]",
                    "[[New Target|dendron://vault1/new-target#foo]]",
                ].join("\n");
                (0, testUtilsv2_1.expect)(active?.body).toEqual(expectedBody);
            });
            test("AND target note is correctly renamed", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newTarget = (await engine.findNotes({ fname: "new-target", vault: vaults[0] }))[0];
                (0, testUtilsv2_1.expect)(newTarget).toBeTruthy();
            });
            test("THEN references to target note is correctly updated", async () => {
                (0, testUtilsv2_1.expect)(executeOut?.changed.length).toEqual(13);
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const noteWithLink = (await engine.findNotes({
                    fname: "note-with-link",
                    vault: vaults[0],
                }))[0];
                const noteWithLinkInAnotherVault = (await engine.findNotes({
                    fname: "note-with-link-in-another-vault",
                    vault: vaults[1],
                }))[0];
                (0, testUtilsv2_1.expect)(noteWithLink?.body).toEqual("[[new-target]]");
                (0, testUtilsv2_1.expect)(noteWithLinkInAnotherVault?.body).toEqual("[[dendron://vault1/new-target]]");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN note references", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "active",
                vault: vaults[0],
                wsRoot,
                body: [
                    "![[target]]", // line 7, char 2 ~ 8
                    "![[dendron://vault1/target]]", // line 9, char 26 ~ 32
                    "![[dendron://vault1/target#foo]]", // line 10, 26 ~ 32
                ].join("\n"),
            });
            targetNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "target",
                vault: vaults[0],
                wsRoot,
                body: ["# Foo"].join("\n"),
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link",
                vault: vaults[0],
                wsRoot,
                body: ["![[target]]"].join("\n"),
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link-in-another-vault",
                vault: vaults[1],
                wsRoot,
                body: ["![[dendron://vault1/target]]"].join("\n"),
            });
        },
    }, () => {
        (0, mocha_1.beforeEach)(async () => {
            editor = await WSUtils_1.WSUtils.openNote(activeNote);
            provider = new RenameProvider_1.default();
        });
        test("THEN range is properly provided", async () => {
            const positions = [
                new vscode_1.default.Position(7, 1),
                new vscode_1.default.Position(8, 1),
                new vscode_1.default.Position(9, 1),
            ];
            const actualRanges = await Promise.all(positions.map(async (position) => {
                const range = await provider.prepareRename(editor.document, position);
                return range;
            }));
            const expectRanges = [
                new vscode_1.default.Range(new vscode_1.default.Position(7, 3), new vscode_1.default.Position(7, 9)),
                new vscode_1.default.Range(new vscode_1.default.Position(8, 26), new vscode_1.default.Position(8, 20)),
                new vscode_1.default.Range(new vscode_1.default.Position(9, 26), new vscode_1.default.Position(9, 20)),
            ];
            (0, testUtilsv2_1.expect)(actualRanges).toEqual(expectRanges);
        });
        (0, mocha_1.describe)("WHEN rename is executed", () => {
            let executeOut;
            (0, mocha_1.before)(async () => {
                provider.targetNote = targetNote;
                executeOut = await provider.executeRename({ newName: "new-target" });
            });
            test("THEN correctly renamed at symbol position", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const active = (await engine.findNotes({
                    fname: "active",
                    vault: vaults[0],
                }))[0];
                const expectedBody = [
                    "![[new-target]]",
                    "![[dendron://vault1/new-target]]",
                    "![[dendron://vault1/new-target#foo]]",
                ].join("\n");
                (0, testUtilsv2_1.expect)(active?.body).toEqual(expectedBody);
            });
            test("AND target note is correctly renamed", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newTarget = (await engine.findNotes({
                    fname: "new-target",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(newTarget).toBeTruthy();
            });
            test("THEN references to target note is correctly updated", async () => {
                (0, testUtilsv2_1.expect)(executeOut?.changed.length).toEqual(12);
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const noteWithLink = (await engine.findNotes({
                    fname: "note-with-link",
                    vault: vaults[0],
                }))[0];
                const noteWithLinkInAnotherVault = (await engine.findNotes({
                    fname: "note-with-link-in-another-vault",
                    vault: vaults[1],
                }))[0];
                (0, testUtilsv2_1.expect)(noteWithLink?.body).toEqual("![[new-target]]");
                (0, testUtilsv2_1.expect)(noteWithLinkInAnotherVault?.body).toEqual("![[dendron://vault1/new-target]]");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN hashtag", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "active",
                vault: vaults[0],
                wsRoot,
                body: [
                    "#target", // line 7, char 2 ~ 8
                ].join("\n"),
            });
            targetNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "tags.target",
                vault: vaults[0],
                wsRoot,
                body: ["# Foo"].join("\n"),
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link",
                vault: vaults[0],
                wsRoot,
                body: ["#target"].join("\n"),
            });
        },
    }, () => {
        (0, mocha_1.beforeEach)(async () => {
            editor = await WSUtils_1.WSUtils.openNote(activeNote);
            provider = new RenameProvider_1.default();
        });
        test("THEN range is properly provided", async () => {
            const position = new vscode_1.default.Position(7, 0);
            const actualRange = await provider.prepareRename(editor.document, position);
            const expectRange = new vscode_1.default.Range(new vscode_1.default.Position(7, 1), new vscode_1.default.Position(7, 7));
            (0, testUtilsv2_1.expect)(actualRange).toEqual(expectRange);
        });
        (0, mocha_1.describe)("WHEN rename is executed", () => {
            let executeOut;
            (0, mocha_1.before)(async () => {
                provider.targetNote = targetNote;
                executeOut = await provider.executeRename({ newName: "new-target" });
            });
            test("THEN correctly renamed at symbol position", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const active = (await engine.findNotes({
                    fname: "active",
                    vault: vaults[0],
                }))[0];
                const expectedBody = "#new-target";
                (0, testUtilsv2_1.expect)(active?.body).toEqual(expectedBody);
            });
            test("AND target note is correctly renamed", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newTarget = (await engine.findNotes({
                    fname: "tags.new-target",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(newTarget).toBeTruthy();
            });
            test("THEN references to target note is correctly updated", async () => {
                (0, testUtilsv2_1.expect)(executeOut?.changed.length).toEqual(10);
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const noteWithLink = (await engine.findNotes({
                    fname: "note-with-link",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(noteWithLink?.body).toEqual("#new-target");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN frontmatter tag", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "active",
                vault: vaults[0],
                wsRoot,
                props: { tags: "target" },
            });
            targetNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "tags.target",
                vault: vaults[0],
                wsRoot,
                body: ["# Foo"].join("\n"),
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link",
                vault: vaults[0],
                wsRoot,
                props: { tags: "target" },
            });
        },
    }, () => {
        (0, mocha_1.beforeEach)(async () => {
            editor = await WSUtils_1.WSUtils.openNote(activeNote);
            provider = new RenameProvider_1.default();
        });
        test("THEN range is properly provided", async () => {
            const position = new vscode_1.default.Position(6, 7);
            const actualRange = await provider.prepareRename(editor.document, position);
            const expectRange = new vscode_1.default.Range(new vscode_1.default.Position(6, 6), new vscode_1.default.Position(6, 12));
            (0, testUtilsv2_1.expect)(actualRange).toEqual(expectRange);
        });
        (0, mocha_1.describe)("WHEN rename is executed", () => {
            let executeOut;
            (0, mocha_1.before)(async () => {
                provider.targetNote = targetNote;
                executeOut = await provider.executeRename({ newName: "new-target" });
            });
            test("THEN correctly renamed at symbol position", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const active = (await engine.findNotes({
                    fname: "active",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(active?.tags).toEqual("new-target");
            });
            test("AND target note is correctly renamed", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newTarget = (await engine.findNotes({
                    fname: "tags.new-target",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(newTarget).toBeTruthy();
            });
            test("THEN references to target note is correctly updated", async () => {
                (0, testUtilsv2_1.expect)(executeOut?.changed.length).toEqual(10);
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const noteWithLink = (await engine.findNotes({
                    fname: "note-with-link",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(noteWithLink?.tags).toEqual("new-target");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN usertag", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "active",
                vault: vaults[0],
                wsRoot,
                body: [
                    "@target", // line 7, char 2 ~ 8
                ].join("\n"),
            });
            targetNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "user.target",
                vault: vaults[0],
                wsRoot,
                body: ["# Foo"].join("\n"),
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "note-with-link",
                vault: vaults[0],
                wsRoot,
                body: ["@target"].join("\n"),
            });
        },
    }, () => {
        (0, mocha_1.beforeEach)(async () => {
            editor = await WSUtils_1.WSUtils.openNote(activeNote);
            provider = new RenameProvider_1.default();
        });
        test("THEN range is properly provided", async () => {
            const position = new vscode_1.default.Position(7, 0);
            const actualRange = await provider.prepareRename(editor.document, position);
            const expectRange = new vscode_1.default.Range(new vscode_1.default.Position(7, 1), new vscode_1.default.Position(7, 7));
            (0, testUtilsv2_1.expect)(actualRange).toEqual(expectRange);
        });
        (0, mocha_1.describe)("WHEN rename is executed", () => {
            let executeOut;
            (0, mocha_1.before)(async () => {
                provider.targetNote = targetNote;
                executeOut = await provider.executeRename({ newName: "new-target" });
            });
            test("THEN correctly renamed at symbol position", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const active = (await engine.findNotes({
                    fname: "active",
                    vault: vaults[0],
                }))[0];
                const expectedBody = "@new-target";
                (0, testUtilsv2_1.expect)(active?.body).toEqual(expectedBody);
            });
            test("AND target note is correctly renamed", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newTarget = (await engine.findNotes({
                    fname: "user.new-target",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(newTarget).toBeTruthy();
            });
            test("THEN references to target note is correctly updated", async () => {
                (0, testUtilsv2_1.expect)(executeOut?.changed.length).toEqual(10);
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const noteWithLink = (await engine.findNotes({
                    fname: "note-with-link",
                    vault: vaults[0],
                }))[0];
                (0, testUtilsv2_1.expect)(noteWithLink?.body).toEqual("@new-target");
            });
        });
    });
});
//# sourceMappingURL=RenameProvider.test.js.map