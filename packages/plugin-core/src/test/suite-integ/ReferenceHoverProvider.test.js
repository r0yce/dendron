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
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const ReferenceHoverProvider_1 = __importDefault(require("../../features/ReferenceHoverProvider"));
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
async function provide({ editor, pos, }) {
    const doc = editor?.document;
    const referenceProvider = new ReferenceHoverProvider_1.default();
    return referenceProvider.provideHover(doc, pos);
}
async function provideForNote(editor) {
    return provide({ editor, pos: new vscode.Position(7, 4) });
}
async function provideForNonNote(editor) {
    return provide({ editor, pos: new vscode.Position(0, 2) });
}
suite("GIVEN ReferenceHoverProvider", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this);
    (0, testUtilsV3_1.describeMultiWS)("AND WHEN used in non-dendron file", {
        ctx,
        preSetupHook: async (opts) => {
            return common_test_utils_1.FileTestUtils.createFiles(opts.wsRoot, [
                { path: "sample.with-header", body: "## Foo" },
                { path: "sample.empty", body: "" },
            ]);
        },
    }, () => {
        (0, mocha_1.describe)("AND the file is empty", () => {
            test("THEN return null", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join(wsRoot, "sample.empty");
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const hover = await provideForNonNote(editor);
                (0, testUtilsv2_1.expect)(hover).toEqual(null);
            });
        });
        (0, mocha_1.describe)("AND file has a header", () => {
            test("THEN return null", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join(wsRoot, "sample.with-header");
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const hover = await provideForNonNote(editor);
                (0, testUtilsv2_1.expect)(hover).toEqual(null);
            });
        });
    });
    (0, mocha_1.describe)("has correct hover contents", () => {
        (0, mocha_1.describe)("wikilink", () => {
            test("basic", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "[[target]]",
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(7, 4));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                        });
                        done();
                    },
                });
            });
            test("missing notes are marked as such", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "[[target]]", // target doesn't exist
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents.join(""),
                            match: [
                                `Note target is missing`,
                                `use "Dendron: Go to Note" command`,
                            ],
                        });
                        done();
                    },
                });
            });
            test.skip("contains local image", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Sint quo sunt maxime.",
                                "![](/assets/test/image.png)",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "[[target]]",
                        });
                    },
                    onInit: async ({ wsRoot, vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        // Local images should get full path to image, because hover preview otherwise can't find the image
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                `![](${path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "assets/test/image.png")})`,
                            ],
                        });
                        done();
                    },
                });
            });
            test("contains remote image", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Sint quo sunt maxime.",
                                "![](https://example.com/image.png)",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "[[target]]",
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(7, 4));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        // remote images should be unmodified
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "![](https://example.com/image.png)",
                            ],
                        });
                        done();
                    },
                });
            });
            test("with alias", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "[[my note alias|target]]",
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                        });
                        done();
                    },
                });
            });
            test("with xvault", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        // Creating a note of the same name in multiple vaults to check that it gets the right one
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[1],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: "Voluptatem possimus harum nisi.",
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `[[dendron://${common_all_1.VaultUtils.getName(vaults[1])}/target]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: ["Voluptatem possimus harum nisi."],
                        });
                        done();
                    },
                });
            });
            test("with header", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Voluptatem possimus harum nisi.",
                                "",
                                "# Numquam occaecati",
                                "",
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `[[target#numquam-occaecati]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(7, 12));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: ["Voluptatem possimus harum nisi."],
                        });
                        done();
                    },
                });
            });
            test("with block anchor", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Voluptatem possimus harum nisi.",
                                "",
                                "# Numquam occaecati",
                                "",
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima. ^my-anchor",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `[[target#^my-anchor]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: ["Voluptatem possimus harum nisi.", "Numquam occaecati"],
                        });
                        done();
                    },
                });
            });
            test("with everything", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[1],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Voluptatem possimus harum nisi.",
                                "",
                                "# Numquam occaecati",
                                "",
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: "Voluptatem possimus harum nisi.",
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `[[My note: with an alias|dendron://${common_all_1.VaultUtils.getName(vaults[1])}/target#numquam-occaecati]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: ["Voluptatem possimus harum nisi."],
                        });
                        done();
                    },
                });
            });
            (0, mocha_1.describe)("multiple notes & xvault link", () => {
                test("non-xvault link resolves to same vault", (done) => {
                    let note;
                    (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                        ctx,
                        preSetupHook: async (opts) => {
                            note = await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupMultiVaultSameFname(opts);
                        },
                        onInit: async () => {
                            const editor = await WSUtils_1.WSUtils.openNote(note);
                            editor.selection = testUtilsv2_1.LocationTestUtils.getPresetWikiLinkSelection({
                                line: 7,
                            });
                            const hover = await provideForNote(editor);
                            (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                                body: hover.contents[0].value,
                                match: ["vault 1"],
                                nomatch: ["vault 0", "the test note"],
                            })).toBeTruthy();
                            done();
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
                        onInit: async () => {
                            const editor = await WSUtils_1.WSUtils.openNote(note);
                            const provider = new ReferenceHoverProvider_1.default();
                            const hover = await provider.provideHover(editor.document, new vscode.Position(8, 4));
                            (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                                body: hover.contents[0].value,
                                match: ["vault 0"],
                                nomatch: ["vault 1", "the test note"],
                            })).toBeTruthy();
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
                        onInit: async () => {
                            const editor = await WSUtils_1.WSUtils.openNote(note);
                            const provider = new ReferenceHoverProvider_1.default();
                            const hover = await provider.provideHover(editor.document, new vscode.Position(9, 4));
                            (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                                body: hover.contents[0].value,
                                match: ["vault 1"],
                                nomatch: ["vault 0", "the test note"],
                            })).toBeTruthy();
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
                        onInit: async () => {
                            const editor = await WSUtils_1.WSUtils.openNote(note);
                            const provider = new ReferenceHoverProvider_1.default();
                            const hover = await provider.provideHover(editor.document, new vscode.Position(10, 4));
                            (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                                body: hover.contents.join(""),
                                match: ["eggs", "vaultThree", "missing"],
                                nomatch: [
                                    "vault 0",
                                    "vault 1",
                                    "vault1",
                                    "vault2",
                                    "the test note",
                                ],
                            })).toBeTruthy();
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
                        onInit: async () => {
                            const editor = await WSUtils_1.WSUtils.openNote(note);
                            const provider = new ReferenceHoverProvider_1.default();
                            const hover = await provider.provideHover(editor.document, new vscode.Position(11, 4));
                            (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                                body: hover.contents.join(""),
                                match: ["vault3", "does not exist"],
                                nomatch: [
                                    "vault 0",
                                    "vault 1",
                                    "vault1",
                                    "vault2",
                                    "the test note",
                                ],
                            })).toBeTruthy();
                            done();
                        },
                    });
                });
            });
        });
        (0, mocha_1.describe)("reference", () => {
            test("basic", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "![[target]]",
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                        });
                        done();
                    },
                });
            });
            test("with xvault", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        // Creating a note of the same name in multiple vaults to check that it gets the right one
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[1],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: "Voluptatem possimus harum nisi.",
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `![[dendron://${common_all_1.VaultUtils.getName(vaults[1])}/target]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: ["Voluptatem possimus harum nisi."],
                        });
                        done();
                    },
                });
            });
            test("with header", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Voluptatem possimus harum nisi.",
                                "",
                                "# Numquam occaecati",
                                "",
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `![[target#numquam-occaecati]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: ["Voluptatem possimus harum nisi."],
                        });
                        done();
                    },
                });
            });
            test("with block anchor", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Voluptatem possimus harum nisi.",
                                "",
                                "# Numquam occaecati",
                                "",
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima. ^my-anchor",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `![[target#^my-anchor]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: ["Voluptatem possimus harum nisi.", "Numquam occaecati"],
                        });
                        done();
                    },
                });
            });
            test("with range", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "target",
                            body: [
                                "Voluptatem possimus harum nisi.",
                                "",
                                "# Numquam occaecati",
                                "",
                                "Sint quo sunt maxime.",
                                "",
                                "Nisi nam dolorem qui ut minima. ^my-anchor",
                                "",
                                "Ut quo eius laudantium.",
                            ].join("\n"),
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: `![[target#numquam-occaecati:#^my-anchor]]`,
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const hover = await provideForNote(editor);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Numquam occaecati",
                                "Sint quo sunt maxime.",
                                "Nisi nam dolorem qui ut minima.",
                            ],
                            nomatch: [
                                "Voluptatem possimus harum nisi.",
                                "Ut quo eius laudantium.",
                            ],
                        });
                        done();
                    },
                });
            });
        });
        test("hashtag", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "tags.foo.test",
                        body: "this is tag foo.test",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "source",
                        body: "#foo.test",
                    });
                },
                onInit: async ({ vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNoteByPath({
                        vault: vaults[0],
                        fname: "source",
                    });
                    const provider = new ReferenceHoverProvider_1.default();
                    const hover = await provider.provideHover(editor.document, new vscode.Position(7, 6));
                    (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                    await common_test_utils_1.AssertUtils.assertInString({
                        body: hover.contents[0].value,
                        match: ["this is tag foo.test"],
                    });
                    done();
                },
            });
        });
        test("hashtags are ignored when disabled", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "tags.foo.test",
                        body: "this is tag foo.test",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "source",
                        body: "#foo.test",
                    });
                },
                modConfigCb: (config) => {
                    config.workspace.enableHashTags = false;
                    return config;
                },
                onInit: async ({ vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNoteByPath({
                        vault: vaults[0],
                        fname: "source",
                    });
                    const provider = new ReferenceHoverProvider_1.default();
                    const hover = await provider.provideHover(editor.document, new vscode.Position(7, 6));
                    (0, testUtilsv2_1.expect)(hover).toBeFalsy();
                    done();
                },
            });
        });
        test("user tag", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "user.test.mctestface",
                        body: "this is user test.mctestface",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "source",
                        body: "@test.mctestface",
                    });
                },
                onInit: async ({ vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNoteByPath({
                        vault: vaults[0],
                        fname: "source",
                    });
                    const provider = new ReferenceHoverProvider_1.default();
                    const hover = await provider.provideHover(editor.document, new vscode.Position(7, 6));
                    (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                    await common_test_utils_1.AssertUtils.assertInString({
                        body: hover.contents[0].value,
                        match: ["this is user test.mctestface"],
                    });
                    done();
                },
            });
        });
        test("user tags are ignored when disabled", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "user.test.mctestface",
                        body: "this is user test.mctestface",
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "source",
                        body: "@test.mctestface",
                    });
                },
                modConfigCb: (config) => {
                    config.workspace.enableUserTags = false;
                    return config;
                },
                onInit: async ({ vaults }) => {
                    const editor = await WSUtils_1.WSUtils.openNoteByPath({
                        vault: vaults[0],
                        fname: "source",
                    });
                    const provider = new ReferenceHoverProvider_1.default();
                    const hover = await provider.provideHover(editor.document, new vscode.Position(7, 6));
                    (0, testUtilsv2_1.expect)(hover).toBeFalsy();
                    done();
                },
            });
        });
        (0, mocha_1.describe)("frontmatter tags", () => {
            test("single tag", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "tags.foo.test",
                            body: "this is tag foo.test",
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            props: {
                                tags: "foo.test",
                            },
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(6, 10));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: ["this is tag foo.test"],
                        });
                        done();
                    },
                });
            });
            test("multiple tags", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "tags.foo.test",
                            body: "this is tag foo.test",
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "tags.foo.bar",
                            body: "this is the wrong tag",
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "tags.foo.baz",
                            body: "this is the wrong tag",
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            props: {
                                tags: ["foo.bar", "foo.test", "foo.baz"],
                            },
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(8, 4));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: ["this is tag foo.test"],
                        });
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("non-note", () => {
            test("image", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await fs_extra_1.default.ensureFile(path_1.default.join(wsRoot, common_all_1.VaultUtils.getName(vaults[0]), "assets", "image.png"));
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "![[/assets/image.png]]",
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(7, 4));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents.join(""),
                            match: ["[", "]", "(", "/assets/image.png", ")"],
                        });
                        done();
                    },
                });
            });
            test("hyperlink", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "![[http://example.com]]",
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(7, 4));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents.join(""),
                            match: ["[", "]", "(", "http://example.com", ")"],
                        });
                        done();
                    },
                });
            });
            test("email", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            vault: vaults[0],
                            wsRoot,
                            fname: "source",
                            body: "![[mailto:user@example.com]]",
                        });
                    },
                    onInit: async ({ vaults }) => {
                        const editor = await WSUtils_1.WSUtils.openNoteByPath({
                            vault: vaults[0],
                            fname: "source",
                        });
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(7, 4));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents.join(""),
                            match: ["[", "]", "(", "mailto:user@example.com", ")"],
                        });
                        done();
                    },
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("GIVEN link to non-existent note", {}, () => {
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "source",
                        body: ["[[foo.bar.baz]]", "[[foo.bar..baz]]"].join("\n"),
                    });
                    await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
                });
                (0, mocha_1.describe)("WHEN filename is valid", () => {
                    const position = new vscode.Position(7, 4);
                    test("THEN display message to create it with go to note", async () => {
                        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, position);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents.join(""),
                            match: [
                                'Note foo.bar.baz is missing, use "Dendron: Go to Note" command to create it.',
                            ],
                        })).toBeTruthy();
                    });
                });
                (0, mocha_1.describe)("WHEN filename is invalid", () => {
                    const position = new vscode.Position(8, 4);
                    test("THEN display invalid filename warning and suggestion", async () => {
                        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, position);
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents[0].value,
                            match: [
                                "Note `foo.bar..baz` is missing, and the filename is invalid for the following reason:\n\n `Hierarchies cannot be empty strings`.\n\n Maybe you meant `foo.bar.baz`?",
                            ],
                        })).toBeTruthy();
                    });
                });
            });
            (0, testUtilsV3_1.describeSingleWS)("WHEN used on a link to a non-note file", { ctx }, () => {
                (0, mocha_1.before)(async () => {
                    const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    await fs_extra_1.default.writeFile(path_1.default.join(wsRoot, "test.txt"), "Et nam velit laboriosam.");
                    const note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "source",
                        body: ["[[test.txt]]", "[[test.txt#L1]]"].join("\n"),
                    });
                    await WSUtils_1.WSUtils.openNote(note);
                });
                test("THEN displays message to open it with the default app", async () => {
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const provider = new ReferenceHoverProvider_1.default();
                    const hover = await provider.provideHover(editor.document, new vscode.Position(7, 4));
                    (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                        body: hover.contents.join(""),
                        match: ["test.txt"],
                    })).toBeTruthy();
                });
                (0, mocha_1.describe)("AND the link has a line anchor", () => {
                    test("THEN displays message to open it with the default app", async () => {
                        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                        const provider = new ReferenceHoverProvider_1.default();
                        const hover = await provider.provideHover(editor.document, new vscode.Position(8, 4));
                        (0, testUtilsv2_1.expect)(hover).toBeTruthy();
                        (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                            body: hover.contents.join(""),
                            match: ["test.txt"],
                            nomatch: ["L6"],
                        })).toBeTruthy();
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=ReferenceHoverProvider.test.js.map