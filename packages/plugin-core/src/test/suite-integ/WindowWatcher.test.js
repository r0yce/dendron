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
const vsCodeUtils_1 = require("../../vsCodeUtils");
const windowWatcher_1 = require("../../windowWatcher");
const WorkspaceWatcher_1 = require("../../WorkspaceWatcher");
const WSUtils_1 = require("../../WSUtils");
const MockDendronExtension_1 = require("../MockDendronExtension");
const MockPreviewProxy_1 = require("../MockPreviewProxy");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const setupBasic = async (opts) => {
    const { wsRoot, vaults } = opts;
    await common_test_utils_1.NoteTestUtilsV4.createNote({
        fname: "bar",
        body: "bar body",
        vault: vaults[0],
        wsRoot,
    });
};
suite("WindowWatcher: GIVEN the dendron extension is running", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => { },
    });
    let watcher;
    (0, mocha_1.describe)("WHEN onDidChangeActiveTextEditor is triggered", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN check decorator", {
            postSetupHook: setupBasic,
            ctx,
        }, () => {
            test("decorators are updated", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine: ExtensionProvider_1.ExtensionProvider.getEngine(),
                    wsRoot,
                    context: ctx,
                });
                const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
                watcher = new windowWatcher_1.WindowWatcher({
                    extension: mockExtension,
                    previewProxy,
                });
                const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
                const notePath = path_1.default.join(wsRoot, vaultPath, "bar.md");
                const uri = vscode.Uri.file(notePath);
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
                await watcher.triggerUpdateDecorations(editor);
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN automaticallyShowPreview is set to false", {
            postSetupHook: setupBasic,
            ctx,
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setPreviewProps(config, "automaticallyShowPreview", false);
                return config;
            },
        }, () => {
            test("THEN preview panel is not shown", async () => {
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine: ExtensionProvider_1.ExtensionProvider.getEngine(),
                    wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
                    vaults: ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults,
                    context: ctx,
                });
                const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
                const watcher = new windowWatcher_1.WindowWatcher({
                    extension: mockExtension,
                    previewProxy,
                });
                watcher.activate();
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
                const notePath = path_1.default.join(wsRoot, vaultPath, "bar.md");
                const uri = vscode.Uri.file(notePath);
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
                (0, testUtilsv2_1.expect)(previewProxy.isOpen()).toBeFalsy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN automaticallyShowPreview is set to true", {
            postSetupHook: setupBasic,
            ctx,
            modConfigCb: (config) => {
                common_all_1.ConfigUtils.setPreviewProps(config, "automaticallyShowPreview", true);
                return config;
            },
        }, () => {
            test("THEN preview panel is shown", async () => {
                const mockExtension = new MockDendronExtension_1.MockDendronExtension({
                    engine: ExtensionProvider_1.ExtensionProvider.getEngine(),
                    wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
                    vaults: ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults,
                    context: ctx,
                });
                const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
                const watcher = new windowWatcher_1.WindowWatcher({
                    extension: mockExtension,
                    previewProxy,
                });
                watcher.activate();
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
                const notePath = path_1.default.join(wsRoot, vaultPath, "bar.md");
                const uri = vscode.Uri.file(notePath);
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
                const { onDidChangeActiveTextEditor } = watcher.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
                await onDidChangeActiveTextEditor(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor());
                (0, testUtilsv2_1.expect)(previewProxy.isOpen()).toBeTruthy();
            });
        });
    });
    // NOTE: flaky tests
    mocha_1.describe.skip("focuses end of frontmatter", () => {
        function checkPosition(line) {
            const { selection } = vsCodeUtils_1.VSCodeUtils.getSelection();
            (0, testUtilsv2_1.expect)(selection).toBeTruthy();
            (0, testUtilsv2_1.expect)(selection?.start.line).toEqual(line);
            (0, testUtilsv2_1.expect)(selection?.end.line).toEqual(line);
        }
        test("does when opening new note", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ vaults, engine }) => {
                    // Try to make sure we're opening this for the first time
                    await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                    const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const windowWatcher = new windowWatcher_1.WindowWatcher({
                        extension,
                        previewProxy,
                    });
                    const workspaceWatcher = new WorkspaceWatcher_1.WorkspaceWatcher({
                        schemaSyncService: ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService,
                        extension,
                        windowWatcher,
                    });
                    workspaceWatcher.activate(ctx);
                    watcher.activate();
                    // Open a note
                    await WSUtils_1.WSUtils.openNote((await engine.findNotesMeta({
                        fname: "root",
                        vault: vaults[0],
                    }))[0]);
                    // The selection should have been moved to after the frontmatter
                    checkPosition(7);
                    done();
                },
            });
        });
        test("does not when switching between open notes", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ vaults, engine }) => {
                    // Try to make sure we're opening this for the first time
                    await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                    const previewProxy = new MockPreviewProxy_1.MockPreviewProxy();
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const windowWatcher = new windowWatcher_1.WindowWatcher({
                        extension,
                        previewProxy,
                    });
                    const workspaceWatcher = new WorkspaceWatcher_1.WorkspaceWatcher({
                        schemaSyncService: ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService,
                        extension,
                        windowWatcher,
                    });
                    workspaceWatcher.activate(ctx);
                    watcher.activate();
                    // Open a note
                    const first = (await engine.findNotesMeta({
                        fname: "root",
                        vault: vaults[0],
                    }))[0];
                    await WSUtils_1.WSUtils.openNote(first);
                    checkPosition(7);
                    // Move the selection so it's not where it has been auto-moved
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow();
                    editor.selection = new vscode.Selection(new vscode.Position(3, 0), new vscode.Position(3, 0));
                    checkPosition(3);
                    // Switch to another note
                    const second = (await engine.findNotesMeta({
                        fname: "root",
                        vault: vaults[1],
                    }))[0];
                    await WSUtils_1.WSUtils.openNote(second);
                    checkPosition(7);
                    // Switch back to first note again
                    await WSUtils_1.WSUtils.openNote(first);
                    // The selection should not have moved
                    checkPosition(3);
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=WindowWatcher.test.js.map