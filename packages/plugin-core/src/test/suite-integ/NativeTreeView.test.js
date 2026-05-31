"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const inject_1 = require("../../di/inject");
const vscode_1 = require("vscode");
const DeleteCommand_1 = require("../../commands/DeleteCommand");
const RenameNoteV2a_1 = require("../../commands/RenameNoteV2a");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const EngineNoteProvider_1 = require("../../views/common/treeview/EngineNoteProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
function getNoteUri(opts) {
    const { note, wsRoot } = opts;
    const { fname, vault } = note;
    const notePath = fname + ".md";
    const vaultPath = (0, common_server_1.vault2Path)({ vault, wsRoot });
    return vscode_1.Uri.file(path_1.default.join(vaultPath, notePath));
}
async function runRenameNote(opts) {
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const { wsRoot } = engine;
    const { noteId, newName } = opts;
    const noteToRename = (await engine.getNoteMeta(noteId)).data;
    const noteToRenameVaultPath = (0, common_server_1.vault2Path)({
        wsRoot,
        vault: noteToRename.vault,
    });
    const rootUri = vscode_1.Uri.file(noteToRenameVaultPath);
    const oldUri = getNoteUri({ note: noteToRename, wsRoot });
    const newUri = vsCodeUtils_1.VSCodeUtils.joinPath(rootUri, `${newName}.md`);
    const renameCmd = new RenameNoteV2a_1.RenameNoteV2aCommand();
    const renameOpts = {
        files: [
            {
                oldUri,
                newUri,
            },
        ],
        silent: true,
        closeCurrentFile: false,
        openNewFile: true,
        noModifyWatcher: true,
    };
    await renameCmd.execute(renameOpts);
}
async function runDeleteNote(opts) {
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const { wsRoot } = engine;
    const { noteId } = opts;
    const noteToDelete = (await engine.getNoteMeta(noteId)).data;
    const fsPath = getNoteUri({ note: noteToDelete, wsRoot }).fsPath;
    const deleteCmd = new DeleteCommand_1.DeleteCommand();
    const deleteOpts = {
        fsPath,
        noConfirm: true,
    };
    await deleteCmd.execute(deleteOpts);
}
async function getFullTree(opts) {
    const { root, provider } = opts;
    const children = await provider.getChildren(root);
    const childNodes = await Promise.all(children.map(async (child) => {
        const tree = await getFullTree({
            root: child,
            provider,
            extra: opts.extra,
        });
        return tree;
    }));
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const rootNote = (await engine.getNote(root)).data;
    const res = { fname: rootNote.fname, childNodes };
    if (opts.extra) {
        const extraKeys = lodash_1.default.keys(opts.extra);
        extraKeys.forEach((key) => {
            if (opts.extra && opts.extra[key]) {
                const value = rootNote[key];
                if (value !== undefined) {
                    lodash_1.default.set(res, key, rootNote[key]);
                }
            }
        });
    }
    return res;
}
suite("NativeTreeView tests", function () {
    this.timeout(4000);
    (0, mocha_1.describe)("Rename Note Command interactions", function () {
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note with top level hierarchy", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                    genRandomId: true,
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const childrenBefore = await provider.getChildren(vaultOneRootPropsBefore);
                const resp = await Promise.all(childrenBefore.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(resp).toEqual(["foo"]);
                await runRenameNote({
                    noteId: childrenBefore[0],
                    newName: "fooz",
                });
                const childrenAfter = await provider.getChildren(vaultOneRootPropsBefore);
                const result = await Promise.all(childrenAfter.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(result).toEqual(["fooz"]);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note with stub parent", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar",
                    genRandomId: true,
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const vaultOneRootId = propsBefore[0];
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const childrenBefore = await provider.getChildren(vaultOneRootPropsBefore);
                const resp1 = await Promise.all(childrenBefore.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(resp1).toEqual(["foo"]);
                const grandChildrenBefore = await provider.getChildren(childrenBefore[0]);
                const resp2 = await Promise.all(grandChildrenBefore.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp2).toEqual(["foo.bar"]);
                await runRenameNote({
                    noteId: grandChildrenBefore[0],
                    newName: "foo.baz",
                });
                const vault1RootPropsAfter = (await engine.getNote(vaultOneRootId))
                    .data;
                const childrenAfter = await provider.getChildren(vault1RootPropsAfter?.id);
                const resp3 = await Promise.all(childrenAfter.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(resp3).toEqual(["foo"]);
                const grandChildrenAfter = await provider.getChildren(childrenAfter[0]);
                const resp4 = await Promise.all(grandChildrenAfter.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp4).toEqual(["foo.baz"]);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming a note to an existing stub that has a stub parent and any children", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar.baz",
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "dummy",
                    body: "this is some dummy content",
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "dummy",
                            childNodes: [],
                        },
                        {
                            fname: "foo",
                            stub: true,
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    stub: true,
                                    childNodes: [
                                        {
                                            fname: "foo.bar.baz",
                                            childNodes: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
                await runRenameNote({
                    noteId: "dummy",
                    newName: "foo.bar",
                });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            stub: true,
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [
                                        {
                                            fname: "foo.bar.baz",
                                            childNodes: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note with stub parent and any children", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar.baz",
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar",
                    body: "this is some dummy content",
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            stub: true,
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [
                                        {
                                            fname: "foo.bar.baz",
                                            childNodes: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
                await runRenameNote({
                    noteId: "foo.bar",
                    newName: "dummy",
                });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "dummy",
                            childNodes: [],
                        },
                        {
                            fname: "foo",
                            stub: true,
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    stub: true,
                                    childNodes: [
                                        {
                                            fname: "foo.bar.baz",
                                            childNodes: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note with non-stub parent", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar",
                    genRandomId: true,
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const vaultOneRootPropsBefore = propsBefore[0];
                const vaultOneRootId = propsBefore[0];
                const childrenBefore = await provider.getChildren(vaultOneRootPropsBefore);
                const resp = await Promise.all(childrenBefore.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(resp).toEqual(["foo"]);
                const grandChildrenBefore = await provider.getChildren(childrenBefore[0]);
                const resp2 = await Promise.all(grandChildrenBefore.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp2).toEqual(["foo.bar"]);
                await runRenameNote({
                    noteId: grandChildrenBefore[0],
                    newName: "foo.baz",
                });
                const vault1RootPropsAfter = (await engine.getNote(vaultOneRootId))
                    .data;
                const childrenAfter = await provider.getChildren(vault1RootPropsAfter?.id);
                const resp3 = await Promise.all(childrenAfter.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(resp3).toEqual(["foo"]);
                const grandChildrenAfter = await provider.getChildren(childrenAfter[0]);
                const resp4 = await Promise.all(grandChildrenAfter.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp4).toEqual(["foo.baz"]);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note with stub children", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar.egg",
                    genRandomId: true,
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const vaultOneRootPropsBefore = propsBefore[0];
                const vaultOneRootId = propsBefore[0];
                const childrenBefore = await provider.getChildren(vaultOneRootPropsBefore);
                const resp1 = await Promise.all(childrenBefore.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(resp1).toEqual(["foo"]);
                const grandChildrenBefore = await provider.getChildren(childrenBefore[0]);
                const resp2 = await Promise.all(grandChildrenBefore.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp2).toEqual(["foo.bar"]);
                const greatGrandChildrenBefore = await provider.getChildren(grandChildrenBefore[0]);
                const resp3 = await Promise.all(greatGrandChildrenBefore.map(async (ggchild) => (await engine.getNote(ggchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp3).toEqual(["foo.bar.egg"]);
                await runRenameNote({
                    noteId: childrenBefore[0],
                    newName: "fooz",
                });
                const vault1RootPropsAfter = (await engine.getNote(vaultOneRootId))
                    .data;
                const childrenAfter = await provider.getChildren(vault1RootPropsAfter?.id);
                const resp4 = await Promise.all(childrenAfter.map(async (child) => {
                    const data = (await engine.getNote(child)).data;
                    return { fname: data?.fname, stub: data?.stub };
                }));
                (0, testUtilsv2_1.expect)(resp4).toEqual([
                    { fname: "foo", stub: true },
                    { fname: "fooz", stub: undefined },
                ]);
                const grandChildrenAfter = await provider.getChildren(childrenAfter[0]);
                const resp5 = await Promise.all(grandChildrenAfter.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp5).toEqual(["foo.bar"]);
                const greatGrandChildrenAfter = await provider.getChildren(grandChildrenAfter[0]);
                const resp6 = await Promise.all(greatGrandChildrenAfter.map(async (ggchild) => (await engine.getNote(ggchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp6).toEqual(["foo.bar.egg"]);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note with non-stub children", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar",
                    genRandomId: true,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.baz",
                    genRandomId: true,
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const vaultOneRootPropsBefore = propsBefore[0];
                const vaultOneRootId = propsBefore[0];
                const childrenBefore = await provider.getChildren(vaultOneRootPropsBefore);
                const resp1 = await Promise.all(childrenBefore.map(async (child) => (await engine.getNote(child)).data?.fname));
                (0, testUtilsv2_1.expect)(resp1).toEqual(["foo"]);
                const grandChildrenBefore = await provider.getChildren(childrenBefore[0]);
                const resp2 = await Promise.all(grandChildrenBefore.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp2).toEqual(["foo.bar", "foo.baz"]);
                await runRenameNote({
                    noteId: childrenBefore[0],
                    newName: "fooz",
                });
                const vault1RootPropsAfter = (await engine.getNote(vaultOneRootId))
                    .data;
                const childrenAfter = await provider.getChildren(vault1RootPropsAfter?.id);
                const resp4 = await Promise.all(childrenAfter.map(async (child) => {
                    const data = (await engine.getNote(child)).data;
                    return { fname: data?.fname, stub: data?.stub };
                }));
                (0, testUtilsv2_1.expect)(resp4).toEqual([
                    { fname: "foo", stub: true },
                    { fname: "fooz", stub: undefined },
                ]);
                const grandChildrenAfter = await provider.getChildren(childrenAfter[0]);
                const resp5 = await Promise.all(grandChildrenAfter.map(async (gchild) => (await engine.getNote(gchild)).data?.fname));
                (0, testUtilsv2_1.expect)(resp5).toEqual(["foo.bar", "foo.baz"]);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note with a chain of ancestors that are only stubs", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "one.two.three.foo",
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const vaultOneRootPropsBefore = propsBefore[0];
                const vaultOneRootId = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [
                                                {
                                                    fname: "one.two.three.foo",
                                                    childNodes: [],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
                await runRenameNote({
                    noteId: "one.two.three.foo",
                    newName: "zero",
                });
                const vaultOneRootPropsAfter = (await engine.getNote(vaultOneRootId))
                    .data;
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter?.id,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "zero",
                            childNodes: [],
                        },
                    ],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note results in a chain of stub ancestors", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const vaultOneRootPropsBefore = propsBefore[0];
                const vaultOneRootId = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                    ],
                });
                await runRenameNote({
                    noteId: "foo",
                    newName: "one.two.three.foo",
                });
                const vaultOneRootPropsAfter = (await engine.getNote(vaultOneRootId))
                    .data;
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter?.id,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [
                                                {
                                                    fname: "one.two.three.foo",
                                                    childNodes: [],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN renaming note to replace an existing stub note", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "one.two.three",
                });
            },
        }, () => {
            test("THEN tree view correctly displays renamed note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const vaultOneRootPropsBefore = propsBefore[0];
                const vaultOneRootId = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
                await runRenameNote({
                    noteId: "foo",
                    newName: "one",
                });
                const vaultOneRootPropsAfter = (await engine.getNote(vaultOneRootId))
                    .data;
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter?.id,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
                const foo = (await engine.getNoteMeta("foo")).data;
                (0, testUtilsv2_1.expect)(foo.stub).toBeFalsy();
            });
        });
    });
    (0, mocha_1.describe)("Delete Note Command interactions", function () {
        (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note with top level hierarchy", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                });
            },
        }, () => {
            test("THEN tree view correctly removes deleted note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                    ],
                });
                await runDeleteNote({ noteId: "foo" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note with stub parent", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar",
                });
            },
        }, () => {
            test("THEN tree view correctly removes deleted note and stub parent", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [],
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
                await runDeleteNote({ noteId: "foo.bar" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note with non-stub parent", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar",
                });
            },
        }, () => {
            test("THEN tree view correctly removes deleted note", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [],
                                },
                            ],
                        },
                    ],
                });
                await runDeleteNote({ noteId: "foo.bar" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                    ],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note with stub children", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar.egg",
                });
            },
        }, () => {
            test("THEN tree view correctly removes deleted note and replaces it with a stub", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [
                                        {
                                            fname: "foo.bar.egg",
                                            childNodes: [],
                                        },
                                    ],
                                    stub: true,
                                },
                            ],
                        },
                    ],
                });
                await runDeleteNote({ noteId: "foo" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [
                                        {
                                            fname: "foo.bar.egg",
                                            childNodes: [],
                                        },
                                    ],
                                    stub: true,
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note with non-stub children", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.bar",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo.baz",
                });
            },
        }, () => {
            test("THEN tree view correctly removes deleted note and replaces it with a stub", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [],
                                },
                                {
                                    fname: "foo.baz",
                                    childNodes: [],
                                },
                            ],
                        },
                    ],
                });
                await runDeleteNote({ noteId: "foo" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [
                                {
                                    fname: "foo.bar",
                                    childNodes: [],
                                },
                                {
                                    fname: "foo.baz",
                                    childNodes: [],
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note with chain of ancestors that are only stubs", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "one.two.three.foo",
                });
            },
        }, () => {
            test("THEN tree view correctly removes deleted note and all its ancestor stubs", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [
                                                {
                                                    fname: "one.two.three.foo",
                                                    childNodes: [],
                                                },
                                            ],
                                            stub: true,
                                        },
                                    ],
                                    stub: true,
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
                await runDeleteNote({ noteId: "one.two.three.foo" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [],
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note that was just created", {
            preSetupHook: async (opts) => {
                const { wsRoot, vaults } = opts;
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                });
            },
        }, () => {
            (0, mocha_1.describe)("AND created note is top hierarchy", () => {
                test("THEN tree view correctly removes deleted note", async () => {
                    const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                    const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                        wsRoot,
                        vault: vaults[0],
                        fname: "bar",
                        engine,
                    });
                    const propsBefore = await provider.getChildren();
                    const vaultOneRootPropsBefore = propsBefore[0];
                    const fullTreeBefore = await getFullTree({
                        root: vaultOneRootPropsBefore,
                        provider,
                        extra: { stub: true },
                    });
                    (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                        fname: "root",
                        childNodes: [
                            {
                                fname: "bar",
                                childNodes: [],
                            },
                            {
                                fname: "foo",
                                childNodes: [],
                            },
                        ],
                    });
                    await runDeleteNote({ noteId: "bar" });
                    const propsAfter = await provider.getChildren();
                    const vaultOneRootPropsAfter = propsAfter[0];
                    const fullTreeAfter = await getFullTree({
                        root: vaultOneRootPropsAfter,
                        provider,
                    });
                    (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                        fname: "root",
                        childNodes: [
                            {
                                fname: "foo",
                                childNodes: [],
                            },
                        ],
                    });
                });
            });
        });
        (0, mocha_1.describe)("AND created note also creates stub parent", () => {
            test("THEN tree view correctly removes deleted note and stub parent", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    wsRoot,
                    vault: vaults[0],
                    fname: "bar.egg",
                    engine,
                });
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "bar",
                            childNodes: [
                                {
                                    fname: "bar.egg",
                                    childNodes: [],
                                },
                            ],
                            stub: true,
                        },
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                    ],
                });
                await runDeleteNote({ noteId: "bar.egg" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                    ],
                });
            });
        });
        (0, mocha_1.describe)("AND created note has stub children", () => {
            test("THEN tree view correctly removes deleted note and replaces it with a stub", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    wsRoot,
                    vault: vaults[0],
                    fname: "one.two.three",
                    engine,
                });
                await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    wsRoot,
                    vault: vaults[0],
                    fname: "one.two",
                    engine,
                });
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [],
                                        },
                                    ],
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
                await runDeleteNote({ noteId: "one.two" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "foo",
                            childNodes: [],
                        },
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [],
                                        },
                                    ],
                                    stub: true,
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN deleting note that was just renamed", {}, () => {
        (0, mocha_1.beforeEach)(async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                wsRoot,
                vault: vaults[0],
                fname: "foo",
                engine,
            });
        });
        (0, mocha_1.describe)("AND renamed note is top hierarchy", () => {
            test("THEN tree view correctly removes note that was just renamed and deleted", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                await runRenameNote({
                    noteId: "foo",
                    newName: "bar",
                });
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "bar",
                            childNodes: [],
                        },
                    ],
                });
                await runDeleteNote({
                    noteId: "foo",
                });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [],
                });
            });
        });
        (0, mocha_1.describe)("AND renamed note created a stub parent", () => {
            test("THEN tree view correctly removes note that was just renamed and deleted as well as the stub parent", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                await runRenameNote({
                    noteId: "foo",
                    newName: "one.two.three.foo",
                });
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [
                                                {
                                                    fname: "one.two.three.foo",
                                                    childNodes: [],
                                                },
                                            ],
                                            stub: true,
                                        },
                                    ],
                                    stub: true,
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
                await runDeleteNote({
                    noteId: "foo",
                });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [],
                });
            });
        });
        (0, mocha_1.describe)("AND renamed note has any children", () => {
            test("THEN THEN tree view correctly removes note that was just renamed and deleted and replaces it with a stub", async () => {
                const provider = inject_1.container.resolve(EngineNoteProvider_1.EngineNoteProvider);
                const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                    wsRoot,
                    vault: vaults[0],
                    fname: "one.two.three.foo",
                    engine,
                });
                await runRenameNote({
                    noteId: "foo",
                    newName: "one.two.three",
                });
                const propsBefore = await provider.getChildren();
                const vaultOneRootPropsBefore = propsBefore[0];
                const fullTreeBefore = await getFullTree({
                    root: vaultOneRootPropsBefore,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeBefore).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [
                                                {
                                                    fname: "one.two.three.foo",
                                                    childNodes: [],
                                                },
                                            ],
                                        },
                                    ],
                                    stub: true,
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
                await runDeleteNote({ noteId: "foo" });
                const propsAfter = await provider.getChildren();
                const vaultOneRootPropsAfter = propsAfter[0];
                const fullTreeAfter = await getFullTree({
                    root: vaultOneRootPropsAfter,
                    provider,
                    extra: { stub: true },
                });
                (0, testUtilsv2_1.expect)(fullTreeAfter).toEqual({
                    fname: "root",
                    childNodes: [
                        {
                            fname: "one",
                            childNodes: [
                                {
                                    fname: "one.two",
                                    childNodes: [
                                        {
                                            fname: "one.two.three",
                                            childNodes: [
                                                {
                                                    fname: "one.two.three.foo",
                                                    childNodes: [],
                                                },
                                            ],
                                            stub: true,
                                        },
                                    ],
                                    stub: true,
                                },
                            ],
                            stub: true,
                        },
                    ],
                });
            });
        });
    });
});
//# sourceMappingURL=NativeTreeView.test.js.map