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
const common_server_1 = require("@dendronhq/common-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const FrontmatterFoldingRangeProvider_1 = __importDefault(require("../../features/FrontmatterFoldingRangeProvider"));
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
async function provide(editor) {
    const doc = editor?.document;
    const provider = new FrontmatterFoldingRangeProvider_1.default();
    const foldingRanges = await provider.provideFoldingRanges(doc);
    return foldingRanges;
}
suite("FrontmatterFoldingRangeProvider", function () {
    let ctx;
    ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        beforeHook: () => { },
    });
    test("basic", (done) => {
        (0, testUtilsV3_1.runLegacySingleWorkspaceTest)({
            ctx,
            postSetupHook: async ({ wsRoot, vaults }) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
            },
            onInit: async ({ wsRoot, vaults }) => {
                const vaultDir = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(path_1.default.join(vaultDir, "foo.md")));
                const foldingRange = (await provide(editor));
                (0, testUtilsv2_1.expect)(foldingRange).toEqual([
                    new vscode.FoldingRange(0, 6, vscode.FoldingRangeKind.Region),
                ]);
                done();
            },
        });
    });
    test("with horizontal line", (done) => {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: async ({ wsRoot, vaults }) => {
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    wsRoot,
                    vault: vaults[0],
                    fname: "foo",
                    body: [
                        "Doloremque illo exercitationem error ab. Dicta architecto quis voluptatem. Numquam in est voluptatem quia impedit iusto repellendus magnam.",
                        "",
                        "---",
                        "",
                        "Aperiam in cupiditate temporibus id voluptas qui. Qui doloremque error odio eligendi quia. Quis ipsa aliquid voluptatem sunt.",
                    ].join("\n"),
                });
            },
            onInit: async ({ wsRoot, vaults }) => {
                const vaultDir = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(path_1.default.join(vaultDir, "foo.md")));
                const foldingRange = (await provide(editor));
                (0, testUtilsv2_1.expect)(foldingRange).toEqual([
                    new vscode.FoldingRange(0, 6, vscode.FoldingRangeKind.Region),
                ]);
                done();
            },
        });
    });
});
//# sourceMappingURL=FrontmatterFoldingRangeProvider.test.js.map