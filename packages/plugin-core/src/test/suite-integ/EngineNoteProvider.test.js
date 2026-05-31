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
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const inject_1 = require("../../di/inject");
const vscode = __importStar(require("vscode"));
const EngineNoteProvider_1 = require("../../views/common/treeview/EngineNoteProvider");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const MetadataSvcTreeViewConfig_1 = require("../../views/node/treeview/MetadataSvcTreeViewConfig");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const MockEngineEvents_1 = require("./MockEngineEvents");
/**
 * Tests the EngineNoteProvider
 */
suite("EngineNoteProvider Tests", function testSuite() {
    // Set test timeout to 2 seconds
    this.timeout(2000);
    (0, mocha_1.describe)("general", function () {
        const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
        (0, mocha_1.describe)(`WHEN a note has been created`, function () {
            test("THEN the data provider refresh event gets invoked", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    postSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
                    onInit: async ({ vaults, wsRoot, engine }) => {
                        const testNoteProps = await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "alpha",
                            vault: vaults[0],
                            wsRoot,
                        });
                        const treeViewConfig = new MetadataSvcTreeViewConfig_1.MetadataSvcTreeViewConfig();
                        const mockEvents = new MockEngineEvents_1.MockEngineEvents();
                        const provider = new EngineNoteProvider_1.EngineNoteProvider(vscode.Uri.file(wsRoot), engine, mockEvents, treeViewConfig);
                        provider.onDidChangeTreeData(() => {
                            done();
                        });
                        const entry = {
                            note: testNoteProps,
                            status: "create",
                        };
                        mockEvents.testFireOnNoteChanged([entry]);
                    },
                });
            });
        });
        (0, mocha_1.describe)(`WHEN a note has been updated`, function () {
            test("THEN the data provider refresh event gets invoked", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    postSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
                    onInit: async ({ vaults, wsRoot, engine }) => {
                        const testNoteProps = await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "alpha",
                            vault: vaults[0],
                            wsRoot,
                        });
                        const treeViewConfig = new MetadataSvcTreeViewConfig_1.MetadataSvcTreeViewConfig();
                        const mockEvents = new MockEngineEvents_1.MockEngineEvents();
                        const provider = new EngineNoteProvider_1.EngineNoteProvider(vscode.Uri.file(wsRoot), engine, mockEvents, treeViewConfig);
                        provider.onDidChangeTreeData(() => {
                            done();
                        });
                        const entry = {
                            prevNote: testNoteProps,
                            note: testNoteProps,
                            status: "update",
                        };
                        mockEvents.testFireOnNoteChanged([entry]);
                    },
                });
            });
        });
        (0, mocha_1.describe)(`WHEN a note has been deleted`, function () {
            test("THEN the data provider refresh event gets invoked", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    postSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
                    onInit: async ({ vaults, wsRoot, engine }) => {
                        const testNoteProps = await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "alpha",
                            vault: vaults[0],
                            wsRoot,
                        });
                        const treeViewConfig = new MetadataSvcTreeViewConfig_1.MetadataSvcTreeViewConfig();
                        const mockEvents = new MockEngineEvents_1.MockEngineEvents();
                        const provider = new EngineNoteProvider_1.EngineNoteProvider(vscode.Uri.file(wsRoot), engine, mockEvents, treeViewConfig);
                        provider.onDidChangeTreeData(() => {
                            done();
                        });
                        const entry = {
                            note: testNoteProps,
                            status: "delete",
                        };
                        mockEvents.testFireOnNoteChanged([entry]);
                    },
                });
            });
        });
    });
    (0, mocha_1.describe)("tree data", function () {
        const preSetupHookFunc = async (opts) => {
            const { vaults, wsRoot } = opts;
            const vault = vaults[0];
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LOWER_CASE_TITLE.create({
                wsRoot,
                vault,
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_UPPER_CASE_TITLE.create({
                wsRoot,
                vault,
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_UNDERSCORE_TITLE.create({
                wsRoot,
                vault,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                vault: vaults[0],
                fname: "zebra",
                custom: {
                    nav_order: 1,
                },
            });
        };
        (0, mocha_1.describe)("sort / label config", function () {
            (0, testUtilsV3_1.describeMultiWS)("WHEN treeViewItemLabelType is omitted", {
                preSetupHook: async (opts) => {
                    await preSetupHookFunc(opts);
                    engine_server_1.MetadataService.instance().deleteMeta("treeViewItemLabelType");
                },
                timeout: 1e6,
            }, () => {
                test("THEN label and sort tree items by title", async () => {
                    (0, testUtilsv2_1.expect)(engine_server_1.MetadataService.instance().getTreeViewItemLabelType()).toEqual(common_all_1.TreeViewItemLabelTypeEnum.title);
                    const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                    const props = await provider.getChildren();
                    const vault1RootProps = props[0];
                    const children = await provider.getChildren(vault1RootProps);
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const titleArray = children?.map(async (children) => (await engine.findNotesMeta({ fname: children }))[0].title);
                    const result = await Promise.all(titleArray);
                    (0, testUtilsv2_1.expect)(result).toEqual([
                        "Zebra", // nav_order: 1
                        "_underscore", // underscore comes first
                        "Aardvark",
                        "aaron",
                    ]);
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN treeViewItemLabelType is title", {
                preSetupHook: async (opts) => {
                    await preSetupHookFunc(opts);
                    engine_server_1.MetadataService.instance().setTreeViewItemLabelType(common_all_1.TreeViewItemLabelTypeEnum.title);
                },
            }, () => {
                (0, mocha_1.after)(() => {
                    engine_server_1.MetadataService.instance().deleteMeta("treeViewItemLabelType");
                });
                test("THEN label and sort tree items by title", async () => {
                    const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                    const props = await provider.getChildren();
                    const vault1RootProps = props[0];
                    const children = await provider.getChildren(vault1RootProps);
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const titleArray = children?.map(async (children) => (await engine.findNotesMeta({ fname: children }))[0].title);
                    const result = await Promise.all(titleArray);
                    (0, testUtilsv2_1.expect)(result).toEqual([
                        "Zebra", // nav_order: 1
                        "_underscore", // underscore comes before alphabets
                        "Aardvark",
                        "aaron",
                    ]);
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("WHEN treeViewItemLabelType is filename", {
                preSetupHook: async (opts) => {
                    await preSetupHookFunc(opts);
                    engine_server_1.MetadataService.instance().setTreeViewItemLabelType(common_all_1.TreeViewItemLabelTypeEnum.filename);
                },
            }, () => {
                (0, mocha_1.after)(() => {
                    engine_server_1.MetadataService.instance().deleteMeta("treeViewItemLabelType");
                });
                test("THEN label and sort tree items by filename", async () => {
                    const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                    const props = await provider.getChildren();
                    const vault1RootProps = props[0];
                    const children = await provider.getChildren(vault1RootProps);
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const titleArray = children?.map(async (children) => (await engine.findNotesMeta({ fname: children }))[0].fname);
                    const result = await Promise.all(titleArray);
                    (0, testUtilsv2_1.expect)(result.map((fname) => lodash_1.default.last(fname.split(".")))).toEqual([
                        "zebra", // nav_order: 1
                        "_underscore", // underscore comes before lowercase alphabets
                        "aardvark",
                        "aaron",
                    ]);
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN the engine note provider is providing tree data on the root node", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
            timeout: 1e6,
        }, () => {
            test("THEN the tree data is correct", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const props = await provider.getChildren();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                // 3 Vaults hence 3 root nodes
                (0, testUtilsv2_1.expect)(props.length === 3);
                // Also check some children:
                props.forEach(async (props) => {
                    const note = await (await engine.getNote(props)).data;
                    if (note) {
                        switch (note.vault.fsPath) {
                            case "vault1": {
                                if (note.children.length !== 1 ||
                                    note.children[0] !== "foo") {
                                    throw new common_all_1.DendronError({
                                        message: "Note children in vault1 incorrect!",
                                    });
                                }
                                break;
                            }
                            case "vault2": {
                                if (note.children.length !== 1 ||
                                    note.children[0] !== "bar") {
                                    throw new common_all_1.DendronError({
                                        message: "Note children in vault2 incorrect!",
                                    });
                                }
                                break;
                            }
                            case "vault3": {
                                if (note.children.length !== 0) {
                                    throw new common_all_1.DendronError({
                                        message: "Note children in vault3 incorrect!",
                                    });
                                }
                                break;
                            }
                            default: {
                                throw new common_all_1.DendronError({
                                    message: "Note with unexpected vault found!",
                                });
                            }
                        }
                    }
                    else {
                        throw new common_all_1.DendronError({
                            message: "Notenot found",
                        });
                    }
                });
            });
        });
        (0, mocha_1.describe)("WHEN the engine note provider is providing tree data on the root node with children", function () {
            (0, testUtilsV3_1.describeMultiWS)("AND tags hierarchy doesn't specify nav_order", {
                preSetupHook: async (opts) => {
                    const { vaults, wsRoot } = opts;
                    const vault = vaults[0];
                    await preSetupHookFunc(opts);
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault,
                        fname: "tags.aa-battery",
                    });
                },
                timeout: 1e6,
            }, () => {
                test("THEN tree item sort order is correct", async () => {
                    const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                    const props = await provider.getChildren();
                    const vault1RootProps = props[0];
                    const children = await provider.getChildren(vault1RootProps);
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const titleArray = children?.map(async (children) => {
                        const resp = await engine.getNote(children);
                        return resp.data?.title;
                    });
                    const result = await Promise.all(titleArray);
                    (0, testUtilsv2_1.expect)(result).toEqual([
                        "Zebra", // nav_order: 1
                        "_underscore", // underscore comes before alphabets
                        "Aardvark",
                        "aaron",
                        "Tags", // tags come last.
                    ]);
                });
            });
            (0, testUtilsV3_1.describeMultiWS)("AND tags hierarchy doesn't specify nav_order", {
                preSetupHook: async (opts) => {
                    const { wsRoot, vaults } = opts;
                    await preSetupHookFunc(opts);
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault: vaults[0],
                        fname: "tags",
                        custom: {
                            nav_order: 1.2,
                        },
                    });
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        wsRoot,
                        vault: vaults[0],
                        fname: "tags.aa-battery",
                    });
                },
            }, () => {
                test("THEN tag hierarchy nav_order is respected", async () => {
                    const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                    const props = await provider.getChildren();
                    const vault1RootProps = props[0];
                    const children = await provider.getChildren(vault1RootProps);
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const titleArray = children?.map(async (children) => (await engine.findNotesMeta({ fname: children }))[0].title);
                    const result = await Promise.all(titleArray);
                    (0, testUtilsv2_1.expect)(result).toEqual([
                        "Zebra", // nav_order: 1
                        "Tags", // nav_order respected
                        "_underscore", // underscore comes before alphabets
                        "Aardvark",
                        "aaron",
                    ]);
                });
            });
        });
    });
});
//# sourceMappingURL=EngineNoteProvider.test.js.map