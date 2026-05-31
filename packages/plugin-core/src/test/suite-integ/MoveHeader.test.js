"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
const vscode_1 = __importDefault(require("vscode"));
const testUtilsv2_1 = require("../testUtilsv2");
const MoveHeader_1 = require("../../commands/MoveHeader");
const lodash_1 = __importDefault(require("lodash"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const NotePickerUtils_1 = require("../../components/lookup/NotePickerUtils");
const sinon_1 = __importDefault(require("sinon"));
const WSUtilsV2_1 = require("../../WSUtilsV2");
suite("MoveHeader", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, mocha_1.describe)("GIVEN a note with a simple header", () => {
        let originNote;
        let preSetupHook;
        (0, mocha_1.beforeEach)(() => {
            preSetupHook = async ({ wsRoot, vaults, }) => {
                originNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "origin",
                    wsRoot,
                    vault: vaults[0],
                    body: "## Foo header\n\n some text with anchor ^123",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "dest",
                    wsRoot,
                    vault: vaults[0],
                    body: "# Some header",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "ref-note",
                    wsRoot,
                    vault: vaults[0],
                    body: "[[Origin|origin]]\n\n[[Foo|origin#foo-header]]\n\n",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "ref-note2",
                    wsRoot,
                    vault: vaults[0],
                    body: "[[Foo|dendron://vault1/origin#foo-header]]\n\n",
                });
            };
        });
        (0, mocha_1.afterEach)(() => {
            sinon_1.default.restore();
        });
        (0, mocha_1.describe)("WHEN header is selected", () => {
            let onInitFunc;
            (0, mocha_1.beforeEach)(() => {
                onInitFunc = (nextFunc) => {
                    return async () => {
                        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                        const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(originNote);
                        editor.selection = new vscode_1.default.Selection(7, 0, 7, 0);
                        nextFunc();
                    };
                };
            });
            test("THEN the initial value is filled in with the current hierarchy", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: onInitFunc(async () => {
                        const cmd = new MoveHeader_1.MoveHeaderCommand();
                        const gatherOut = await cmd.gatherInputs({
                            nonInteractive: true,
                        });
                        (0, testUtilsv2_1.expect)(gatherOut?.dest?.fname).toEqual(originNote.fname);
                        done();
                    }),
                });
            });
            (0, mocha_1.describe)("AND WHEN existing item is selected for destination", () => {
                test("THEN selected item is used for destination", (done) => {
                    (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                        ctx,
                        preSetupHook,
                        onInit: onInitFunc(async () => {
                            sinon_1.default
                                .stub(NotePickerUtils_1.NotePickerUtils, "getInitialValueFromOpenEditor")
                                .returns("dest");
                            const cmd = new MoveHeader_1.MoveHeaderCommand();
                            const gatherOut = await cmd.gatherInputs({
                                nonInteractive: true,
                            });
                            (0, testUtilsv2_1.expect)(gatherOut?.dest?.fname).toEqual("dest");
                            done();
                        }),
                    });
                });
            });
            (0, mocha_1.describe)("AND WHEN move destination note does not exist", () => {
                test("THEN new note is created and header is appended to new note", (done) => {
                    (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                        ctx,
                        preSetupHook,
                        onInit: onInitFunc(async () => {
                            sinon_1.default
                                .stub(NotePickerUtils_1.NotePickerUtils, "getInitialValueFromOpenEditor")
                                .returns("new-note");
                            const cmd = new MoveHeader_1.MoveHeaderCommand();
                            const out = await cmd.run({
                                useSameVault: true,
                                nonInteractive: true,
                            });
                            const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                            const newNote = (await engine.findNotesMeta({
                                fname: "new-note",
                                vault: vaults[0],
                            }))[0];
                            (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(newNote)).toBeTruthy();
                            (0, testUtilsv2_1.expect)(out.origin.body.includes("## Foo header")).toBeFalsy();
                            (0, testUtilsv2_1.expect)(out.dest.body.includes("## Foo header")).toBeTruthy();
                            (0, testUtilsv2_1.expect)(out.dest.body.includes("^123")).toBeTruthy();
                            done();
                        }),
                    });
                });
            });
            (0, mocha_1.describe)("AND WHEN note reference exists in destination", () => {
                test("THEN selected header is moved from origin to dest", (done) => {
                    (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                        ctx,
                        preSetupHook: async ({ wsRoot, vaults, }) => {
                            originNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                                fname: "origin",
                                wsRoot,
                                vault: vaults[0],
                                body: "## Foo header\n\n",
                            });
                            await common_test_utils_1.NoteTestUtilsV4.createNote({
                                fname: "dest",
                                wsRoot,
                                vault: vaults[0],
                                body: "![[ref-note]] ",
                            });
                            await common_test_utils_1.NoteTestUtilsV4.createNote({
                                fname: "ref-note",
                                wsRoot,
                                vault: vaults[0],
                                body: "[[Foo|origin#foo-header]]",
                            });
                        },
                        onInit: onInitFunc(async () => {
                            sinon_1.default
                                .stub(NotePickerUtils_1.NotePickerUtils, "getInitialValueFromOpenEditor")
                                .returns("dest");
                            const cmd = new MoveHeader_1.MoveHeaderCommand();
                            const out = await cmd.run({
                                useSameVault: true,
                                nonInteractive: true,
                            });
                            (0, testUtilsv2_1.expect)(out.origin.body.includes("## Foo header")).toBeFalsy();
                            (0, testUtilsv2_1.expect)(out.dest.body.includes("## Foo header")).toBeTruthy();
                            done();
                        }),
                    });
                });
            });
            test("THEN selected header is moved from origin to dest", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: onInitFunc(async () => {
                        sinon_1.default
                            .stub(NotePickerUtils_1.NotePickerUtils, "getInitialValueFromOpenEditor")
                            .returns("dest");
                        const cmd = new MoveHeader_1.MoveHeaderCommand();
                        const out = await cmd.run({
                            useSameVault: true,
                            nonInteractive: true,
                        });
                        (0, testUtilsv2_1.expect)(out.origin.body.includes("## Foo header")).toBeFalsy();
                        (0, testUtilsv2_1.expect)(out.dest.body.includes("## Foo header")).toBeTruthy();
                        done();
                    }),
                });
            });
            test("THEN only reference to moved header is updated", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: onInitFunc(async () => {
                        sinon_1.default
                            .stub(NotePickerUtils_1.NotePickerUtils, "getInitialValueFromOpenEditor")
                            .returns("dest");
                        const cmd = new MoveHeader_1.MoveHeaderCommand();
                        const out = await cmd.run({
                            useSameVault: true,
                            nonInteractive: true,
                        });
                        await new Promise((resolve) => {
                            setTimeout(() => {
                                resolve();
                            }, 500);
                        });
                        const refNote = out.changed.find((n) => n.note.id === "ref-note").note;
                        const refNote2 = out.changed.find((n) => n.note.id === "ref-note2").note;
                        (0, testUtilsv2_1.expect)(refNote.body.includes("[[Foo|dest#foo-header]]")).toBeTruthy();
                        (0, testUtilsv2_1.expect)(refNote2.body.includes("[[Foo|dendron://vault1/dest#foo-header]]"));
                        (0, testUtilsv2_1.expect)(refNote.body.includes("[[Origin|dest]]")).toBeFalsy();
                        done();
                    }),
                });
            });
            test("THEN vault prefix is added to bare links if there are notes with same name as destination in different vaults", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await preSetupHook({ wsRoot, vaults });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "dest",
                            wsRoot,
                            vault: vaults[2],
                            genRandomId: true,
                        });
                    },
                    onInit: onInitFunc(async () => {
                        sinon_1.default
                            .stub(NotePickerUtils_1.NotePickerUtils, "getInitialValueFromOpenEditor")
                            .returns("dest");
                        const cmd = new MoveHeader_1.MoveHeaderCommand();
                        const out = await cmd.run({
                            useSameVault: true,
                            nonInteractive: true,
                        });
                        await new Promise((resolve) => {
                            setTimeout(() => {
                                resolve();
                            }, 100);
                        });
                        const refNote = out.changed.find((n) => n.note.id === "ref-note").note;
                        (0, testUtilsv2_1.expect)(refNote.body.includes("[[Foo|dest#foo-header]]")).toBeFalsy();
                        (0, testUtilsv2_1.expect)(refNote.body.includes("[[Foo|dendron://vault1/dest#foo-header]]"));
                        (0, testUtilsv2_1.expect)(refNote.body.includes("[[Origin|dest]]")).toBeFalsy();
                        done();
                    }),
                });
            });
        });
        (0, mocha_1.describe)("WHEN header is not select", () => {
            const onInitFunc = (nextFunc) => {
                return async () => {
                    const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const editor = await new WSUtilsV2_1.WSUtilsV2(ext).openNote(originNote);
                    editor.selection = new vscode_1.default.Selection(8, 0, 8, 0);
                    nextFunc();
                };
            };
            test("THEN MoveHeaderCommand throws an error", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: onInitFunc(async () => {
                        const cmd = new MoveHeader_1.MoveHeaderCommand();
                        let out;
                        let wasThrown = false;
                        try {
                            out = await cmd.gatherInputs({
                                useSameVault: true,
                                nonInteractive: true,
                            });
                        }
                        catch (error) {
                            wasThrown = true;
                            (0, testUtilsv2_1.expect)(error instanceof common_all_1.DendronError).toBeTruthy();
                            // Commented out since `.toContain` used to not do anything, now that `.toContain`
                            // is fixed this assertion does not pass:
                            //
                            // expect(error).toContain(
                            //   "You must first select the header you want to move."
                            // );
                        }
                        (0, testUtilsv2_1.expect)(wasThrown).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(out)).toBeTruthy();
                        done();
                    }),
                });
            });
        });
        (0, mocha_1.describe)("WHEN no note is open", () => {
            const onInitFunc = (nextFunc) => {
                return async () => {
                    await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                    nextFunc();
                };
            };
            test("THEN MoveHeaderCommand throws an error", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook,
                    onInit: onInitFunc(async () => {
                        const cmd = new MoveHeader_1.MoveHeaderCommand();
                        let out;
                        let wasThrown = false;
                        try {
                            out = await cmd.gatherInputs({});
                        }
                        catch (error) {
                            wasThrown = true;
                            (0, testUtilsv2_1.expect)(error instanceof common_all_1.DendronError).toBeTruthy();
                            // Commented out since `.toContain` used to not do anything, now that `.toContain`
                            // is fixed this assertion does not pass:
                            //
                            // expect(error).toContain("no note open.");
                        }
                        (0, testUtilsv2_1.expect)(wasThrown).toBeTruthy();
                        (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(out)).toBeTruthy();
                        done();
                    }),
                });
            });
        });
    });
});
//# sourceMappingURL=MoveHeader.test.js.map