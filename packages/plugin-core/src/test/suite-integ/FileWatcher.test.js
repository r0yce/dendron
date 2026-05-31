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
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const common_server_1 = require("@dendronhq/common-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const fileWatcher_1 = require("../../fileWatcher");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("GIVEN FileWatcher", function () {
    let watcher;
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => { },
    });
    (0, mocha_1.describe)("WHEN onDidCreate is configured", () => {
        (0, mocha_1.describe)("AND the default watcher was used", () => {
            test("THEN created notes are picked up by the engine", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    postSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
                    onInit: async ({ vaults, wsRoot, engine }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "newbar",
                            body: "newbar body",
                            vault: vaults[0],
                            wsRoot,
                        });
                        watcher = new fileWatcher_1.FileWatcher({
                            workspaceOpts: {
                                wsRoot,
                                vaults,
                                dendronConfig: common_server_1.DConfig.readConfigSync(wsRoot),
                            },
                        });
                        const notePath = path_1.default.join(wsRoot, vaults[0].fsPath, "newbar.md");
                        const uri = vscode.Uri.file(notePath);
                        await watcher.onDidCreate(uri.fsPath);
                        const note = (await engine.getNoteMeta("newbar")).data;
                        const root = (await engine.findNotesMeta({
                            fname: "root",
                            vault: vaults[0],
                        }))[0];
                        (0, testUtilsv2_1.expect)(note.parent).toEqual(root.id);
                        done();
                    },
                });
            });
        });
        (0, mocha_1.describe)("AND the engine watcher was used", () => {
            test("THEN created notes are picked up by the engine", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    postSetupHook: async (opts) => {
                        await engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti(opts);
                        engine_test_utils_1.TestConfigUtils.withConfig((config) => {
                            config.dev = { ...config.dev, forceWatcherType: "engine" };
                            return config;
                        }, { wsRoot: opts.wsRoot });
                    },
                    onInit: async ({ vaults, wsRoot, engine }) => {
                        await common_test_utils_1.NoteTestUtilsV4.createNote({
                            fname: "newbar",
                            body: "newbar body",
                            vault: vaults[0],
                            wsRoot,
                        });
                        watcher = new fileWatcher_1.FileWatcher({
                            workspaceOpts: {
                                wsRoot,
                                vaults,
                                dendronConfig: common_server_1.DConfig.readConfigSync(wsRoot),
                            },
                        });
                        const notePath = path_1.default.join(wsRoot, vaults[0].fsPath, "newbar.md");
                        const uri = vscode.Uri.file(notePath);
                        await watcher.onDidCreate(uri.fsPath);
                        const note = (await engine.getNoteMeta("newbar")).data;
                        const root = (await engine.findNotesMeta({
                            fname: "root",
                            vault: vaults[0],
                        }))[0];
                        (0, testUtilsv2_1.expect)(note.parent).toEqual(root.id);
                        done();
                    },
                });
            });
        });
    });
});
//# sourceMappingURL=FileWatcher.test.js.map