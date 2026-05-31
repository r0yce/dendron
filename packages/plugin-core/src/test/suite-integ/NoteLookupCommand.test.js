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
exports.expectQuickPick = expectQuickPick;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const assert_1 = __importDefault(require("assert"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const NoteLookupCommand_1 = require("../../commands/NoteLookupCommand");
const ButtonTypes_1 = require("../../components/lookup/ButtonTypes");
const constants_1 = require("../../components/lookup/constants");
const NotePickerUtils_1 = require("../../components/lookup/NotePickerUtils");
const utils_1 = require("../../components/lookup/utils");
const constants_2 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const stateService_1 = require("../../services/stateService");
const utils_2 = require("../../utils");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const workspace_1 = require("../../workspace");
const WSUtils_1 = require("../../WSUtils");
const testUtils_1 = require("../testUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const WSUtilsV2_1 = require("../../WSUtilsV2");
const stubVaultPick = (vaults) => {
    const vault = lodash_1.default.find(vaults, { fsPath: "vault1" });
    return sinon_1.default
        .stub(utils_1.PickerUtilsV2, "getOrPromptVaultForNewNote")
        .returns(Promise.resolve(vault));
};
function expectQuickPick(quickPick) {
    if (quickPick === undefined) {
        const message = "quickpick is undefined.";
        return {
            toIncludeFname: (_fname) => {
                assert_1.default.fail(message);
            },
            toNotIncludeFname: (_fname) => {
                assert_1.default.fail(message);
            },
            toBeEmpty: () => {
                assert_1.default.fail(message);
            },
        };
    }
    return {
        toIncludeFname: (fname) => {
            assert_1.default.ok(quickPick.items.some((item) => item.fname === fname), `Did not find item with fname='${fname}' in quick pick when expected to find it.`);
        },
        toNotIncludeFname: (fname) => {
            assert_1.default.ok(!quickPick.items.some((item) => item.fname === fname), `Found item with fname='${fname}' when expected NOT to find it.`);
        },
        toBeEmpty() {
            const errorMsg = `Expected quick pick to be empty but found ${quickPick.items.length}items: '${quickPick.items.map((item) => item.label)}'`;
            assert_1.default.ok(quickPick.items.length === 0, errorMsg);
        },
    };
}
function expectCreateNew({ item, fname, }) {
    if (item.label !== constants_1.CREATE_NEW_LABEL) {
        throw new Error(`Actual item='${JSON.stringify(item)}' did NOT have label='${constants_1.CREATE_NEW_LABEL}'`);
    }
    if (fname) {
        (0, testUtilsv2_1.expect)(item.fname).toEqual(fname);
    }
}
function getButtonByType(btnType, buttons) {
    return lodash_1.default.find(buttons, (button) => {
        return button.type === btnType;
    });
}
function getButtonsByTypeArray(typeArray, buttons) {
    return lodash_1.default.map(typeArray, (btnType) => {
        return getButtonByType(btnType, buttons);
    });
}
function getSelectionTypeButtons(buttons) {
    const [selection2linkBtn, selectionExtractBtn] = getButtonsByTypeArray(lodash_1.default.values(common_all_1.LookupSelectionTypeEnum), buttons);
    return { selection2linkBtn, selectionExtractBtn };
}
function getNoteTypeButtons(buttons) {
    const [journalBtn, scratchBtn, taskBtn] = getButtonsByTypeArray(lodash_1.default.values(common_all_1.LookupNoteTypeEnum), buttons);
    return { journalBtn, scratchBtn, taskBtn };
}
function getSplitTypeButtons(buttons) {
    const [horizontalSplitBtn] = getButtonsByTypeArray(lodash_1.default.values(ButtonTypes_1.LookupSplitTypeEnum), buttons);
    return { horizontalSplitBtn };
}
suite("NoteLookupCommand", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    const getTodayInScratchDateFormat = () => {
        const dateFormat = workspace_1.DendronExtension.configuration().get(constants_2.CONFIG["DEFAULT_SCRATCH_DATE_FORMAT"].key);
        const today = common_all_1.Time.now().toFormat(dateFormat);
        return today.split(".").slice(0, -1).join(".");
    };
    (0, mocha_1.describe)("enrichInputs", () => {
        test("edge, quickpick cleans up when hidden", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async () => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    const opts = await cmd.gatherInputs();
                    const out = cmd.enrichInputs(opts);
                    (0, testUtilsv2_1.expect)(engine_server_1.HistoryService.instance().subscribersv2.lookupProvider.length).toEqual(1);
                    // delicate test
                    setTimeout(async () => {
                        opts.quickpick.hide();
                        await out;
                        (0, testUtilsv2_1.expect)(engine_server_1.HistoryService.instance().subscribersv2.lookupProvider.length).toEqual(0);
                        cmd.cleanUp();
                        done();
                    }, 1000);
                    // await out;
                },
            });
        });
    });
    // NOTE: think these tests are wrong
    (0, mocha_1.describe)("updateItems", () => {
        test("empty querystring", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const opts = (await cmd.run({
                        noConfirm: true,
                        initialValue: "",
                    }));
                    (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(lodash_1.default.find(opts.quickpick.selectedItems, { fname: "root" }))).toBeTruthy();
                    (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(lodash_1.default.find(opts.quickpick.selectedItems, { fname: "foo" }))).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("star query", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const opts = (await cmd.run({
                        noConfirm: true,
                        initialValue: "*",
                    }));
                    (0, testUtilsv2_1.expect)(opts.quickpick.selectedItems.length).toEqual(6);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test(`WHEN partial match but not exact match THEN bubble up 'Create New'`, (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const opts = (await cmd.run({
                        noConfirm: true,
                        initialValue: "foo.ch",
                    }));
                    // Check that Create New comes first.
                    expectCreateNew({ item: opts.quickpick.selectedItems[0] });
                    // Check that its not just create new in the quick pick.
                    (0, testUtilsv2_1.expect)(opts.quickpick.selectedItems.length > 1).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("domain query with schema", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    await cmd.run({
                        noConfirm: true,
                        initialValue: "foo",
                    });
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    const actualNote = await WSUtils_1.WSUtils.getNoteFromDocument(editor.document);
                    const expectedNote = (await engine.getNote("foo")).data;
                    (0, testUtilsv2_1.expect)(actualNote).toEqual(expectedNote);
                    (0, testUtilsv2_1.expect)(actualNote.schema).toEqual({
                        moduleId: "foo",
                        schemaId: "foo",
                    });
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("child query with schema", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    await cmd.run({
                        noConfirm: true,
                        initialValue: "foo.ch1",
                    });
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    const actualNote = await WSUtils_1.WSUtils.getNoteFromDocument(editor.document);
                    const expectedNote = (await engine.getNote("foo.ch1")).data;
                    (0, testUtilsv2_1.expect)(actualNote).toEqual(expectedNote);
                    (0, testUtilsv2_1.expect)(actualNote.schema).toEqual({
                        moduleId: "foo",
                        schemaId: "ch1",
                    });
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("direct child filter", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_GRANDCHILD.create({
                        wsRoot,
                        vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        fname: "foo.ch2.gch1",
                        vault: vaults[0],
                        props: { stub: true },
                    });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const opts = (await cmd.run({
                        noConfirm: true,
                        initialValue: "foo.",
                        filterMiddleware: ["directChildOnly"],
                    }));
                    // Doesn't find grandchildren
                    (0, testUtilsv2_1.expect)(lodash_1.default.find(opts.quickpick.selectedItems, { fname: "foo.ch1.gch1" })).toEqual(undefined);
                    // Doesn't find stubs
                    (0, testUtilsv2_1.expect)(lodash_1.default.find(opts.quickpick.selectedItems, { fname: "foo.ch2" })).toEqual(undefined);
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(opts.quickpick.filterMiddleware)).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("picker has value of opened note by default", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const opts = (await cmd.run({ noConfirm: true }));
                    (0, testUtilsv2_1.expect)(opts.quickpick.value).toEqual("foo");
                    (0, testUtilsv2_1.expect)(lodash_1.default.first(opts.quickpick.selectedItems)?.fname).toEqual("foo");
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("schema suggestions basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    const vpath = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
                    fs_extra_1.default.removeSync(path_1.default.join(vpath, "foo.ch1.md"));
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const { controller, provider, quickpick } = await cmd.gatherInputs({
                        noteType: common_all_1.LookupNoteTypeEnum.journal,
                    });
                    quickpick.value = "foo.";
                    await provider.onUpdatePickerItems({
                        picker: quickpick,
                        token: controller.cancelToken.token,
                        // fuzzThreshold: controller.fuzzThreshold,
                    });
                    const schemaItem = lodash_1.default.pick(lodash_1.default.find(quickpick.items, { fname: "foo.ch1" }), ["fname", "schemaStub"]);
                    (0, testUtilsv2_1.expect)(schemaItem).toEqual({
                        fname: "foo.ch1",
                        schemaStub: true,
                    });
                    cmd.cleanUp();
                    done();
                },
            });
        });
    });
    async function runLookupTest(initialValue, assertions) {
        const cmd = new NoteLookupCommand_1.NoteLookupCommand();
        const out = await cmd.run({
            noConfirm: true,
            initialValue,
        });
        assertions(out);
        cmd.cleanUp();
    }
    /**
     * Notes to choose from (root.md excluded):
     *
     <pre>
     vault1/
     ├── bar.ch1.gch1.ggch1.md
     ├── bar.ch1.gch1.md
     ├── bar.ch1.md
     ├── bar.md
     ├── foo.ch1.gch1.ggch1.md
     ├── foo.ch1.gch1.md
     ├── foo.ch1.gch2.md
     ├── foo.ch1.md
     ├── foo.ch2.md
     ├── goo.ends-with-ch1.no-ch1-by-itself.md
     └── foo.md
     </pre>
     * */
    (0, testUtilsV3_1.describeMultiWS)("GIVEN default note lookup settings:", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupHierarchyForLookupTests({
                wsRoot,
                vaults,
            });
        },
        timeout: 5e3,
    }, () => {
        (0, mocha_1.describe)("WHEN running simple query", () => {
            test("THEN find the matching value", async () => {
                await runLookupTest("ends-with-ch1", (out) => {
                    expectQuickPick(out?.quickpick).toIncludeFname("goo.ends-with-ch1.no-ch1-by-itself");
                });
            });
        });
        (0, mocha_1.describe)("WHEN query end with a dot", () => {
            (0, mocha_1.describe)("WHEN query is `with-ch1.`", () => {
                test("THEN find partial match with in hierarchy and show its children", async () => {
                    await runLookupTest("with-ch1.", (out) => {
                        expectQuickPick(out?.quickpick).toIncludeFname("goo.ends-with-ch1.no-ch1-by-itself");
                        expectQuickPick(out?.quickpick).toNotIncludeFname("foo.ch1.gch1");
                    });
                });
            });
            (0, mocha_1.describe)("WHEN query is `ch1.gch1.`", () => {
                test("THEN finds direct match within hierarchy.", async () => {
                    await runLookupTest("ch1.gch1.", (out) => {
                        // Showing direct children of matches in different hierarchies:
                        expectQuickPick(out?.quickpick).toIncludeFname("bar.ch1.gch1.ggch1");
                        expectQuickPick(out?.quickpick).toIncludeFname("foo.ch1.gch1.ggch1");
                        // Not showing our own match
                        expectQuickPick(out?.quickpick).toNotIncludeFname("bar.ch1.gch1");
                    });
                });
            });
        });
        (0, mocha_1.describe)("extended search:", () => {
            test("WHEN running querying with exclusion THEN exclude unwanted but keep others", async () => {
                await runLookupTest("!bar ch1", (out) => {
                    expectQuickPick(out?.quickpick).toIncludeFname("foo.ch1");
                    expectQuickPick(out?.quickpick).toNotIncludeFname("bar.ch1");
                });
            });
            test("WHEN running `ends with query` THEN filter to values that end with desired query.", async () => {
                await runLookupTest("foo$", (out) => {
                    expectQuickPick(out?.quickpick).toIncludeFname("foo");
                    expectQuickPick(out?.quickpick).toNotIncludeFname("foo.ch1");
                });
            });
            test("WHEN running query with (|) THEN match both values", async () => {
                await runLookupTest("foo | bar", (out) => {
                    expectQuickPick(out?.quickpick).toIncludeFname("foo.ch1");
                    expectQuickPick(out?.quickpick).toIncludeFname("bar.ch1");
                });
            });
        });
        (0, mocha_1.describe)("WHEN user looks up a note without using a space where the query doesn't match the note's case", () => {
            test("THEN lookup result must cantain all matching values irrespective of case", async () => {
                await runLookupTest("bar.CH1", (out) => {
                    expectQuickPick(out?.quickpick).toIncludeFname("bar.ch1");
                });
            });
        });
    });
    (0, mocha_1.describe)("onAccept", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN new NODE", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
        }, () => {
            test("THEN create new item has name of quickpick value", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const opts = (await cmd.run({
                    noConfirm: true,
                    initialValue: "foobar",
                }));
                (0, testUtilsv2_1.expect)(opts.quickpick.selectedItems.length).toEqual(2);
                const createNewItem = lodash_1.default.first(opts.quickpick.selectedItems);
                const createNewWithTemplateItem = lodash_1.default.last(opts.quickpick.selectedItems);
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(createNewItem, ["id", "fname"])).toEqual({
                    id: "Create New",
                    fname: "foobar",
                });
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(createNewWithTemplateItem, ["id", "fname"])).toEqual({
                    id: "Create New with Template",
                    fname: "foobar",
                });
                (0, testUtilsv2_1.expect)((await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document))?.fname).toEqual("foobar");
            });
            test("AND create new with template", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const { vaults, engine } = extension.getDWorkspace();
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const mockQuickPick = (0, testUtils_1.createMockQuickPick)({
                    value: "foobarbaz",
                    selectedItems: [
                        NotePickerUtils_1.NotePickerUtils.createNewWithTemplateItem({
                            fname: "foobarbaz",
                        }),
                    ],
                });
                const lc = extension.lookupControllerFactory.create({
                    nodeType: "note",
                });
                const lp = extension.noteLookupProviderFactory.create("lookup", {
                    allowNewNote: true,
                    allowNewNoteWithTemplate: true,
                    noHidePickerOnAccept: false,
                });
                await lc.prepareQuickPick({
                    initialValue: "foobarbaz",
                    provider: lp,
                    placeholder: "",
                });
                cmd.controller = lc;
                cmd.provider = lp;
                const fooNote = (await engine.getNote("foo")).data;
                const getTemplateStub = sinon_1.default
                    .stub(cmd, "getTemplateForNewNote")
                    .returns(Promise.resolve(fooNote));
                mockQuickPick.showNote = async (uri) => {
                    return vscode.window.showTextDocument(uri);
                };
                await cmd.execute({
                    quickpick: mockQuickPick,
                    controller: lc,
                    provider: lp,
                    selectedItems: mockQuickPick.selectedItems,
                });
                const document = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document;
                const newNote = await extension.wsUtils.getNoteFromDocument(document);
                (0, testUtilsv2_1.expect)(newNote?.fname).toEqual("foobarbaz");
                (0, testUtilsv2_1.expect)(newNote?.body).toEqual(fooNote?.body);
                cmd.cleanUp();
                getTemplateStub.restore();
            });
            test("AND create new with template, but cancelled or nothing selected", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const { vaults, engine } = extension.getDWorkspace();
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const mockQuickPick = (0, testUtils_1.createMockQuickPick)({
                    value: "capers-are-not-berries",
                    selectedItems: [
                        NotePickerUtils_1.NotePickerUtils.createNewWithTemplateItem({
                            fname: "capers-are-not-berries",
                        }),
                    ],
                });
                const lc = extension.lookupControllerFactory.create({
                    nodeType: "note",
                });
                const lp = extension.noteLookupProviderFactory.create("lookup", {
                    allowNewNote: true,
                    allowNewNoteWithTemplate: true,
                    noHidePickerOnAccept: false,
                });
                await lc.prepareQuickPick({
                    initialValue: "capers-are-not-berries",
                    provider: lp,
                    placeholder: "",
                });
                cmd.controller = lc;
                cmd.provider = lp;
                const getTemplateStub = sinon_1.default
                    .stub(cmd, "getTemplateForNewNote")
                    .returns(Promise.resolve(undefined));
                mockQuickPick.showNote = async (uri) => {
                    return vscode.window.showTextDocument(uri);
                };
                const cmdSpy = sinon_1.default.spy(cmd, "acceptNewWithTemplateItem");
                await cmd.execute({
                    quickpick: mockQuickPick,
                    controller: lc,
                    provider: lp,
                    selectedItems: mockQuickPick.selectedItems,
                });
                const acceptNewWithTemplateItemOut = await cmdSpy.returnValues[0];
                // accept result is undefined
                (0, testUtilsv2_1.expect)(acceptNewWithTemplateItemOut).toEqual(undefined);
                // foobarbaz is not created if template selection is cancelled, or selection was empty.
                const maybeFooBarBazNotes = await engine.findNotes({
                    fname: "capers-are-not-berries",
                });
                (0, testUtilsv2_1.expect)(maybeFooBarBazNotes.length).toEqual(0);
                cmdSpy.restore();
                cmd.cleanUp();
                getTemplateStub.restore();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN a new note with .md in its name is created", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
        }, () => {
            test("THEN its title generation should not break", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const opts = (await cmd.run({
                    noConfirm: true,
                    initialValue: "learn.mdone.test",
                }));
                (0, testUtilsv2_1.expect)(opts.quickpick.selectedItems.length).toEqual(2);
                const createNewItem = lodash_1.default.first(opts.quickpick.selectedItems);
                const createNewWithTemplateItem = lodash_1.default.last(opts.quickpick.selectedItems);
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(createNewItem, ["id", "fname"])).toEqual({
                    id: "Create New",
                    fname: "learn.mdone.test",
                });
                (0, testUtilsv2_1.expect)(lodash_1.default.pick(createNewWithTemplateItem, ["id", "fname"])).toEqual({
                    id: "Create New with Template",
                    fname: "learn.mdone.test",
                });
                const note = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document);
                (0, testUtilsv2_1.expect)(note?.fname).toEqual("learn.mdone.test");
                (0, testUtilsv2_1.expect)(note?.title).toEqual("Test");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN user lookup a note where the query doesn't match the note's case in multi-vault setup ", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
        }, () => {
            test("THEN result must include note irresepective of casing", async () => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                const opts = (await cmd.run({
                    noConfirm: true,
                    initialValue: "FOOCH1",
                }));
                expectQuickPick(opts.quickpick).toIncludeFname("foo.ch1");
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN new node is stub", {
            ctx,
            preSetupHook: async ({ vaults, wsRoot }) => {
                const vault = engine_test_utils_1.TestEngineUtils.vault1(vaults);
                await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
                    vault,
                    wsRoot,
                });
            },
        }, () => {
            test("THEN a note is created and stub property is removed", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                const vault = engine_test_utils_1.TestEngineUtils.vault1(vaults);
                stubVaultPick(vaults);
                const opts = (await cmd.run({
                    noConfirm: true,
                    initialValue: "foo",
                }));
                (0, testUtilsv2_1.expect)(lodash_1.default.first(opts.quickpick.selectedItems)?.fname).toEqual("foo");
                const fooNote = (await engine.findNotesMeta({
                    fname: "foo",
                    vault,
                }))[0];
                (0, testUtilsv2_1.expect)(fooNote.stub).toBeFalsy();
            });
        });
        test("new domain", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    await cmd.run({
                        noConfirm: true,
                        initialValue: "bar",
                    });
                    const barFromEngine = (await engine.getNote("bar")).data;
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    const activeNote = await WSUtils_1.WSUtils.getNoteFromDocument(editor.document);
                    (0, testUtilsv2_1.expect)(activeNote).toEqual(barFromEngine);
                    const parent = (await engine.getNote(barFromEngine.parent)).data;
                    (0, testUtilsv2_1.expect)(common_all_1.DNodeUtils.isRoot(parent));
                    done();
                },
            });
        });
        test("regular multi-select, no pick new", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
                onInit: async ({ vaults, wsRoot }) => {
                    const vault = lodash_1.default.find(vaults, { fsPath: "vault2" });
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    sinon_1.default.stub(utils_1.PickerUtilsV2, "getVaultForOpenEditor").returns(vault);
                    const opts = (await cmd.run({
                        noConfirm: true,
                        initialValue: "foobar",
                        multiSelect: true,
                    }));
                    (0, testUtilsv2_1.expect)(opts.quickpick.selectedItems.length).toEqual(0);
                    (0, testUtilsv2_1.expect)(lodash_1.default.last(opts.quickpick.selectedItems)?.title).toNotEqual("Create New");
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.EngineTestUtilsV4.checkVault({
                        wsRoot,
                        vault: vault,
                        match: ["foobar.md"],
                    })).toBeTruthy();
                    done();
                },
            });
        });
        test("lookupConfirmVaultOnCreate = true, existing vault", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
                onInit: async ({ wsRoot, vaults }) => {
                    (0, testUtilsV3_1.withConfig)((config) => {
                        common_all_1.ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", true);
                        return config;
                    }, { wsRoot });
                    const fname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.fname;
                    const vault = lodash_1.default.find(vaults, { fsPath: "vault2" });
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    sinon_1.default
                        .stub(utils_1.PickerUtilsV2, "promptVault")
                        .returns(Promise.resolve(vault));
                    const { quickpick } = (await cmd.run({
                        noConfirm: true,
                        initialValue: fname,
                        fuzzThreshold: 1,
                    }));
                    // should have next pick
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(quickpick?.nextPicker)).toBeFalsy();
                    // One item for our file name and one each for `Create New`, `Create New with Template`
                    // are multiple vaults in this test.
                    (0, testUtilsv2_1.expect)(quickpick.selectedItems.length).toEqual(3);
                    (0, testUtilsv2_1.expect)(lodash_1.default.pick(quickpick.selectedItems[0], ["id", "vault"])).toEqual({
                        id: fname,
                        vault,
                    });
                    done();
                },
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN user creates new note with enableFullHierarchyNoteTitle == true", {
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setWorkspaceProp(config, "enableFullHierarchyNoteTitle", true);
                return config;
            },
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
        }, () => {
            test("THEN the new note title should reflect the full hierarchy name", async () => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd.run({
                    noConfirm: true,
                    initialValue: "one.two.three",
                });
                const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                const activeNote = await WSUtilsV2_1.WSUtilsV2.instance().getNoteFromDocument(editor.document);
                (0, testUtilsv2_1.expect)(activeNote?.title).toEqual("One Two Three");
            });
        });
        test("new node with schema template", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    await cmd.run({
                        initialValue: "bar.ch1",
                        noConfirm: true,
                    });
                    const document = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document;
                    const newNote = await WSUtils_1.WSUtils.getNoteFromDocument(document);
                    (0, testUtilsv2_1.expect)(lodash_1.default.trim(newNote.body)).toEqual("ch1 template");
                    (0, testUtilsv2_1.expect)(newNote?.tags).toEqual("tag-foo");
                    done();
                },
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a template note that lies in a different vault", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1
                const vault = vaults[0];
                // Template is in vault2
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    body: "food ch2 template",
                    fname: "template.ch2",
                    vault: vaults[1],
                });
                const template = {
                    id: "template.ch2",
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
                });
            },
        }, () => {
            test("THEN template body gets applied to new note FROM other vault", async () => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd.run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                });
                const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newNote = (await engine.findNotes({ fname: "food.ch2", vault: vaults[0] }))[0];
                (0, testUtilsv2_1.expect)(lodash_1.default.trim(newNote?.body)).toEqual("food ch2 template");
                cmd.cleanUp();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a template note that lies in a different vault using xvault notation", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1 and specifies template in vaultThree
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
                    id: `dendron://${common_all_1.VaultUtils.getName(vaults[2])}/template.ch2`,
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
                });
            },
        }, () => {
            test("THEN correct template body FROM vault referred to be xvault link gets applied to new note", async () => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd.run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                });
                const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newNote = (await engine.findNotes({ fname: "food.ch2", vault: vaults[0] }))[0];
                (0, testUtilsv2_1.expect)(lodash_1.default.trim(newNote?.body)).toEqual("food ch2 template in vaultThree");
                cmd.cleanUp();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a template note and there exists a stub with the same name", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1
                const vault = vaults[0];
                // Template is in vault1
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    body: "food ch2 template",
                    fname: "template.ch2",
                    vault,
                });
                // template.ch2 is now a stub in vault2
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    body: "food ch2 child note",
                    fname: "template.ch2.child",
                    vault: vaults[1],
                });
                const template = {
                    id: "template.ch2",
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
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
            test("THEN user does not get prompted with stub suggesstion and template note body gets applied to new note", async () => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd.run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                });
                const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const newNote = (await engine.findNotes({ fname: "food.ch2", vault: vaults[0] }))[0];
                (0, testUtilsv2_1.expect)(showQuickPick.calledOnce).toBeFalsy();
                (0, testUtilsv2_1.expect)(lodash_1.default.trim(newNote?.body)).toEqual("food ch2 template");
                cmd.cleanUp();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a template note that lies in multiple vaults without cross vault notation", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1
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
                    id: "template.ch2",
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
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
                const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // Pick vault 2
                showQuickPick.onFirstCall().returns(Promise.resolve({
                    label: "vault2",
                    vault: vaults[1],
                }));
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd
                    .run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                })
                    .then(async () => {
                    const newNote = (await engine.findNotes({ fname: "food.ch2", vault: vaults[0] }))[0];
                    (0, testUtilsv2_1.expect)(showQuickPick.calledOnce).toBeTruthy();
                    (0, testUtilsv2_1.expect)(lodash_1.default.trim(newNote?.body)).toEqual("food ch2 template in vault 2");
                });
                cmd.cleanUp();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a template note that lies in multiple vaults without cross vault notation", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1
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
                    id: "template.ch2",
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
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
            test("AND user escapes from prompted vault, THEN no template gets applied to new note", async () => {
                const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // Escape out, leading to undefined note
                showQuickPick.onFirstCall().returns(Promise.resolve(undefined));
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd
                    .run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                })
                    .then(async () => {
                    const newNote = (await engine.findNotes({ fname: "food.ch2", vault: vaults[0] }))[0];
                    (0, testUtilsv2_1.expect)(showQuickPick.calledOnce).toBeTruthy();
                    (0, testUtilsv2_1.expect)(lodash_1.default.trim(newNote?.body)).toEqual("");
                });
                cmd.cleanUp();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a template note that lies in a different vault using xvault notation that points to the wrong vault", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1
                const vault = vaults[0];
                // Template is in vault2
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    body: "food ch2 template",
                    fname: "template.ch2",
                    vault: vaults[1],
                });
                const template = {
                    id: `dendron://missingVault/template.ch2`,
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
                });
            },
        }, () => {
            test("THEN warning message gets shown about missing vault", async () => {
                const windowSpy = sinon_1.default.spy(vscode.window, "showWarningMessage");
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd.run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                });
                const warningMsg = windowSpy.getCall(0).args[0];
                (0, testUtilsv2_1.expect)(warningMsg).toEqual(`Warning: Problem with food.ch2 schema. No vault found for missingVault`);
                cmd.cleanUp();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a template note that lies in a different vault using incorrect xvault notation", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            postSetupHook: async ({ wsRoot, vaults }) => {
                // Schema is in vault1
                const vault = vaults[0];
                // Template is in vault2
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    body: "food ch2 template",
                    fname: "template.ch2",
                    vault: vaults[1],
                });
                const template = {
                    id: `blah://${common_all_1.VaultUtils.getName(vaults[1])}/template.ch2`,
                    type: "note",
                };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
                });
            },
        }, () => {
            test("THEN warning message gets shown about missing template", async () => {
                const windowSpy = sinon_1.default.spy(vscode.window, "showWarningMessage");
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd.run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                });
                const warningMsg = windowSpy.getCall(0).args[0];
                (0, testUtilsv2_1.expect)(warningMsg).toEqual(`Warning: Problem with food.ch2 schema. No note found`);
                cmd.cleanUp();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN schema template references to a missing template note", {
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            postSetupHook: async ({ wsRoot, vaults }) => {
                const vault = vaults[0];
                const template = { id: "food.missing", type: "note" };
                await common_test_utils_1.NoteTestUtilsV4.setupSchemaCrossVault({
                    wsRoot,
                    vault,
                    template,
                });
            },
        }, () => {
            test("THEN warning message gets shown about missing note", async () => {
                const windowSpy = sinon_1.default.spy(vscode.window, "showWarningMessage");
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                await cmd.run({
                    initialValue: "food.ch2",
                    noConfirm: true,
                });
                const warningMsg = windowSpy.getCall(0).args[0];
                (0, testUtilsv2_1.expect)(warningMsg).toEqual("Warning: Problem with food.ch2 schema. No note found");
                cmd.cleanUp();
            });
        });
        test("new node matching schema prefix defaults to first matching schema child name", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupSchemaPreseet({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    await cmd.run({
                        initialValue: "foo.",
                        noConfirm: true,
                    });
                    const document = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document;
                    const newNote = await WSUtils_1.WSUtils.getNoteFromDocument(document);
                    (0, testUtilsv2_1.expect)(newNote?.fname).toEqual("foo.ch1");
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("new node with schema template on namespace", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                postSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupSchemaPresetWithNamespaceTemplate({
                        wsRoot,
                        vaults,
                    });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const gatherOut = await cmd.gatherInputs({
                        initialValue: "daily.journal.2021.08.10",
                        noConfirm: true,
                    });
                    const enrichOut = await cmd.enrichInputs(gatherOut);
                    const mockQuickPick = (0, testUtils_1.createMockQuickPick)({
                        value: "daily.journal.2021.08.10",
                        selectedItems: [(0, utils_1.createNoActiveItem)(vaults[0])],
                    });
                    mockQuickPick.showNote = enrichOut?.quickpick.showNote;
                    await cmd.execute({
                        ...enrichOut,
                        quickpick: mockQuickPick,
                    });
                    const document = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document;
                    const newNote = await WSUtils_1.WSUtils.getNoteFromDocument(document);
                    (0, testUtilsv2_1.expect)(lodash_1.default.trim(newNote.body)).toEqual("Template text");
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("on accept, nothing selected", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const spyFetchPickerResultsNoInput = sinon_1.default.spy(NotePickerUtils_1.NotePickerUtils, "fetchPickerResultsNoInput");
                    const { quickpick, provider, controller } = await cmd.gatherInputs({
                        noConfirm: true,
                        initialValue: "foo",
                    });
                    await provider.onDidAccept({
                        quickpick,
                        cancellationToken: controller.cancelToken,
                    })();
                    (0, testUtilsv2_1.expect)(spyFetchPickerResultsNoInput.calledOnce).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("onAccept with lookupConfirmVaultOnCreate", () => {
        const modConfigCb = (config) => {
            common_all_1.ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", true);
            return config;
        };
        test("turned off, existing note", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    const promptVaultSpy = stubVaultPick(vaults);
                    await cmd.run({ noConfirm: true, initialValue: "foo" });
                    (0, testUtilsv2_1.expect)(promptVaultSpy.calledOnce).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("turned off, new note", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    const promptVaultSpy = stubVaultPick(vaults);
                    await cmd.run({ noConfirm: true, initialValue: "foo" });
                    (0, testUtilsv2_1.expect)(promptVaultSpy.calledOnce).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("turned on, existing note", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                modConfigCb,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    const promptVaultSpy = stubVaultPick(vaults);
                    await cmd.run({ noConfirm: true, initialValue: "foo" });
                    (0, testUtilsv2_1.expect)(promptVaultSpy.calledOnce).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("turned on, new note", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                modConfigCb,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    const promptVaultSpy = stubVaultPick(vaults);
                    await cmd.run({ noConfirm: true, initialValue: "gamma" });
                    (0, testUtilsv2_1.expect)(promptVaultSpy.calledOnce).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("modifiers", () => {
        test("journal note basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, wsRoot, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    // with journal note modifier enabled,
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const out = (await cmd.run({
                        noteType: common_all_1.LookupNoteTypeEnum.journal,
                        noConfirm: true,
                    }));
                    const dateFormat = common_all_1.ConfigUtils.getJournal(common_server_1.DConfig.readConfigSync(wsRoot)).dateFormat;
                    (0, testUtilsv2_1.expect)(dateFormat).toEqual("y.MM.dd");
                    // quickpick value should be `foo.journal.yyyy.mm.dd`
                    const today = common_all_1.Time.now().toFormat(dateFormat);
                    const noteName = `foo.journal.${today}`;
                    (0, testUtilsv2_1.expect)(out.quickpick.value).toEqual(noteName);
                    // note title should be overriden.
                    const note = await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor().document);
                    (0, testUtilsv2_1.expect)(note?.fname).toEqual(noteName);
                    const titleOverride = today.split(".").join("-");
                    (0, testUtilsv2_1.expect)(note.title).toEqual(titleOverride);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("scratch note basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    // with scratch note modifier enabled,
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const out = (await cmd.run({
                        noteType: common_all_1.LookupNoteTypeEnum.scratch,
                        noConfirm: true,
                    }));
                    // quickpick value should be `scratch.yyyy.mm.dd.ts`
                    const dateFormat = workspace_1.DendronExtension.configuration().get(constants_2.CONFIG["DEFAULT_SCRATCH_DATE_FORMAT"].key);
                    const today = common_all_1.Time.now().toFormat(dateFormat);
                    const todayFormatted = today.split(".").slice(0, -1).join(".");
                    (0, testUtilsv2_1.expect)(out.quickpick.value.startsWith(`scratch.${todayFormatted}.`)).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("Scratch notes created at different times are differently named", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    // with scratch note modifier enabled,
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const createScratch = async () => {
                        const out = (await cmd.run({
                            noteType: common_all_1.LookupNoteTypeEnum.scratch,
                            noConfirm: true,
                        }));
                        return out.quickpick.value;
                    };
                    const scratch1Name = await createScratch();
                    await (0, testUtilsV3_1.waitInMilliseconds)(1000);
                    const scratch2Name = await createScratch();
                    (0, testUtilsv2_1.expect)(scratch1Name).toNotEqual(scratch2Name);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("task note basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    // with scratch note modifier enabled,
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const out = (await cmd.run({
                        noteType: common_all_1.LookupNoteTypeEnum.task,
                        noConfirm: true,
                    }));
                    (0, testUtilsv2_1.expect)(out.quickpick.value.startsWith(`task`)).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        // not working
        test.skip("journal note with initial value override", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, wsRoot, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    // with journal note modifier enabled,
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const out = (await cmd.run({
                        noteType: common_all_1.LookupNoteTypeEnum.journal,
                        initialValue: "gamma",
                        noConfirm: true,
                    }));
                    const dateFormat = common_all_1.ConfigUtils.getJournal(common_server_1.DConfig.readConfigSync(wsRoot)).dateFormat;
                    (0, testUtilsv2_1.expect)(dateFormat).toEqual("y.MM.dd");
                    // quickpick value should be `foo.journal.yyyy.mm.dd`
                    const today = common_all_1.Time.now().toFormat(dateFormat);
                    const noteName = `gamma.journal.${today}`;
                    (0, testUtilsv2_1.expect)(out.quickpick.value).toEqual(noteName);
                    // note title should be overriden.
                    const note = await WSUtils_1.WSUtils.getNoteFromDocument(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor().document);
                    const titleOverride = today.split(".").join("-");
                    (0, testUtilsv2_1.expect)(note.title).toEqual(titleOverride);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("journal modifier toggle", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const { controller } = await cmd.gatherInputs({
                        noteType: common_all_1.LookupNoteTypeEnum.journal,
                    });
                    const { journalBtn, scratchBtn } = getNoteTypeButtons(controller.quickPick.buttons);
                    (0, testUtilsv2_1.expect)(journalBtn.pressed).toBeTruthy();
                    (0, testUtilsv2_1.expect)(scratchBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(controller.quickPick.value.startsWith("foo.journal."));
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("scratch modifier toggle", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const { controller } = await cmd.gatherInputs({
                        noteType: common_all_1.LookupNoteTypeEnum.scratch,
                    });
                    const { journalBtn, scratchBtn } = getNoteTypeButtons(controller.quickPick.buttons);
                    (0, testUtilsv2_1.expect)(journalBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(scratchBtn.pressed).toBeTruthy();
                    (0, testUtilsv2_1.expect)(controller.quickPick.value.startsWith("scratch."));
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("task modifier toggle", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const { controller } = await cmd.gatherInputs({
                        noteType: common_all_1.LookupNoteTypeEnum.task,
                    });
                    const { journalBtn, scratchBtn, taskBtn } = getNoteTypeButtons(controller.quickPick.buttons);
                    (0, testUtilsv2_1.expect)(journalBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(scratchBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(taskBtn.pressed).toBeTruthy();
                    (0, testUtilsv2_1.expect)(controller.quickPick.value.startsWith("task."));
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("selection modifier set to none in configs", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                modConfigCb: (config) => {
                    common_all_1.ConfigUtils.setNoteLookupProps(config, "selectionMode", common_all_1.LookupSelectionModeEnum.none);
                    return config;
                },
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const gatherOut = await cmd.gatherInputs({});
                    const { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(gatherOut.quickpick.buttons);
                    (0, testUtilsv2_1.expect)(selection2linkBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(selectionExtractBtn.pressed).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("selectionType: none in args", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const gatherOut = await cmd.gatherInputs({
                        selectionType: common_all_1.LookupSelectionTypeEnum.none,
                    });
                    const { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(gatherOut.quickpick.buttons);
                    (0, testUtilsv2_1.expect)(selection2linkBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(selectionExtractBtn.pressed).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("selectionType is selectionExtract by default", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const gatherOut = await cmd.gatherInputs({});
                    const { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(gatherOut.quickpick.buttons);
                    (0, testUtilsv2_1.expect)(selection2linkBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(selectionExtractBtn.pressed).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("selection2link basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    // selects "foo body"
                    fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                    const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                    (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                    await cmd.run({
                        selectionType: "selection2link",
                        noConfirm: true,
                    });
                    // should create foo.foo-body.md with an empty body.
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)().endsWith("foo.foo-body.md"));
                    const newNoteEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const newNote = await WSUtils_1.WSUtils.getNoteFromDocument(newNoteEditor.document);
                    (0, testUtilsv2_1.expect)(newNote?.body).toEqual("");
                    // should change selection to link with alais.
                    const changedText = fooNoteEditor.document.getText();
                    (0, testUtilsv2_1.expect)(changedText.endsWith("[[foo body|foo.foo-body]]\n"));
                    // Note should have its links updated, since selection2link put a link in it
                    // TODO: Re-enable checks below. There's currently a race condition
                    // with the check, where it needs to wait for NoteSyncService to
                    // finish its callback before we should check the engine state. The
                    // test should subscribe to OnNoteChange event and do the check upon
                    // event firing. However, NoteSyncService is currently not exposed in
                    // the test infrastructure.
                    // const oldNote = (await engine.getNoteMeta("foo")).data!;
                    // expect(oldNote.links.length).toEqual(1);
                    // expect(oldNote.links[0].value).toEqual("foo.foo-body");
                    cmd.cleanUp();
                    done();
                },
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN selection2link is used with a multi-line string", {
            ctx,
            postSetupHook: async ({ vaults, wsRoot }) => {
                common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "multi-line",
                    vault: vaults[0],
                    wsRoot,
                    body: "test\ning\n",
                });
            },
        }, () => {
            test("THEN it produces a valid string", async () => {
                const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const fooNoteEditor = await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote((await engine.getNoteMeta("multi-line")).data);
                // selects "test \n ing \n"
                fooNoteEditor.selection = new vscode.Selection(7, 0, 9, 0);
                const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                (0, testUtilsv2_1.expect)(text).toEqual("test\ning\n");
                await cmd.run({
                    selectionType: "selection2link",
                    noConfirm: true,
                });
                // should create foo.foo-body.md with an empty body.
                (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)().endsWith("multi-line.testing.md"));
                const newNoteEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                const newNote = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromDocument(newNoteEditor.document);
                (0, testUtilsv2_1.expect)(newNote?.body).toEqual("");
                // should change selection to link with alais.
                const changedText = fooNoteEditor.document.getText();
                (0, testUtilsv2_1.expect)(changedText.endsWith("[[testing|multi-line.testing]]\n"));
                cmd.cleanUp();
            });
        });
        test("selection2link modifier toggle", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                    const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                    (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                    const { controller } = await cmd.gatherInputs({
                        selectionType: "selection2link",
                    });
                    const { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(controller.quickPick.buttons);
                    (0, testUtilsv2_1.expect)(selection2linkBtn?.pressed).toBeTruthy();
                    (0, testUtilsv2_1.expect)(selectionExtractBtn.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(controller.quickPick.value).toEqual("foo.foo-body");
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("selectionExtract basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    // selects "foo body"
                    fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                    const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                    (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                    await cmd.run({
                        selectionType: "selectionExtract",
                        initialValue: "foo.extracted",
                        noConfirm: true,
                    });
                    // should create foo.extracted.md with an selected text as body.
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)().endsWith("foo.extracted.md"));
                    const newNoteEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const newNote = await WSUtils_1.WSUtils.getNoteFromDocument(newNoteEditor.document);
                    (0, testUtilsv2_1.expect)(newNote?.body.trim()).toEqual("foo body");
                    // should remove selection
                    const originalNote = (await engine.findNotes({
                        fname: "foo",
                        vault: vaults[0],
                    }))[0];
                    (0, testUtilsv2_1.expect)(originalNote.body.includes("foo body")).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("leave trace on selectionExtract", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ wsRoot, vaults, engine }) => {
                    (0, testUtilsV3_1.withConfig)((config) => {
                        common_all_1.ConfigUtils.setNoteLookupProps(config, "leaveTrace", true);
                        return config;
                    }, { wsRoot });
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    // selects "foo body"
                    fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                    const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                    (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                    await cmd.run({
                        selectionType: "selectionExtract",
                        initialValue: "foo.extracted",
                        noConfirm: true,
                    });
                    // should create foo.extracted.md with an selected text as body.
                    (0, testUtilsv2_1.expect)((0, testUtils_1.getActiveEditorBasename)().endsWith("foo.extracted.md"));
                    const newNoteEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const newNote = await WSUtils_1.WSUtils.getNoteFromDocument(newNoteEditor.document);
                    (0, testUtilsv2_1.expect)(newNote?.body.trim()).toEqual("foo body");
                    // should remove selection
                    const changedText = fooNoteEditor.document.getText();
                    (0, testUtilsv2_1.expect)(changedText.includes(`![[${newNote?.title}|${newNote?.fname}]]`)).toBeTruthy();
                    (0, testUtilsv2_1.expect)(changedText.includes("foo body")).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("selectionExtract from file not in known vault", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    // open and create a file outside of vault.
                    const extDir = (0, common_server_1.tmpDir)().name;
                    const extPath = "outside.md";
                    const extBody = "non vault content";
                    await common_test_utils_1.FileTestUtils.createFiles(extDir, [
                        { path: extPath, body: extBody },
                    ]);
                    const uri = vscode.Uri.file(path_1.default.join(extDir, extPath));
                    const editor = (await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri));
                    editor.selection = new vscode.Selection(0, 0, 0, 17);
                    await cmd.run({
                        selectionType: "selectionExtract",
                        initialValue: "from-outside",
                        noConfirm: true,
                    });
                    const newNoteEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    const newNote = await WSUtils_1.WSUtils.getNoteFromDocument(newNoteEditor.document);
                    (0, testUtilsv2_1.expect)(newNote?.body.trim()).toEqual("non vault content");
                    const nonVaultFileEditor = (await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri));
                    (0, testUtilsv2_1.expect)(nonVaultFileEditor.document.getText()).toEqual(extBody);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("selectionExtract modifier toggle", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                    const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                    (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                    const { controller } = await cmd.gatherInputs({
                        selectionType: "selectionExtract",
                    });
                    const { selection2linkBtn, selectionExtractBtn } = getSelectionTypeButtons(controller.quickPick.buttons);
                    (0, testUtilsv2_1.expect)(selection2linkBtn?.pressed).toBeFalsy();
                    (0, testUtilsv2_1.expect)(selectionExtractBtn.pressed).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("horizontal split basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, engine }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    // close all editors before running.
                    vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                    await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                    await cmd.run({
                        initialValue: "bar",
                        splitType: "horizontal",
                        noConfirm: true,
                    });
                    const barEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    (0, testUtilsv2_1.expect)(barEditor.viewColumn).toEqual(2);
                    await cmd.run({
                        initialValue: "foo.ch1",
                        splitType: "horizontal",
                        noConfirm: true,
                    });
                    const fooChildEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    (0, testUtilsv2_1.expect)(fooChildEditor.viewColumn).toEqual(3);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("horizontal split modifier toggle", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const { controller } = await cmd.gatherInputs({
                        splitType: "horizontal",
                    });
                    const { horizontalSplitBtn } = getSplitTypeButtons(controller.quickPick.buttons);
                    (0, testUtilsv2_1.expect)(horizontalSplitBtn?.pressed).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
        test("copyNoteLink basic", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults }) => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    const out = await cmd.run({
                        initialValue: "foo",
                        noConfirm: true,
                        copyNoteLink: true,
                    });
                    const content = await utils_2.clipboard.readText();
                    (0, testUtilsv2_1.expect)(content).toEqual("[[Foo|foo]]");
                    (0, testUtilsv2_1.expect)(!lodash_1.default.isUndefined(out?.quickpick.copyNoteLinkFunc)).toBeTruthy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("journal + selection2link interactions", () => {
        const prepareCommandFunc = async ({ vaults, engine }) => {
            const cmd = new NoteLookupCommand_1.NoteLookupCommand();
            stubVaultPick(vaults);
            const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
            // selects "foo body"
            fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
            const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
            (0, testUtilsv2_1.expect)(text).toEqual("foo body");
            const { controller } = await cmd.gatherInputs({
                noteType: common_all_1.LookupNoteTypeEnum.journal,
                selectionType: common_all_1.LookupSelectionTypeEnum.selection2link,
            });
            return { controller, cmd };
        };
        test("journal and selection2link both applied", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                },
                onInit: async ({ vaults, wsRoot, engine }) => {
                    const { controller, cmd } = await prepareCommandFunc({
                        vaults,
                        engine,
                    });
                    const { journalBtn } = getNoteTypeButtons(controller.quickPick.buttons);
                    const { selection2linkBtn } = getSelectionTypeButtons(controller.quickPick.buttons);
                    (0, testUtilsv2_1.expect)(journalBtn.pressed).toBeTruthy();
                    (0, testUtilsv2_1.expect)(selection2linkBtn.pressed).toBeTruthy();
                    const dateFormat = common_all_1.ConfigUtils.getJournal(common_server_1.DConfig.readConfigSync(wsRoot)).dateFormat;
                    const today = common_all_1.Time.now().toFormat(dateFormat);
                    (0, testUtilsv2_1.expect)(controller.quickPick.value).toEqual(`foo.journal.${today}.foo-body`);
                    cmd.cleanUp();
                    done();
                },
            });
        });
        (0, mocha_1.describe)("scratch + selection2link interactions", () => {
            const prepareCommandFunc = async ({ vaults, engine }) => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                // selects "foo body"
                fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                const { controller } = await cmd.gatherInputs({
                    noteType: common_all_1.LookupNoteTypeEnum.scratch,
                    selectionType: common_all_1.LookupSelectionTypeEnum.selection2link,
                });
                return { controller, cmd };
            };
            test("scratch and selection2link both applied", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    },
                    onInit: async ({ vaults, engine }) => {
                        const { controller, cmd } = await prepareCommandFunc({
                            vaults,
                            engine,
                        });
                        const { scratchBtn } = getNoteTypeButtons(controller.quickPick.buttons);
                        const { selection2linkBtn } = getSelectionTypeButtons(controller.quickPick.buttons);
                        (0, testUtilsv2_1.expect)(scratchBtn.pressed).toBeTruthy();
                        (0, testUtilsv2_1.expect)(selection2linkBtn.pressed).toBeTruthy();
                        const todayFormatted = getTodayInScratchDateFormat();
                        const quickpickValue = controller.quickPick.value;
                        (0, testUtilsv2_1.expect)(quickpickValue.startsWith(`scratch.${todayFormatted}`)).toBeTruthy();
                        (0, testUtilsv2_1.expect)(quickpickValue.endsWith(".foo-body")).toBeTruthy();
                        cmd.cleanUp();
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("task + selection2link interactions", () => {
            const prepareCommandFunc = async ({ vaults, engine }) => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                // selects "foo body"
                fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                const { controller } = await cmd.gatherInputs({
                    noteType: common_all_1.LookupNoteTypeEnum.task,
                    selectionType: common_all_1.LookupSelectionTypeEnum.selection2link,
                });
                return { controller, cmd };
            };
            test("task and selection2link both applied", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    },
                    onInit: async ({ vaults, engine }) => {
                        const { controller } = await prepareCommandFunc({
                            vaults,
                            engine,
                        });
                        const { taskBtn } = getNoteTypeButtons(controller.quickPick.buttons);
                        const { selection2linkBtn } = getSelectionTypeButtons(controller.quickPick.buttons);
                        (0, testUtilsv2_1.expect)(taskBtn.pressed).toBeTruthy();
                        (0, testUtilsv2_1.expect)(selection2linkBtn.pressed).toBeTruthy();
                        const quickpickValue = controller.quickPick.value;
                        (0, testUtilsv2_1.expect)(quickpickValue.startsWith(`task.`)).toBeTruthy();
                        (0, testUtilsv2_1.expect)(quickpickValue.endsWith(".foo-body")).toBeTruthy();
                        controller.onHide();
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("note modifiers + selectionExtract interactions", () => {
            const prepareCommandFunc = async ({ vaults, engine, noteType }) => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                stubVaultPick(vaults);
                const fooNoteEditor = await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                // selects "foo body"
                fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                (0, testUtilsv2_1.expect)(text).toEqual("foo body");
                const cmdOut = await cmd.run({
                    noteType,
                    selectionType: common_all_1.LookupSelectionTypeEnum.selectionExtract,
                    noConfirm: true,
                });
                return { cmdOut, selectedText: text, cmd };
            };
            test("journal + selectionExtract both applied", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    },
                    onInit: async ({ vaults, wsRoot, engine }) => {
                        const { selectedText, cmd } = await prepareCommandFunc({
                            vaults,
                            engine,
                            noteType: common_all_1.LookupNoteTypeEnum.journal,
                        });
                        const dateFormat = common_all_1.ConfigUtils.getJournal(common_server_1.DConfig.readConfigSync(wsRoot)).dateFormat;
                        const today = common_all_1.Time.now().toFormat(dateFormat);
                        const newNote = (await engine.findNotes({
                            fname: `foo.journal.${today}`,
                            vault: vaults[0],
                        }))[0];
                        (0, testUtilsv2_1.expect)(newNote.body.trim()).toEqual(selectedText);
                        cmd.cleanUp();
                        done();
                    },
                });
            });
            test("scratch + selectionExtract both applied", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    },
                    onInit: async ({ vaults, engine }) => {
                        const { cmdOut, selectedText, cmd } = await prepareCommandFunc({
                            vaults,
                            engine,
                            noteType: common_all_1.LookupNoteTypeEnum.scratch,
                        });
                        const newNote = (await engine.findNotes({
                            fname: cmdOut.quickpick.value,
                            vault: vaults[0],
                        }))[0];
                        (0, testUtilsv2_1.expect)(newNote.body.trim()).toEqual(selectedText);
                        cmd.cleanUp();
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("multiselect interactions", () => {
            // TODO: there's gotta be a better way to mock this.
            const prepareCommandFunc = async ({ wsRoot, vaults, engine, opts, }) => {
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                const notesToSelect = (await engine.bulkGetNotes(["foo.ch1", "bar", "lorem", "ipsum"])).data;
                const selectedItems = (await Promise.all(notesToSelect.map(async (note) => {
                    return common_all_1.DNodeUtils.enhancePropForQuickInputV3({
                        props: note,
                        schema: note.schema
                            ? (await engine.getSchema(note.schema.moduleId)).data
                            : undefined,
                        wsRoot,
                        vaults,
                    });
                })));
                const runOpts = {
                    multiSelect: true,
                    noConfirm: true,
                    copyNoteLink: opts.copyLink ? true : undefined,
                };
                if (opts.split)
                    runOpts.splitType = ButtonTypes_1.LookupSplitTypeEnum.horizontal;
                const gatherOut = await cmd.gatherInputs(runOpts);
                const mockQuickPick = (0, testUtils_1.createMockQuickPick)({
                    value: "",
                    selectedItems,
                    canSelectMany: true,
                    buttons: gatherOut.quickpick.buttons,
                });
                mockQuickPick.showNote = gatherOut.quickpick.showNote;
                mockQuickPick.copyNoteLinkFunc = gatherOut.quickpick.copyNoteLinkFunc;
                sinon_1.default.stub(cmd, "enrichInputs").returns(Promise.resolve({
                    quickpick: mockQuickPick,
                    controller: gatherOut.controller,
                    provider: gatherOut.provider,
                    selectedItems,
                }));
                return { cmd };
            };
            test("split + multiselect: should have n+1 columns", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "lorem",
                            vault: vaults[0],
                            wsRoot,
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "ipsum",
                            vault: vaults[0],
                            wsRoot,
                        });
                    },
                    onInit: async ({ wsRoot, vaults, engine }) => {
                        // make clean slate.
                        vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                        await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                        const { cmd } = await prepareCommandFunc({
                            wsRoot,
                            vaults,
                            engine,
                            opts: { split: true },
                        });
                        await cmd.run({
                            multiSelect: true,
                            splitType: ButtonTypes_1.LookupSplitTypeEnum.horizontal,
                            noConfirm: true,
                        });
                        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                        // one open, lookup with 2 selected. total 3 columns.
                        (0, testUtilsv2_1.expect)(editor?.viewColumn).toEqual(5);
                        sinon_1.default.restore();
                        cmd.cleanUp();
                        done();
                    },
                });
            });
            test("copyNoteLink + multiselect: should copy link of all selected notes", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "lorem",
                            vault: vaults[0],
                            wsRoot,
                        });
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "ipsum",
                            vault: vaults[0],
                            wsRoot,
                        });
                    },
                    onInit: async ({ wsRoot, vaults, engine }) => {
                        // make clean slate.
                        vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                        await WSUtils_1.WSUtils.openNote((await engine.getNoteMeta("foo")).data);
                        const { cmd } = await prepareCommandFunc({
                            wsRoot,
                            vaults,
                            engine,
                            opts: { copyLink: true },
                        });
                        await cmd.run({
                            multiSelect: true,
                            noConfirm: true,
                            copyNoteLink: true,
                        });
                        const content = await utils_2.clipboard.readText();
                        (0, testUtilsv2_1.expect)(content).toEqual([
                            "[[Ch1|foo.ch1]]",
                            "[[Bar|bar]]",
                            "[[Lorem|lorem]]",
                            "[[Ipsum|ipsum]]",
                        ].join("\n"));
                        cmd.cleanUp();
                        done();
                    },
                });
            });
        });
    });
    (0, mocha_1.describe)("GIVEN a stub note that should match some schema", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN it is accepted as a new item", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                await common_test_utils_1.NoteTestUtilsV4.createSchema({
                    fname: "test",
                    wsRoot,
                    vault: vaults[0],
                    modifier: (schema) => {
                        const schemas = [
                            common_all_1.SchemaUtils.createFromSchemaOpts({
                                fname: "test",
                                id: "test",
                                children: ["testing"],
                                title: "test",
                                parent: "root",
                                vault: vaults[0],
                            }),
                            common_all_1.SchemaUtils.createFromSchemaRaw({
                                id: "testing",
                                pattern: "*",
                                title: "testing",
                                namespace: true,
                                template: {
                                    id: "template.test",
                                    type: "note",
                                },
                                vault: vaults[0],
                            }),
                        ];
                        schemas.map((s) => {
                            schema.schemas[s.id] = s;
                        });
                        return schema;
                    },
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "template.test",
                    wsRoot,
                    vault: vaults[0],
                    body: "template body",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    fname: "test.one.two.three",
                    wsRoot,
                    vault: vaults[0],
                });
            },
        }, () => {
            test("stub note that was accepted is created with the schema applied", async () => {
                vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                stubVaultPick(vaults);
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                await cmd.run({
                    noConfirm: true,
                    initialValue: "test.one.two",
                });
                const findResp = await engine.findNotes({
                    fname: "test.one.two",
                });
                (0, testUtilsv2_1.expect)(findResp.length).toEqual(1);
                const createdNote = findResp[0];
                // created note has schema applied
                (0, testUtilsv2_1.expect)(createdNote.schema).toBeTruthy();
                // created note has template that was specified by the schema applied
                const templateNote = (await engine.getNote("template.test")).data;
                (0, testUtilsv2_1.expect)(createdNote.body).toEqual(templateNote?.body);
            });
        });
    });
});
suite("stateService", function () {
    let homeDirStub;
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: async (ctx) => {
            new stateService_1.StateService(ctx);
            await (0, testUtilsv2_1.resetCodeWorkspace)();
            homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
        },
        afterHook: async () => {
            homeDirStub.restore();
        },
        noSetInstallStatus: true,
    });
    (0, mocha_1.describe)("GIVEN user accepts lookup for the first time", () => {
        test("THEN global states firstLookupTime and lastLookupTime are set correctly", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ vaults }) => {
                    vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    let metaData = engine_server_1.MetadataService.instance().getMeta();
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(metaData.firstLookupTime)).toBeTruthy();
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(metaData.lastLookupTime)).toBeTruthy();
                    await cmd.run({
                        noConfirm: true,
                    });
                    metaData = engine_server_1.MetadataService.instance().getMeta();
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(metaData.firstLookupTime)).toBeFalsy();
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(metaData.lastLookupTime)).toBeFalsy();
                    cmd.cleanUp();
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("GIVEN user accepts subsequent lookup", () => {
        test("THEN global state lastLookupTime is set correctly", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
                onInit: async ({ vaults }) => {
                    vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    stubVaultPick(vaults);
                    await cmd.run({
                        noConfirm: true,
                    });
                    let metaData = engine_server_1.MetadataService.instance().getMeta();
                    const firstLookupTime = metaData.firstLookupTime;
                    const lastLookupTime = metaData.lastLookupTime;
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(firstLookupTime)).toBeFalsy();
                    (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(lastLookupTime)).toBeFalsy();
                    await cmd.run({
                        noConfirm: true,
                    });
                    metaData = engine_server_1.MetadataService.instance().getMeta();
                    (0, testUtilsv2_1.expect)(metaData.firstLookupTime).toEqual(firstLookupTime);
                    (0, testUtilsv2_1.expect)(metaData.lastLookupTime).toNotEqual(lastLookupTime);
                    cmd.cleanUp();
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=NoteLookupCommand.test.js.map