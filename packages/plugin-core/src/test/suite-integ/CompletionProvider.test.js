"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const vscode_1 = require("vscode");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const completionProvider_1 = require("../../features/completionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("completionProvider", function () {
    (0, testUtilsV3_1.describeMultiWS)("wikilink", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "test",
                vault: vaults[1],
                wsRoot,
            });
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
        },
    }, () => {
        test("THEN provide completions", async () => {
            const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // Open a note, add [[]]
            await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                fname: "root",
                vault: vaults[1],
            }))[0]);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
            await editor.edit((editBuilder) => {
                editBuilder.insert(new vscode_1.Position(7, 0), "[[]]");
            });
            // have the completion provider complete this wikilink
            const compList = await (0, completionProvider_1.provideCompletionItems)(editor.document, new vscode_1.Position(7, 2));
            (0, testUtilsv2_1.expect)(compList).toBeTruthy();
            // Suggested top level notes
            (0, testUtilsv2_1.expect)(compList.items.length).toEqual(6);
            const results = await Promise.all(compList.items.map(async (item) => {
                return engine.findNotesMeta({ fname: item.label });
            }));
            results.forEach((result) => {
                (0, testUtilsv2_1.expect)(result.length > 0).toBeTruthy();
            });
            // check that same vault items are sorted before other items
            const sortedItems = lodash_1.default.sortBy(compList?.items, (item) => item.sortText || item.label);
            const testIndex = lodash_1.default.findIndex(sortedItems, (item) => item.label === "test");
            (0, testUtilsv2_1.expect)(testIndex !== -1 && testIndex < 2).toBeTruthy();
            // Check that xvault links were generated where needed, and only where needed.
            // Using root notes since they are in every vault.
            const rootItems = lodash_1.default.filter(compList?.items, (item) => item.label === "root");
            for (const item of rootItems) {
                if (item.detail === common_all_1.VaultUtils.getName(vaults[1])) {
                    // don't need an xvault link, should be a regular one
                    (0, testUtilsv2_1.expect)(item.insertText).toEqual(item.label);
                    (0, testUtilsv2_1.expect)(item.insertText.startsWith(common_all_1.CONSTANTS.DENDRON_DELIMETER)).toBeFalsy();
                }
                else {
                    // does need an xvault link
                    (0, testUtilsv2_1.expect)(item.insertText.startsWith(common_all_1.CONSTANTS.DENDRON_DELIMETER)).toBeTruthy();
                }
            }
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN hashtag", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "tags.foo",
                vault: vaults[1],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "tags.bar",
                vault: vaults[1],
                wsRoot,
            });
        },
    }, () => {
        test("THEN provide correct completion", async () => {
            const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // Open a note, add [[]]
            await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                fname: "root",
                vault: vaults[1],
            }))[0]);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
            await editor.edit((editBuilder) => {
                editBuilder.insert(new vscode_1.Position(7, 0), "#");
            });
            // have the completion provider complete this wikilink
            const items = await (0, completionProvider_1.provideCompletionItems)(editor.document, new vscode_1.Position(7, 1));
            (0, testUtilsv2_1.expect)(items).toBeTruthy();
            // Suggested all the notes
            (0, testUtilsv2_1.expect)(items.items.length).toEqual(2);
            const results = await Promise.all(items.items.map(async (item) => {
                return engine.findNotesMeta({
                    fname: `${common_all_1.TAGS_HIERARCHY}${item.label}`,
                });
            }));
            results.forEach((result) => {
                (0, testUtilsv2_1.expect)(result.length > 0).toBeTruthy();
                (0, testUtilsv2_1.expect)(items?.items[0].insertText).toEqual("bar");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN hashtag that's in a sentence", {
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "tags.foo",
                vault: vaults[1],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "tags.bar",
                vault: vaults[1],
                wsRoot,
            });
        },
    }, () => {
        test("THEN provide correct completions", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // Open a note, add [[]]
            await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                fname: "root",
                vault: vaults[1],
            }))[0]);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
            await editor.edit((editBuilder) => {
                editBuilder.insert(new vscode_1.Position(7, 0), "Lorem ipsum #");
            });
            // have the completion provider complete this wikilink
            const compList = await (0, completionProvider_1.provideCompletionItems)(editor.document, new vscode_1.Position(7, 13));
            const items = compList?.items;
            (0, testUtilsv2_1.expect)(items).toBeTruthy();
            // Suggested all the notes
            (0, testUtilsv2_1.expect)(items.length).toEqual(2);
            const results = await Promise.all(items.map(async (item) => {
                return engine.findNotesMeta({
                    fname: `${common_all_1.TAGS_HIERARCHY}${item.label}`,
                });
            }));
            results.forEach((result) => {
                (0, testUtilsv2_1.expect)(result.length > 0).toBeTruthy();
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("user tag", {
        timeout: 10e6,
        preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "user.foo",
                vault: vaults[1],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "user.bar",
                vault: vaults[1],
                wsRoot,
            });
        },
    }, () => {
        (0, mocha_1.describe)("WHEN only @ symbol", () => {
            test("THEN provide all completions", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                    fname: "root",
                    vault: vaults[1],
                }))[0]);
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode_1.Position(7, 0), "@");
                });
                // have the completion provider complete this wikilink
                const compList = await (0, completionProvider_1.provideCompletionItems)(editor.document, new vscode_1.Position(7, 1));
                const items = compList?.items;
                (0, testUtilsv2_1.expect)(items).toBeTruthy();
                // Suggested all the notes
                (0, testUtilsv2_1.expect)(items.length).toEqual(2);
                const results = await Promise.all(items.map(async (item) => {
                    return engine.findNotesMeta({
                        fname: `${common_all_1.USERS_HIERARCHY}${item.label}`,
                    });
                }));
                results.forEach((result) => {
                    (0, testUtilsv2_1.expect)(result.length > 0).toBeTruthy();
                    (0, testUtilsv2_1.expect)(items[0].insertText).toEqual("bar");
                });
            });
        });
        (0, mocha_1.describe)("WHEN a few characters typed", () => {
            test("THEN provide specific completion", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                    fname: "root",
                    vault: vaults[1],
                }))[0]);
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode_1.Position(7, 0), "@ba");
                });
                // have the completion provider complete this wikilink
                const compList = await (0, completionProvider_1.provideCompletionItems)(editor.document, new vscode_1.Position(7, 1));
                const items = compList?.items;
                // Suggested all the notes
                (0, testUtilsv2_1.expect)(items.length).toEqual(1);
                (0, testUtilsv2_1.expect)(items[0].insertText).toEqual("bar");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN completing a wikilink without closing brackets", {}, () => {
        let items;
        (0, mocha_1.before)(async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                fname: "root",
                vault: vaults[1],
            }))[0]);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
            await editor.edit((editBuilder) => {
                editBuilder.insert(new vscode_1.Position(7, 0), "Commodi [[ nam");
            });
            const compList = await (0, completionProvider_1.provideCompletionItems)(editor.document, new vscode_1.Position(7, 10));
            items = compList?.items;
        });
        test("THEN it finds completions", () => {
            (0, testUtilsv2_1.expect)(items?.length).toEqual(3);
        });
        test("THEN it doesn't erase any text following the wikilink", async () => {
            for (const item of items) {
                const range = item.range;
                // Since there's no text, start and end of range is at the same place.
                // The end doesn't go over the following text to avoid deleting them, since those are not part of the wikilink.
                (0, testUtilsv2_1.expect)(range.start.character).toEqual(10);
                (0, testUtilsv2_1.expect)(range.end.character).toEqual(10);
            }
        });
        test("THEN it adds the closing brackets", async () => {
            for (const item of items) {
                (0, testUtilsv2_1.expect)(item.insertText.toString().endsWith("]]")).toBeTruthy();
            }
        });
    });
    (0, testUtilsV3_1.runTestButSkipForWindows)()("blocks", () => {
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN doesn't provide outside wikilink", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // Open a note, add [[]]
                await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                    fname: "root",
                    vault: vaults[0],
                }))[0]);
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode_1.Position(7, 0), "^");
                });
                // have the completion provider complete this wikilink
                const items = await (0, completionProvider_1.provideBlockCompletionItems)(editor.document, new vscode_1.Position(7, 1));
                (0, testUtilsv2_1.expect)(items).toEqual(undefined);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN paragraphs", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: vaults[0],
                    wsRoot,
                    fname: "test",
                    body: [
                        "Et et quam culpa.",
                        "",
                        "Cumque molestiae qui deleniti.",
                        "Eius odit commodi harum.",
                        "",
                        "Sequi ut non delectus tempore.",
                    ].join("\n"),
                });
            },
        }, () => {
            test("THEN provide correct completions", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // Open a note, add [[^]]
                await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                    fname: "test",
                    vault: vaults[0],
                }))[0]);
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode_1.Position(7, 0), "[[^]]");
                });
                // have the completion provider complete this wikilink
                const items = await (0, completionProvider_1.provideBlockCompletionItems)(editor.document, new vscode_1.Position(7, 3));
                (0, testUtilsv2_1.expect)(items).toBeTruthy();
                (0, testUtilsv2_1.expect)(items?.length).toEqual(3);
                // check that the
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN nested list", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: vaults[0],
                    wsRoot,
                    fname: "test",
                    body: [
                        "Et et quam culpa.",
                        "",
                        "* Cumque molestiae qui deleniti.",
                        "* Eius odit commodi harum.",
                        "  * Sequi ut non delectus tempore.",
                        "  * In delectus quam sunt unde.",
                        "* Quasi ex debitis aut sed.",
                        "",
                        "Perferendis officiis ut non.",
                    ].join("\n"),
                });
            },
        }, () => {
            test("THEN provide correct completions", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // Open a note, add [[^]]
                await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                    fname: "test",
                    vault: vaults[0],
                }))[0]);
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode_1.Position(7, 0), "[[^]]");
                });
                // have the completion provider complete this wikilink
                const items = await (0, completionProvider_1.provideBlockCompletionItems)(editor.document, new vscode_1.Position(7, 3));
                (0, testUtilsv2_1.expect)(items).toBeTruthy();
                (0, testUtilsv2_1.expect)(items?.length).toEqual(8);
            });
        });
        // TODO: flaky
        test.skip("provides headers for other files", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                onInit: async ({ vaults, engine }) => {
                    // Open a note, add [[test2#]]
                    await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                        fname: "test",
                        vault: vaults[0],
                    }))[0]);
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    await editor.edit((editBuilder) => {
                        editBuilder.insert(new vscode_1.Position(7, 0), "[[test2#]]");
                    });
                    // have the completion provider complete this wikilink
                    const items = await (0, completionProvider_1.provideBlockCompletionItems)(editor.document, new vscode_1.Position(7, 3));
                    (0, testUtilsv2_1.expect)(items).toBeTruthy();
                    (0, testUtilsv2_1.expect)(items?.length).toEqual(2);
                    (0, testUtilsv2_1.expect)(items[0].insertText).toEqual("et-et-quam-culpa");
                    (0, testUtilsv2_1.expect)(items[1].insertText).toEqual("quasi-ex-debitis-aut-sed");
                    done();
                },
                preSetupHook: async ({ wsRoot, vaults }) => {
                    common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "test2",
                        body: [
                            "## Et et quam culpa.",
                            "",
                            "* Cumque molestiae qui deleniti.",
                            "* Eius odit commodi harum.",
                            "  * Sequi ut non delectus tempore.",
                            "  * In delectus quam sunt unde.",
                            "",
                            "## Quasi ex debitis aut sed.",
                            "",
                            "Perferendis officiis ut non.",
                        ].join("\n"),
                    });
                    common_test_utils_1.NoteTestUtilsV4.createNote({
                        vault: vaults[0],
                        wsRoot,
                        fname: "test",
                    });
                },
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("GIVEN other files with block anchors", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: vaults[0],
                    wsRoot,
                    fname: "test2",
                    body: [
                        "Et et quam culpa.",
                        "",
                        "* Cumque molestiae qui deleniti.",
                        "* Eius odit commodi harum. ^item-2",
                        "  * Sequi ut non delectus tempore.",
                        "  * In delectus quam sunt unde. ^item-4",
                        "",
                        "Quasi ex debitis aut sed.",
                        "",
                        "Perferendis officiis ut non. ^last-paragraph",
                    ].join("\n"),
                });
                common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: vaults[0],
                    wsRoot,
                    fname: "test",
                });
            },
        }, () => {
            test("THEN provide correct completions", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // Open a note, add [[test2#^]]
                await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                    fname: "test",
                    vault: vaults[0],
                }))[0]);
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode_1.Position(7, 0), "[[test2#^]]");
                });
                // have the completion provider complete this wikilink
                const items = await (0, completionProvider_1.provideBlockCompletionItems)(editor.document, new vscode_1.Position(7, 3));
                (0, testUtilsv2_1.expect)(items).toBeTruthy();
                (0, testUtilsv2_1.expect)(items?.length).toEqual(3);
                (0, testUtilsv2_1.expect)(items[0].insertText).toEqual("item-2");
                (0, testUtilsv2_1.expect)(items[1].insertText).toEqual("item-4");
                (0, testUtilsv2_1.expect)(items[2].insertText).toEqual("last-paragraph");
            });
        });
        function hasNoEditContaining(item, newTextSubString) {
            (0, testUtilsv2_1.expect)(lodash_1.default.find(item.additionalTextEdits, (edit) => edit.newText.indexOf(newTextSubString) !== -1)).toEqual(undefined);
        }
        (0, testUtilsV3_1.describeMultiWS)("", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: vaults[0],
                    wsRoot,
                    fname: "test",
                    body: [
                        "# Et et quam culpa. ^header",
                        "",
                        "Ullam vel eius reiciendis. ^paragraph",
                        "",
                        "* Cumque molestiae qui deleniti. ^item1",
                        "* Eius odit commodi harum. ^item2",
                        "  * Sequi ut non delectus tempore. ^item3",
                        "",
                        "^list",
                        "",
                        "| Sapiente | accusamus |",
                        "|----------|-----------|",
                        "| Laborum  | libero    |",
                        "| Ullam    | optio     | ^table",
                    ].join("\n"),
                });
            },
        }, () => {
            test("THEN provide correct completions", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // Open a note, add [[^]]
                await new WSUtilsV2_1.WSUtilsV2(ExtensionProvider_1.ExtensionProvider.getExtension()).openNote((await engine.findNotesMeta({
                    fname: "test",
                    vault: vaults[0],
                }))[0]);
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                await editor.edit((editBuilder) => {
                    editBuilder.insert(new vscode_1.Position(7, 0), "[[^]]");
                });
                // have the completion provider complete this wikilink
                const items = await (0, completionProvider_1.provideBlockCompletionItems)(editor.document, new vscode_1.Position(7, 3));
                // Check that the correct anchors were returned
                (0, testUtilsv2_1.expect)(items).toBeTruthy();
                (0, testUtilsv2_1.expect)(items.length).toEqual(7);
                (0, testUtilsv2_1.expect)(items[0].insertText).toEqual("#et-et-quam-culpa");
                (0, testUtilsv2_1.expect)(items[1].insertText).toEqual("#^paragraph");
                (0, testUtilsv2_1.expect)(items[2].insertText).toEqual("#^item1");
                (0, testUtilsv2_1.expect)(items[3].insertText).toEqual("#^item2");
                (0, testUtilsv2_1.expect)(items[4].insertText).toEqual("#^item3");
                (0, testUtilsv2_1.expect)(items[5].insertText).toEqual("#^list");
                (0, testUtilsv2_1.expect)(items[6].insertText).toEqual("#^table");
                // check that we're not trying to insert unnecessary anchors
                hasNoEditContaining(items[0], "et-et-quam-culpa");
                hasNoEditContaining(items[0], "^");
                hasNoEditContaining(items[1], "^paragraph");
                hasNoEditContaining(items[2], "^item1");
                hasNoEditContaining(items[3], "^item2");
                hasNoEditContaining(items[4], "^item3");
                hasNoEditContaining(items[5], "^list");
                hasNoEditContaining(items[6], "^table");
            });
        });
    });
});
//# sourceMappingURL=CompletionProvider.test.js.map