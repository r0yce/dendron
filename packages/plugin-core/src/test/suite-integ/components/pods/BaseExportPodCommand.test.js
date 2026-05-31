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
const pods_core_1 = require("@dendronhq/pods-core");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const PodControls_1 = require("../../../../components/pods/PodControls");
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const vsCodeUtils_1 = require("../../../../vsCodeUtils");
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
const TestExportCommand_1 = require("./TestExportCommand");
const stubQuickPick = (vault) => {
    // @ts-ignore
    vsCodeUtils_1.VSCodeUtils.showQuickPick = () => {
        return { data: vault };
    };
};
suite("BaseExportPodCommand", function () {
    (0, mocha_1.describe)("GIVEN a BaseExportPodCommand implementation", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN exporting a note scope", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN note prop should be in the export payload", async () => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "root.md");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const payload = await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.Note,
                });
                (0, testUtilsv2_1.expect)((payload?.payload)[0].fname).toEqual("root");
                (0, testUtilsv2_1.expect)((payload?.payload).length).toEqual(1);
            });
            test("AND note is dirty, THEN a onDidSaveTextDocument should be fired", (done) => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const testNote = common_all_1.NoteUtils.create({
                    fname: "foo",
                    vault: vaults[0],
                });
                const textToAppend = "BaseExportPodCommand testing";
                // onEngineNoteStateChanged is not being triggered by save so test to make sure that save is being triggered instead
                const disposable = vscode.workspace.onDidSaveTextDocument((textDocument) => {
                    (0, common_test_utils_1.testAssertsInsideCallback)(() => {
                        (0, testUtilsv2_1.expect)(textDocument.getText().includes(textToAppend)).toBeTruthy();
                        (0, testUtilsv2_1.expect)(textDocument.fileName.endsWith("foo.md")).toBeTruthy();
                        disposable.dispose();
                        cmd.dispose();
                    }, done);
                });
                ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openNote(testNote)
                    .then(async (editor) => {
                    editor
                        .edit(async (editBuilder) => {
                        const line = editor.document.getText().split("\n").length;
                        editBuilder.insert(new vscode.Position(line, 0), textToAppend);
                    })
                        .then(async () => {
                        cmd.run();
                    });
                });
            });
            test("AND note is clean, THEN a onDidSaveTextDocument should not be fired", (done) => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const testNote = common_all_1.NoteUtils.create({
                    fname: "foo",
                    vault: vaults[0],
                });
                const disposable = vscode.workspace.onDidSaveTextDocument(() => {
                    (0, common_all_1.assert)(false, "Callback not expected");
                });
                ExtensionProvider_1.ExtensionProvider.getWSUtils()
                    .openNote(testNote)
                    .then(async () => {
                    cmd.run();
                });
                // Small sleep to ensure callback doesn't fire.
                (0, testUtilsV3_1.waitInMilliseconds)(10).then(async () => {
                    disposable.dispose();
                    done();
                });
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN exporting a hierarchy scope", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti({ wsRoot, vaults });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[1],
                    fname: "foo.test",
                });
            },
        }, () => {
            test("THEN hierarchy note props should be in the export payload AND a note with a hierarchy match but in a different vault should not appear", async () => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const payload = await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.Hierarchy,
                });
                // 'foo' note and its child: foo.test should not appear
                (0, testUtilsv2_1.expect)(payload?.payload.length).toEqual(2);
            });
            (0, mocha_1.after)(() => {
                sinon_1.default.restore();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN exporting a workspace scope", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN workspace note props should be in the export payload", async () => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const payload = await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.Workspace,
                });
                (0, testUtilsv2_1.expect)(payload?.payload.length).toEqual(6);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN exporting a lookup based scope", {
            preSetupHook: async ({ wsRoot, vaults }) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "test-note-for-pod1",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "test-note-for-pod2",
                });
            },
        }, () => {
            let sandbox;
            (0, mocha_1.beforeEach)(() => {
                sandbox = sinon_1.default.createSandbox();
            });
            (0, mocha_1.afterEach)(() => {
                sandbox.restore();
            });
            test("THEN lookup is prompted and lookup result should be the export payload", async () => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const { vaults } = engine;
                const testNote1 = (await engine.findNotes({
                    fname: "test-note-for-pod1",
                    vault: vaults[0],
                }))[0];
                const testNote2 = (await engine.findNotes({
                    fname: "test-note-for-pod2",
                    vault: vaults[0],
                }))[0];
                const selectedItems = [
                    { ...testNote1, label: "" },
                    { ...testNote2, label: "" },
                ];
                const lookupStub = sandbox
                    .stub(PodControls_1.PodUIControls, "promptForScopeLookup")
                    .resolves({
                    selectedItems,
                    onAcceptHookResp: [],
                });
                await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.Lookup,
                });
                (0, testUtilsv2_1.expect)(lookupStub.calledOnce).toBeTruthy();
                await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.LinksInSelection,
                });
                (0, testUtilsv2_1.expect)(lookupStub.calledTwice).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN exporting a vault scope", {
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN quickpick is prompted and selected vault's notes shoul be export payload", async () => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const { vaults } = engine;
                stubQuickPick(vaults[0]);
                const payload = await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.Vault,
                });
                (0, testUtilsv2_1.expect)(payload?.payload.length).toEqual(4);
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN exporting with selection scope", {
            postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        }, () => {
            test("THEN export payload must contain the selection as note body", async () => {
                const cmd = new TestExportCommand_1.TestExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "root.md");
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                if (editor) {
                    editor.selection = new vscode.Selection(7, 0, 8, 0);
                }
                const payload = await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.Selection,
                });
                (0, testUtilsv2_1.expect)((payload?.payload)[0].fname).toEqual("root");
                (0, testUtilsv2_1.expect)((payload?.payload).length).toEqual(1);
                (0, testUtilsv2_1.expect)(payload?.payload[0].body).toEqual("# Welcome to Dendron");
            });
        });
    });
});
//# sourceMappingURL=BaseExportPodCommand.test.js.map