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
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const ReferenceProvider_1 = __importDefault(require("../../features/ReferenceProvider"));
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
async function provide({ editor, pos, }) {
    const doc = editor?.document;
    const referenceProvider = new ReferenceProvider_1.default();
    const links = await referenceProvider.provideReferences(doc, pos);
    return links;
}
async function provideForNote(editor) {
    return provide({ editor, pos: new vscode.Position(7, 2) });
}
async function provideForNonNote(editor) {
    return provide({ editor, pos: new vscode.Position(0, 2) });
}
const checkRefs = ({ links, refs, wsRoot, }) => {
    (0, testUtilsv2_1.expect)(links?.length).toEqual(2);
    const firstLineRange = new vscode.Range(new vscode.Position(7, 0), new vscode.Position(7, 18));
    const secondLineRange = new vscode.Range(new vscode.Position(7, 0), new vscode.Position(7, 14));
    (0, testUtilsv2_1.expect)(links.map((l) => l.range)).toEqual([firstLineRange, secondLineRange]);
    (0, testUtilsv2_1.expect)(links.map((l) => l.uri.fsPath.toLocaleLowerCase())).toEqual(refs.map((note) => common_all_1.NoteUtils.getFullPath({ note, wsRoot }).toLocaleLowerCase()));
};
const createSampleNotes = async ({ wsRoot, vaults }) => {
    const activeNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
        fname: "active",
        vault: vaults[0],
        wsRoot,
        body: "## Foo",
    });
    const refNote1 = await common_test_utils_1.NoteTestUtilsV4.createNote({
        fname: "ref-one",
        vault: vaults[0],
        wsRoot,
        body: "[[Foo|active#foo]]\n\n[[Foo|active#four]]",
    });
    const refNote2 = await common_test_utils_1.NoteTestUtilsV4.createNote({
        fname: "ref-two",
        vault: vaults[0],
        wsRoot,
        body: "[[active#foo]]",
    });
    return { activeNote, refNote1, refNote2 };
};
suite("GIVEN ReferenceProvider", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => { },
    });
    (0, mocha_1.describe)("GIVEN a note with some header, and some note that references that header", () => {
        let activeNote;
        let refNote1;
        let refNote2;
        test("THEN reference to that header is correctly provided", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    ({ activeNote, refNote1, refNote2 } = await createSampleNotes({
                        wsRoot,
                        vaults,
                    }));
                },
                onInit: async ({ wsRoot }) => {
                    const editor = await WSUtils_1.WSUtils.openNote(activeNote);
                    const links = (await provideForNote(editor));
                    checkRefs({ links, refs: [refNote1, refNote2], wsRoot });
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("AND GIVEN non-dendron file", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN try to find references", {
            ctx,
            preSetupHook: async (opts) => {
                await common_test_utils_1.FileTestUtils.createFiles(opts.wsRoot, [
                    { path: "sample.with-header", body: "## Foo" },
                    { path: "sample.empty", body: "" },
                ]);
                return createSampleNotes(opts);
            },
        }, () => {
            test("THEN empty file return null", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join(wsRoot, "sample.empty");
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const links = await provideForNonNote(editor);
                (0, testUtilsv2_1.expect)(links).toEqual(null);
            });
            test("THEN file with header returns null", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join(wsRoot, "sample.with-header");
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const links = (await provideForNonNote(editor));
                (0, testUtilsv2_1.expect)(links).toEqual(null);
            });
        });
    });
    (0, mocha_1.describe)("provides correct links", () => {
        test("basic", (done) => {
            let noteWithTarget1;
            let noteWithTarget2;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    noteWithTarget1 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                        fname: "alpha",
                        vault: vaults[0],
                        wsRoot,
                    });
                    noteWithTarget2 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                        fname: "beta",
                        vault: vaults[0],
                        wsRoot,
                    });
                },
                onInit: async () => {
                    const editor = await WSUtils_1.WSUtils.openNote(noteWithTarget1);
                    const links = await provideForNote(editor);
                    (0, testUtilsv2_1.expect)(links.map((l) => l.uri.fsPath)).toEqual([noteWithTarget1, noteWithTarget2].map((note) => common_all_1.NoteUtils.getFullPath({
                        note,
                        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
                    })));
                    done();
                },
            });
        });
        test("with multiple vaults", (done) => {
            let noteWithTarget1;
            let noteWithTarget2;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    noteWithTarget1 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                        fname: "alpha",
                        vault: vaults[0],
                        wsRoot,
                    });
                    noteWithTarget2 = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                        fname: "beta",
                        vault: vaults[1],
                        wsRoot,
                    });
                },
                onInit: async () => {
                    const editor = await WSUtils_1.WSUtils.openNote(noteWithTarget1);
                    const links = await provideForNote(editor);
                    (0, testUtilsv2_1.expect)(links.map((l) => l.uri.fsPath)).toEqual([noteWithTarget1, noteWithTarget2].map((note) => common_all_1.NoteUtils.getFullPath({
                        note,
                        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
                    })));
                    done();
                },
            });
        });
        test("with anchor", (done) => {
            let noteWithLink;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
                        vault: vaults[0],
                        wsRoot,
                    });
                    noteWithLink = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
                        vault: vaults[0],
                        wsRoot,
                    });
                },
                onInit: async () => {
                    const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                    const links = await provideForNote(editor);
                    (0, testUtilsv2_1.expect)(links.map((l) => l.uri.fsPath)).toEqual([noteWithLink].map((note) => common_all_1.NoteUtils.getFullPath({
                        note,
                        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
                    })));
                    done();
                },
            });
        });
        test("with alias", (done) => {
            let noteWithLink;
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                        vault: vaults[0],
                        wsRoot,
                    });
                    noteWithLink = await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
                        vault: vaults[0],
                        wsRoot,
                    });
                },
                onInit: async () => {
                    const editor = await WSUtils_1.WSUtils.openNote(noteWithLink);
                    const links = await provideForNote(editor);
                    (0, testUtilsv2_1.expect)(links.map((l) => l.uri.fsPath)).toEqual([noteWithLink].map((note) => common_all_1.NoteUtils.getFullPath({
                        note,
                        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
                    })));
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=ReferenceProvider.test.js.map