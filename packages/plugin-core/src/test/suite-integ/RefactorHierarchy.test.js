"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const RefactorHierarchyV2_1 = require("../../commands/RefactorHierarchyV2");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const sinon_1 = __importDefault(require("sinon"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
suite("RefactorHierarchy", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => { },
    });
    /**
     * Setup
     * refactor.md
     * ```
     * - [[refactor.one]]
     * - [[refactor.two]]
     * ```
     *
     * refactor.one.md
     * ```
     * - [[refactor.two]]
     * ```
     *
     */
    (0, mocha_1.describe)("GIVEN a workspace with some notes with simple hierarchy", () => {
        let note;
        let noteOne;
        let noteTwo;
        let preSetupHook;
        (0, mocha_1.beforeEach)(() => {
            preSetupHook = async (opts) => {
                const { wsRoot, vaults } = opts;
                const vault = vaults[0];
                note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault,
                    wsRoot,
                    fname: "refactor",
                    body: ["- [[refactor.one]]", "- [[refactor.two]]"].join("\n"),
                });
                noteOne = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault,
                    wsRoot,
                    fname: "refactor.one",
                    body: ["- [[refactor.two]]"].join("\n"),
                });
                noteTwo = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault,
                    wsRoot,
                    fname: "refactor.two",
                });
            };
        });
        (0, mocha_1.afterEach)(() => {
            sinon_1.default.restore();
        });
        (0, mocha_1.describe)("WHEN scope is undefined", () => {
            /**
             * After test
             * refactor(.*) -> prefix$1
             *
             * refactor.md
             * ```
             * - [[prefix.one]]
             * - [[prefix.two]]
             * ```
             *
             * refactor.one.md
             * ```
             * - [[prefix.two]]
             */
            test("THEN scope is all existing notes, all notes and links refactored.", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: async () => {
                        const cmd = new RefactorHierarchyV2_1.RefactorHierarchyCommandV2();
                        await cmd.execute({
                            scope: undefined,
                            match: "refactor(.*)",
                            replace: "prefix$1",
                            noConfirm: true,
                        });
                        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                        const { vaults, wsRoot } = engine;
                        const vault = vaults[0];
                        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                        const notes = fs_extra_1.default.readdirSync(vpath).join("");
                        const exist = ["prefix.md", "prefix.one.md", "prefix.two.md"];
                        const notExist = [
                            "refactor.md",
                            "refactor.one.md",
                            "refactor.two.md",
                        ];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: notes,
                            match: exist,
                            nomatch: notExist,
                        })).toBeTruthy();
                        const noteAfterRefactor = (await engine.findNotes({ fname: "prefix", vault }))[0];
                        (0, testUtilsv2_1.expect)(noteAfterRefactor?.body).toEqual("- [[prefix.one]]\n- [[prefix.two]]");
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("WHEN scoped to one note", () => {
            test("THEN only refactor that note and links to it.", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: async () => {
                        const cmd = new RefactorHierarchyV2_1.RefactorHierarchyCommandV2();
                        const scope = {
                            selectedItems: [
                                {
                                    ...noteTwo,
                                    label: "refactor.two",
                                },
                            ],
                            onAcceptHookResp: [],
                        };
                        await cmd.execute({
                            scope,
                            match: "refactor(.*)",
                            replace: "prefix$1",
                            noConfirm: true,
                        });
                        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                        const { vaults, wsRoot } = engine;
                        const vault = vaults[0];
                        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                        const notes = fs_extra_1.default.readdirSync(vpath).join("");
                        const exist = ["refactor.md", "refactor.one.md", "prefix.two.md"];
                        const notExist = ["prefix.md", "prefix.one.md", "refactor.two.md"];
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: notes,
                            match: exist,
                            nomatch: notExist,
                        })).toBeTruthy();
                        const noteAfterRefactor = (await engine.findNotes({ fname: "refactor", vault }))[0];
                        (0, testUtilsv2_1.expect)(noteAfterRefactor?.body).toEqual("- [[refactor.one]]\n- [[prefix.two]]");
                        const noteOneAfterRefactor = (await engine.findNotes({ fname: "refactor.one", vault }))[0];
                        (0, testUtilsv2_1.expect)(noteOneAfterRefactor?.body).toEqual("- [[prefix.two]]");
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("WHEN given simple regex match / replace text with capture group", () => {
            test("THEN correctly refactors fname", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: async () => {
                        const cmd = new RefactorHierarchyV2_1.RefactorHierarchyCommandV2();
                        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                        const { wsRoot } = engine;
                        const capturedNotes = [note, noteOne, noteTwo];
                        const operations = cmd.getRenameOperations({
                            capturedNotes,
                            matchRE: new RegExp("(.*)"),
                            replace: "prefix.$1.suffix",
                            wsRoot,
                        });
                        operations.forEach((op) => {
                            const newFname = path_1.default.basename(op.newUri.path, ".md");
                            const oldFname = path_1.default.basename(op.oldUri.path, ".md");
                            (0, testUtilsv2_1.expect)(newFname.startsWith("prefix.")).toBeTruthy();
                            (0, testUtilsv2_1.expect)(newFname.endsWith(".suffix")).toBeTruthy();
                            (0, testUtilsv2_1.expect)(newFname.includes(oldFname)).toBeTruthy();
                        });
                        done();
                    },
                });
            });
        });
    });
    (0, mocha_1.describe)("GIVEN a workspace with some notes with complex hierarchy", () => {
        let refFooTest;
        let refBarTest;
        let refEggTest;
        let preSetupHook;
        (0, mocha_1.beforeEach)(() => {
            preSetupHook = async (opts) => {
                const { wsRoot, vaults } = opts;
                const vault = vaults[0];
                refFooTest = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault,
                    wsRoot,
                    fname: "dendron.ref.foo.test",
                });
                refBarTest = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault,
                    wsRoot,
                    fname: "dendron.ref.bar.test",
                });
                refEggTest = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault,
                    wsRoot,
                    fname: "dendron.ref.egg.test",
                });
            };
        });
        (0, mocha_1.afterEach)(() => {
            sinon_1.default.restore();
        });
        (0, mocha_1.describe)("WHEN a complex regex match (lookaround) / replace text with (named) capture/non-capture group is given", () => {
            test("THEN correctly refactors fname", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: async () => {
                        const cmd = new RefactorHierarchyV2_1.RefactorHierarchyCommandV2();
                        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                        const { wsRoot } = engine;
                        const capturedNotes = [refFooTest, refBarTest, refEggTest];
                        const operations = cmd.getRenameOperations({
                            capturedNotes,
                            // capture two depth of hierarchy if parent is "ref"
                            // discard whatever comes before "ref"
                            matchRE: new RegExp("(?:.*)(?<=ref)\\.(\\w*)\\.(?<rest>.*)"),
                            replace: "pkg.$<rest>.$1.ref",
                            wsRoot,
                        });
                        operations.forEach((op) => {
                            const newFname = path_1.default.basename(op.newUri.path, ".md");
                            const oldFname = path_1.default.basename(op.oldUri.path, ".md");
                            (0, testUtilsv2_1.expect)(newFname.startsWith("pkg.test.")).toBeTruthy();
                            (0, testUtilsv2_1.expect)(newFname.endsWith(".ref")).toBeTruthy();
                            (0, testUtilsv2_1.expect)(oldFname.split(".")[2]).toEqual(newFname.split(".")[2]);
                        });
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("WHEN match would capture fname of note that is a stub", () => {
            test("THEN: stub notes are not part of notes that are being refactored", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: async () => {
                        const cmd = new RefactorHierarchyV2_1.RefactorHierarchyCommandV2();
                        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                        const capturedNotes = await cmd.getCapturedNotes({
                            scope: undefined,
                            matchRE: new RegExp("dendron.ref"),
                            engine,
                        });
                        // none of the captured notes should have stub: true
                        // stub notes in this test are:
                        // dendron.ref, dendron.ref.foo, dendron.ref.bar, dendron.ref.egg
                        const numberOfNotesThatAreStubs = capturedNotes.filter((note) => note.stub).length;
                        (0, testUtilsv2_1.expect)(numberOfNotesThatAreStubs).toEqual(0);
                        done();
                    },
                });
            });
        });
    });
});
//# sourceMappingURL=RefactorHierarchy.test.js.map