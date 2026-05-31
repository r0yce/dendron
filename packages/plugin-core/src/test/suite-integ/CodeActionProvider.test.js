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
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const EditorUtils_1 = require("../../utils/EditorUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("Contextual UI Tests", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    (0, mocha_1.describe)("GIVEN only broken wikilink is selected in editor", () => {
        test("THEN code action for create new note is displayed", (done) => {
            let noteWithLink;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "test",
                        vault: vaults[0],
                        wsRoot,
                        body: "[[foo.bar]]",
                    });
                },
                onInit: async ({ engine }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                    const start = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition();
                    const end = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkPosition({ char: 10 });
                    editor.selection = new vscode.Selection(start, end);
                    (0, testUtilsv2_1.expect)(await EditorUtils_1.EditorUtils.isBrokenWikilink({
                        editor,
                        selection: editor.selection,
                        engine,
                        note: noteWithLink,
                    })).toBeTruthy();
                    done();
                },
            });
        });
        (0, mocha_1.describe)("AND selected link is a broken user tag", () => {
            test("THEN code action for create new note is displayed", (done) => {
                let noteWithLink;
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "test",
                            vault: vaults[0],
                            wsRoot,
                            body: "@foo.bar",
                        });
                    },
                    onInit: async ({ engine }) => {
                        const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                        editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                        (0, testUtilsv2_1.expect)(await EditorUtils_1.EditorUtils.isBrokenWikilink({
                            editor,
                            selection: editor.selection,
                            engine,
                            note: noteWithLink,
                        })).toBeTruthy();
                        done();
                    },
                });
            });
            (0, mocha_1.describe)("AND user tags are disabled", () => {
                test("THEN code action for create new note is NOT displayed", (done) => {
                    let noteWithLink;
                    (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                        ctx,
                        preSetupHook: async ({ wsRoot, vaults }) => {
                            noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                                fname: "test",
                                vault: vaults[0],
                                wsRoot,
                                body: "@foo.bar",
                            });
                        },
                        modConfigCb: (config) => {
                            common_all_1.ConfigUtils.setWorkspaceProp(config, "enableUserTags", false);
                            return config;
                        },
                        onInit: async ({ engine }) => {
                            const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                            editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection();
                            (0, testUtilsv2_1.expect)(await EditorUtils_1.EditorUtils.isBrokenWikilink({
                                editor,
                                selection: editor.selection,
                                engine,
                                note: noteWithLink,
                            })).toBeFalsy();
                            done();
                        },
                    });
                });
            });
        });
    });
    let noteWithLink;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN header is selected in editor", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "test",
                vault: vaults[0],
                wsRoot,
                body: "## Welcome",
            });
        },
    }, () => {
        test("THEN code action for rename header is displayed", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
            const start = new vscode.Position(7, 2);
            const end = new vscode.Position(7, 10);
            editor.selection = new vscode.Selection(start, end);
            (0, testUtilsv2_1.expect)(await EditorUtils_1.EditorUtils.isBrokenWikilink({
                editor,
                selection: editor.selection,
                engine,
                note: noteWithLink,
            })).toBeFalsy();
            (0, testUtilsv2_1.expect)(EditorUtils_1.EditorUtils.getHeaderAt({
                document: editor.document,
                position: start,
            })).toNotEqual(undefined);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN some text is selected in editor", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            noteWithLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "test",
                vault: vaults[0],
                wsRoot,
                body: "This is a root page",
            });
        },
    }, () => {
        test("THEN code action for create note is displayed", async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
            const start = new vscode.Position(7, 0);
            const end = new vscode.Position(7, 18);
            editor.selection = new vscode.Selection(start, end);
            (0, testUtilsv2_1.expect)(EditorUtils_1.EditorUtils.getHeaderAt({
                document: editor.document,
                position: start,
            })).toEqual(undefined);
            (0, testUtilsv2_1.expect)(await EditorUtils_1.EditorUtils.isBrokenWikilink({
                editor,
                selection: editor.selection,
                engine,
                note: noteWithLink,
            })).toBeFalsy();
        });
    });
});
//# sourceMappingURL=CodeActionProvider.test.js.map