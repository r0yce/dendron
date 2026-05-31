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
/* eslint-disable no-undef */
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const Doctor_1 = require("../../commands/Doctor");
const ReloadIndex_1 = require("../../commands/ReloadIndex");
const PodControls_1 = require("../../components/pods/PodControls");
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
suite("DoctorCommandTest", function () {
    // TODO: Add back in once doctor is refactored
    testUtilsV3_1.describeMultiWS.skip("GIVEN bad frontmatter", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN fix frontmatter", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // create files without frontmatter
            const vaultDirRoot = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]));
            const testFile = path_1.default.join(vaultDirRoot, "bar.md");
            fs_extra_1.default.writeFileSync(testFile, "bar", { encoding: "utf8" });
            const testFile2 = path_1.default.join(vaultDirRoot, "baz.md");
            fs_extra_1.default.writeFileSync(testFile2, "baz", { encoding: "utf8" });
            // reload
            await new ReloadIndex_1.ReloadIndexCommand().run();
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.FIX_FRONTMATTER,
                scope: "workspace",
            }));
            await cmd.run();
            // check that frontmatter is added
            const resp = fs_extra_1.default.readFileSync(testFile, { encoding: "utf8" });
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM.exec(resp)).toBeTruthy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_UPDATED.exec(resp)).toBeTruthy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_CREATED.exec(resp)).toBeTruthy();
            const resp2 = fs_extra_1.default.readFileSync(testFile2, { encoding: "utf8" });
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM.exec(resp2)).toBeTruthy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_UPDATED.exec(resp2)).toBeTruthy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_CREATED.exec(resp2)).toBeTruthy();
        });
    });
    // TODO: Add back in once doctor is refactored
    testUtilsV3_1.describeMultiWS.skip("AND when scoped to file", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN fix frontmatter", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultDirRoot = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]));
            const testFile = path_1.default.join(vaultDirRoot, "bar.md");
            fs_extra_1.default.writeFileSync(testFile, "bar", { encoding: "utf8" });
            const testFile2 = path_1.default.join(vaultDirRoot, "baz.md");
            fs_extra_1.default.writeFileSync(testFile2, "baz", { encoding: "utf8" });
            // reload and run
            await new ReloadIndex_1.ReloadIndexCommand().run();
            const testFileUri = vscode.Uri.file(testFile);
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(testFileUri);
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.FIX_FRONTMATTER,
                scope: "file",
            }));
            await cmd.run();
            // check that frontmatter is added
            const resp = fs_extra_1.default.readFileSync(testFile, { encoding: "utf8" });
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM.exec(resp)).toBeTruthy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_UPDATED.exec(resp)).toBeTruthy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_CREATED.exec(resp)).toBeTruthy();
            const resp2 = fs_extra_1.default.readFileSync(testFile2, { encoding: "utf8" });
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM.exec(resp2)).toBeFalsy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_UPDATED.exec(resp2)).toBeFalsy();
            (0, testUtilsv2_1.expect)(common_all_1.NoteUtils.RE_FM_CREATED.exec(resp2)).toBeFalsy();
        });
    });
    let note;
    (0, testUtilsV3_1.describeMultiWS)("GIVEN bad note id", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            note = await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                fname: "test",
                vault: vaults[0],
                props: {
                    id: "-bad-id",
                },
            });
        },
    }, () => {
        test("THEN fix id", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await WSUtils_1.WSUtils.openNote(note);
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.FIX_FRONTMATTER,
                scope: "file",
            }));
            await cmd.run();
            note = (await engine.findNotesMeta({ fname: "test", vault: vaults[0] }))[0];
            (0, testUtilsv2_1.expect)(note.id === "-bad-id").toBeFalsy();
        });
    });
});
suite("CREATE_MISSING_LINKED_NOTES", function () {
    (0, testUtilsV3_1.describeMultiWS)("AND when cancelled", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout: 5e3,
    }, () => {
        test("THEN create no notes", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = vaults[0];
            const file = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "real",
                body: "[[real.fake]]\n",
                vault,
                wsRoot,
            });
            await WSUtils_1.WSUtils.openNote(file);
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
                scope: "file",
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("cancelled"));
                await cmd.run();
                const vaultPath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                const containsNew = lodash_1.default.includes(fs_extra_1.default.readdirSync(vaultPath), "real.fake.md");
                (0, testUtilsv2_1.expect)(containsNew).toBeFalsy();
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN broken link with alias", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout: 5e3,
    }, () => {
        test("THEN fix link", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = vaults[0];
            const file = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "real",
                body: [
                    "[[something|real.fake]]",
                    "[[something something|real.something]]",
                ].join("\n"),
                vault,
                wsRoot,
            });
            await WSUtils_1.WSUtils.openNote(file);
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
                scope: "file",
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("proceed"));
                await cmd.run();
                const vaultPath = (0, common_server_1.vault2Path)({ vault, wsRoot });
                const fileNames = ["real.fake.md", "real.something.md"];
                lodash_1.default.forEach(fileNames, (fileName) => {
                    const containsNew = lodash_1.default.includes(fs_extra_1.default.readdirSync(vaultPath), fileName);
                    (0, testUtilsv2_1.expect)(containsNew).toBeTruthy();
                });
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN xvault broken links", {
        preSetupHook: async (opts) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
        },
    }, () => {
        test("THEN fix links", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault1 = vaults[0];
            const vault2 = vaults[1];
            const file = await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "first",
                body: [
                    "[[dendron://vault2/second]]",
                    "[[somenote|dendron://vault2/somenote]]",
                    "[[some note|dendron://vault2/something]]",
                ].join("\n"),
                vault: vault1,
                wsRoot,
            });
            await WSUtils_1.WSUtils.openNote(file);
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
                scope: "file",
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("proceed"));
                await cmd.run();
                const sVaultPath = (0, common_server_1.vault2Path)({ vault: vault1, wsRoot });
                const xVaultPath = (0, common_server_1.vault2Path)({ vault: vault2, wsRoot });
                const fileNames = ["second.md", "somenote.md", "something.md"];
                lodash_1.default.forEach(fileNames, (fileName) => {
                    const inSVault = lodash_1.default.includes(fs_extra_1.default.readdirSync(sVaultPath), fileName);
                    const inXVault = lodash_1.default.includes(fs_extra_1.default.readdirSync(xVaultPath), fileName);
                    (0, testUtilsv2_1.expect)(inSVault).toBeFalsy();
                    (0, testUtilsv2_1.expect)(inXVault).toBeTruthy();
                });
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN missing vault prefix", {
        preSetupHook: async (opts) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
        },
    }, () => {
        test("THEN do nothing", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault1 = vaults[0];
            const vault2 = vaults[1];
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "first",
                body: [
                    "[[broken]]",
                    "[[somenote|somenote]]",
                    "[[some note|something]]",
                ].join("\n"),
                vault: vault1,
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "second",
                body: [
                    "[[broken2]]",
                    "[[somenote|somenote2]]",
                    "[[some note|something2]]",
                ].join("\n"),
                vault: vault2,
                wsRoot,
            });
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
                scope: "workspace",
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("proceed"));
                await cmd.run();
                const firstVaultPath = (0, common_server_1.vault2Path)({ vault: vault1, wsRoot });
                const firstVaultFileNames = [
                    "broken.md",
                    "somenote.md",
                    "something.md",
                ];
                lodash_1.default.forEach(firstVaultFileNames, (fileName) => {
                    const containsNew = lodash_1.default.includes(fs_extra_1.default.readdirSync(firstVaultPath), fileName);
                    (0, testUtilsv2_1.expect)(containsNew).toBeFalsy();
                });
                const secondVaultPath = (0, common_server_1.vault2Path)({ vault: vault2, wsRoot });
                const secondVaultFileNames = [
                    "broken2.md",
                    "somenote2.md",
                    "something2.md",
                ];
                lodash_1.default.forEach(secondVaultFileNames, (fileName) => {
                    const containsNew = lodash_1.default.includes(fs_extra_1.default.readdirSync(secondVaultPath), fileName);
                    (0, testUtilsv2_1.expect)(containsNew).toBeFalsy();
                });
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN broken links in multiple vaults with workspace scope", {
        preSetupHook: async (opts) => {
            await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
        },
        // this test can take up to 3s to run
        timeout: 3e3,
    }, () => {
        test("THEN fix all links", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault1 = vaults[0];
            const vault2 = vaults[1];
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "first",
                body: [
                    "[[dendron://vault2/cross2]]",
                    "[[dendron://vault1/broken]]",
                    "[[somenote|dendron://vault1/somenote]]",
                    "[[some note|dendron://vault1/something]]",
                ].join("\n"),
                vault: vault1,
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "second",
                body: [
                    "[[dendron://vault1/cross1]]",
                    "[[dendron://vault2/broken2]]",
                    "[[somenote|dendron://vault2/somenote2]]",
                    "[[some note|dendron://vault2/something2]]",
                ].join("\n"),
                vault: vault2,
                wsRoot,
            });
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
                scope: "workspace",
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("proceed"));
                await cmd.run();
                const firstVaultPath = (0, common_server_1.vault2Path)({ vault: vault1, wsRoot });
                const firstVaultFileNames = [
                    "cross1.md",
                    "broken.md",
                    "somenote.md",
                    "something.md",
                ];
                lodash_1.default.forEach(firstVaultFileNames, (fileName) => {
                    const containsNew = lodash_1.default.includes(fs_extra_1.default.readdirSync(firstVaultPath), fileName);
                    (0, testUtilsv2_1.expect)(containsNew).toBeTruthy();
                });
                const secondVaultPath = (0, common_server_1.vault2Path)({ vault: vault2, wsRoot });
                const secondVaultFileNames = [
                    "cross2.md",
                    "broken2.md",
                    "somenote2.md",
                    "something2.md",
                ];
                lodash_1.default.forEach(secondVaultFileNames, (fileName) => {
                    const containsNew = lodash_1.default.includes(fs_extra_1.default.readdirSync(secondVaultPath), fileName);
                    (0, testUtilsv2_1.expect)(containsNew).toBeTruthy();
                });
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
});
suite("REGENERATE_NOTE_ID", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN file scope", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN fix file", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = vaults[0];
            const oldNote = (await engine.findNotesMeta({
                fname: "foo",
                vault,
            }))[0];
            const oldId = oldNote.id;
            await WSUtils_1.WSUtils.openNote(oldNote);
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.REGENERATE_NOTE_ID,
                scope: "file",
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("proceed"));
                await cmd.run();
                const note = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
                (0, testUtilsv2_1.expect)(note?.id).toNotEqual(oldId);
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN workspace scoped", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN regenerate note id", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = vaults[0];
            const oldRootId = (await engine.findNotesMeta({
                fname: "root",
                vault,
            }))[0].id;
            const oldFooId = (await engine.findNotesMeta({
                fname: "foo",
                vault,
            }))[0].id;
            const oldBarId = (await engine.findNotesMeta({
                fname: "bar",
                vault,
            }))[0].id;
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.REGENERATE_NOTE_ID,
                scope: "workspace",
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("proceed"));
                await cmd.run();
                const root = (await engine.findNotesMeta({ fname: "root", vault }))[0];
                const foo = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
                const bar = (await engine.findNotesMeta({ fname: "bar", vault }))[0];
                // Root should not change
                (0, testUtilsv2_1.expect)(root?.id).toEqual(oldRootId);
                (0, testUtilsv2_1.expect)(foo?.id).toNotEqual(oldFooId);
                (0, testUtilsv2_1.expect)(bar?.id).toNotEqual(oldBarId);
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a note as an argument", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN fix the provided note", async () => {
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = vaults[0];
            const oldNote = (await engine.findNotes({
                fname: "foo",
                vault,
            }))[0];
            const oldId = oldNote.id;
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.REGENERATE_NOTE_ID,
                scope: "file",
                data: { note: oldNote },
            }));
            const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            try {
                quickPickStub
                    .onCall(0)
                    .returns(Promise.resolve("proceed"));
                await cmd.run();
                const note = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
                (0, testUtilsv2_1.expect)(note?.id).toNotEqual(oldId);
            }
            finally {
                gatherInputsStub.restore();
                quickPickStub.restore();
            }
        });
    });
});
suite("FIND_INCOMPATIBLE_EXTENSIONS", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN findIncompatibleExtensions selected", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN reload is not called", async () => {
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(extension);
            const reloadSpy = sinon_1.default.spy(cmd, "reload");
            await cmd.execute({
                action: Doctor_1.PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
                scope: "workspace",
            });
            (0, testUtilsv2_1.expect)(reloadSpy.called).toBeFalsy();
        });
        test("THEN List all as not installed if found none", async () => {
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(extension);
            const previewSpy = sinon_1.default.spy(cmd, "showIncompatibleExtensionPreview");
            await cmd.execute({
                action: Doctor_1.PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
                scope: "workspace",
            });
            const out = await previewSpy.returnValues[0];
            (0, testUtilsv2_1.expect)(out.installStatus.every((status) => !status.installed)).toBeTruthy();
            (0, testUtilsv2_1.expect)(previewSpy.calledOnce).toBeTruthy();
        });
        test("THEN List all extension that are incompatible", async () => {
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new Doctor_1.DoctorCommand(extension);
            const previewSpy = sinon_1.default.spy(cmd, "showIncompatibleExtensionPreview");
            await cmd.execute({
                action: Doctor_1.PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
                scope: "workspace",
                data: {
                    installStatus: constants_1.INCOMPATIBLE_EXTENSIONS.map((id) => {
                        return {
                            id,
                            installed: true,
                        };
                    }),
                },
            });
            const out = await previewSpy.returnValues[0];
            (0, testUtilsv2_1.expect)(out.installStatus.every((status) => status.installed)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body: out.contents,
                match: ["[View Extension]"],
                nomatch: ["Not Installed"],
            })).toBeTruthy();
        });
    });
});
suite("FIX_AIRTABLE_METADATA", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN fixAirtableMetadata selected", {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                fname: "foo.bar",
                vault: vaults[0],
                custom: {
                    airtableId: "airtableId-one",
                },
            });
        },
    }, () => {
        test("THEN remove airtableId from note FM and update it with pods namespace", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const engine = ext.getEngine();
            const cmd = new Doctor_1.DoctorCommand(ext);
            const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                action: engine_server_1.DoctorActionsEnum.FIX_AIRTABLE_METADATA,
                scope: "workspace",
            }));
            const hierarchyQuickPickStub = sinon_1.default.stub(cmd, "getHierarchy");
            const podIdQuickPickStub = sinon_1.default.stub(PodControls_1.PodUIControls, "promptToSelectCustomPodId");
            try {
                hierarchyQuickPickStub
                    .onFirstCall()
                    .returns(Promise.resolve({ hierarchy: "foo.bar", vault: engine.vaults[0] }));
                podIdQuickPickStub.onCall(0).returns(Promise.resolve("dendron.task"));
                await cmd.run();
                const note = (await engine.getNoteMeta("foo.bar")).data;
                (0, testUtilsv2_1.expect)(note?.custom.airtableId).toBeFalsy();
                (0, testUtilsv2_1.expect)(note?.custom.pods.airtable["dendron.task"]).toEqual("airtableId-one");
            }
            finally {
                gatherInputsStub.restore();
                hierarchyQuickPickStub.restore();
                podIdQuickPickStub.restore();
            }
        });
    });
});
suite("FIX_INVALID_FILENAMES", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN workspace with with invalid file", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                fname: "bar..'(foo,)'",
                vault: vaults[0],
            });
        },
    }, () => {
        (0, mocha_1.describe)("WHEN FIX_INVALID_FILENAMES is run", () => {
            test("THEN notes with invalid file name is correctly renamed", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const engine = ext.getEngine();
                const getNoteResp = await engine.getNote("bar..'(foo,)'");
                (0, testUtilsv2_1.expect)(getNoteResp.error).toBeFalsy();
                const invalidNote = getNoteResp.data;
                (0, testUtilsv2_1.expect)(invalidNote?.fname).toEqual("bar..'(foo,)'");
                const cmd = new Doctor_1.DoctorCommand(ext);
                const gatherInputsStub = sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                    action: engine_server_1.DoctorActionsEnum.FIX_INVALID_FILENAMES,
                    scope: "workspace",
                }));
                const quickPickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
                try {
                    quickPickStub
                        .onCall(0)
                        .returns(Promise.resolve("proceed"));
                    await cmd.run();
                    const getNoteResp2 = await engine.getNote("bar..'(foo,)'");
                    (0, testUtilsv2_1.expect)(getNoteResp2.error).toBeFalsy();
                    const postRunNote = getNoteResp2.data;
                    (0, testUtilsv2_1.expect)(postRunNote?.fname).toEqual("bar.foo");
                }
                finally {
                    gatherInputsStub.restore();
                    quickPickStub.restore();
                }
            });
        });
    });
});
//# sourceMappingURL=DoctorCommand.test.js.map