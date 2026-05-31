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
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const CopyNoteRef_1 = require("../../commands/CopyNoteRef");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("CopyNoteRef", function () {
    (0, mocha_1.describe)("WHEN referencing a header", () => {
        const preSetupHook = async (opts) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
            const rootName = "bar";
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: `${rootName}`,
                body: "## Foo\nfoo text\n## Header\n Header text",
                vault: opts.vaults[0],
                props: {
                    id: `${rootName}`,
                },
                wsRoot: opts.wsRoot,
            });
        };
        (0, mocha_1.describe)("WHEN enableSmartRef is true by default", () => {
            (0, testUtilsV3_1.describeMultiWS)("AND WHEN with header selected", {
                preSetupHook,
                timeout: 5e3,
            }, () => {
                test("THEN generate note ref", async () => {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.getNoteMeta("bar")).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(7, 0, 7, 12);
                    const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                    (0, testUtilsv2_1.expect)(link).toEqual(`![[bar#foo]]`);
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("AND WHEN with partial selection", {
                preSetupHook,
                timeout: 5e3,
            }, () => {
                test("THEN generate note ref", async () => {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.getNoteMeta("bar")).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(7, 0, 7, 4);
                    const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                    (0, testUtilsv2_1.expect)(link).toEqual(`![[bar#foo]]`);
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("AND WHEN no next header", {
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                    const rootName = "bar";
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: `${rootName}`,
                        body: "## Foo\nfoo text\n",
                        vault: opts.vaults[0],
                        props: {
                            id: `${rootName}`,
                        },
                        wsRoot: opts.wsRoot,
                    });
                },
                timeout: 5e3,
            }, () => {
                test("THEN generate note ref", async () => {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.getNoteMeta("bar")).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(7, 0, 7, 12);
                    const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                    (0, testUtilsv2_1.expect)(link).toEqual(`![[bar#foo]]`);
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("AND WHEN existing block anchor selection", {
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                    const rootName = "bar";
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: `${rootName}`,
                        body: [
                            "Sint est quis sint sed.",
                            "Dicta vel nihil tempora. ^test-anchor",
                            "",
                            "A est alias unde quia quas.",
                            "Laborum corrupti porro iure.",
                            "",
                            "Id perspiciatis est adipisci.",
                        ].join("\n"),
                        vault: opts.vaults[0],
                        props: {
                            id: `${rootName}`,
                        },
                        wsRoot: opts.wsRoot,
                    });
                },
                timeout: 5e3,
            }, () => {
                test("THEN generate note ref", async () => {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.getNoteMeta("bar")).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(8, 0, 8, 0);
                    const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                    (0, testUtilsv2_1.expect)(link).toEqual("![[bar#^test-anchor]]");
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("AND WHEN generated block anchors", {
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                    const rootName = "bar";
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: `${rootName}`,
                        body: [
                            "Sint est quis sint sed.",
                            "Dicta vel nihil tempora. ^test-anchor",
                            "",
                            "A est alias unde quia quas.",
                            "Laborum corrupti porro iure.",
                            "",
                            "Id perspiciatis est adipisci.",
                        ].join("\n"),
                        vault: opts.vaults[0],
                        props: {
                            id: `${rootName}`,
                        },
                        wsRoot: opts.wsRoot,
                    });
                },
                timeout: 5e3,
            }, () => {
                test("THEN generate note ref", async () => {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.getNoteMeta("bar")).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(8, 0, 11, 0);
                    const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                    // make sure the link is correct
                    (0, testUtilsv2_1.expect)(link.startsWith("![[bar#^test-anchor:#^"));
                    (0, testUtilsv2_1.expect)(link.endsWith("]]"));
                    // make sure we only added 1 block anchor (there should be 2 now)
                    common_test_utils_1.AssertUtils.assertTimesInString({
                        body: editor.document.getText(),
                        match: [[2, /\^[a-zA-Z0-9-_]+/]],
                    });
                    // make sure the anchor in the link has been inserted into the document
                    const anchor = getAnchorsFromLink(link, 2)[1];
                    common_test_utils_1.AssertUtils.assertTimesInString({
                        body: editor.document.getText(),
                        match: [[1, anchor]],
                    });
                });
            });
        });
    });
    (0, mocha_1.describe)("GIVEN multi vault", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN xvault link when allowed in config", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setWorkspaceProp(config, "enableXVaultWikiLink", true);
                return config;
            },
            timeout: 5e3,
        }, () => {
            test("THEN create xvault link", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "foo.md");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                (0, testUtilsv2_1.expect)(link).toEqual("![[dendron://vault1/foo]]");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("no xvault link when disabled in config", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setWorkspaceProp(config, "enableXVaultWikiLink", false);
                return config;
            },
        }, () => {
            test("THEN create xvault link", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "foo.md");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                (0, testUtilsv2_1.expect)(link).toEqual("![[foo]]");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("AND WHEN reference entire note", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            timeout: 5e3,
        }, () => {
            test("THEN generate note to note", async () => {
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const note = (await engine.getNoteMeta("foo")).data;
                await WSUtils_1.WSUtils.openNote(note);
                const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                (0, testUtilsv2_1.expect)(link).toEqual("![[foo]]");
            });
        });
        (0, mocha_1.describe)("AND WHEN reference with config", () => {
            (0, testUtilsV3_1.describeMultiWS)("AND WHEN with header selected", {
                preSetupHook: async (opts) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                    const rootName = "bar";
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: `${rootName}`,
                        body: "## Foo\nfoo text\n## Header\n Header text",
                        vault: opts.vaults[0],
                        props: {
                            id: `${rootName}`,
                        },
                        wsRoot: opts.wsRoot,
                    });
                },
            }, () => {
                test("THEN generate note ref", async () => {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const note = (await engine.getNoteMeta("bar")).data;
                    const editor = await WSUtils_1.WSUtils.openNote(note);
                    editor.selection = new vscode.Selection(7, 0, 7, 12);
                    const link = await new CopyNoteRef_1.CopyNoteRefCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                    (0, testUtilsv2_1.expect)(link).toEqual("![[bar#foo]]");
                });
            });
        });
    });
    function getAnchorsFromLink(link, expectedCount) {
        const anchors = link.match(/\^[a-z0-9A-Z-_]+/g);
        (0, testUtilsv2_1.expect)(anchors).toBeTruthy();
        if (!lodash_1.default.isUndefined(expectedCount))
            (0, testUtilsv2_1.expect)(anchors.length).toEqual(expectedCount);
        for (const anchor of anchors) {
            (0, testUtilsv2_1.expect)(anchor.length > 0).toBeTruthy();
        }
        return anchors;
    }
});
//# sourceMappingURL=CopyNoteRef.test.js.map