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
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const PasteFile_1 = require("../../commands/PasteFile");
const utils_1 = require("../../utils");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("PasteFile", function () {
    let ctx;
    ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    test("no active editor", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async ({}) => {
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                const resp = await new PasteFile_1.PasteFileCommand().execute({
                    filePath: "foobar",
                });
                (0, testUtilsv2_1.expect)(resp?.error?.status).toEqual(common_all_1.ERROR_STATUS.INVALID_STATE);
                done();
            },
        });
    });
    test("basic", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async ({ engine, wsRoot }) => {
                const tmpRoot = common_test_utils_1.FileTestUtils.tmpDir().name;
                const fakeAsset = path_1.default.join(tmpRoot, "apples.pdf");
                fs_extra_1.default.writeFileSync(fakeAsset, "data");
                utils_1.clipboard.writeText(fakeAsset);
                const note = (await engine.getNoteMeta("foo")).data;
                const editor = await WSUtils_1.WSUtils.openNote(note);
                editor.selection = new vscode.Selection(8, 0, 8, 12);
                // run cmd
                await new PasteFile_1.PasteFileCommand().run();
                const dstPath = path_1.default.join((0, common_server_1.vault2Path)({ vault: note.vault, wsRoot }), "assets", "apples.pdf");
                (0, testUtilsv2_1.expect)(fs_extra_1.default.existsSync(dstPath)).toBeTruthy();
                (0, testUtilsv2_1.expect)(fs_extra_1.default.readFileSync(dstPath, { encoding: "utf8" })).toEqual("data");
                editor.selection = new vscode.Selection(8, 0, 8, 12);
                const pos1 = new vscode.Position(7, 0);
                const pos2 = new vscode.Position(7, 43);
                (0, testUtilsv2_1.expect)(editor.document.getText(new vscode.Range(pos1, pos2))).toEqual(`foo body[apples.pdf](${path_1.default.join("assets", "apples.pdf")})`);
                done();
            },
        });
    });
    test("with space in file name", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
            onInit: async ({ engine, wsRoot }) => {
                const tmpRoot = common_test_utils_1.FileTestUtils.tmpDir().name;
                const fname = "red apples~";
                const fakeAsset = path_1.default.join(tmpRoot, `${fname}.pdf`);
                fs_extra_1.default.writeFileSync(fakeAsset, "data");
                utils_1.clipboard.writeText(fakeAsset);
                const note = (await engine.getNoteMeta("foo")).data;
                const editor = await WSUtils_1.WSUtils.openNote(note);
                editor.selection = new vscode.Selection(8, 0, 8, 12);
                // run cmd
                await new PasteFile_1.PasteFileCommand().run();
                const cleanFileName = lodash_1.default.kebabCase(fname) + ".pdf";
                const dstPath = path_1.default.join((0, common_server_1.vault2Path)({ vault: note.vault, wsRoot }), "assets", cleanFileName);
                (0, testUtilsv2_1.expect)(fs_extra_1.default.existsSync(dstPath)).toBeTruthy();
                (0, testUtilsv2_1.expect)(fs_extra_1.default.readFileSync(dstPath, { encoding: "utf8" })).toEqual("data");
                editor.selection = new vscode.Selection(8, 0, 8, 12);
                const pos1 = new vscode.Position(7, 0);
                const pos2 = new vscode.Position(7, 50);
                (0, testUtilsv2_1.expect)(editor.document.getText(new vscode.Range(pos1, pos2))).toEqual(`foo body[red-apples.pdf](${path_1.default.join("assets", cleanFileName)})`);
                done();
            },
        });
    });
});
//# sourceMappingURL=PasteFile.test.js.map