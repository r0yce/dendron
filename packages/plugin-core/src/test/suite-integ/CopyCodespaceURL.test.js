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
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const CopyCodespaceURL_1 = require("../../commands/CopyCodespaceURL");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const vscode = __importStar(require("vscode"));
(0, testUtilsV3_1.describeSingleWS)("When Copy Codespace URL is run", {
    // these tests can run longer than 5s timeout;
    timeout: 1e6,
}, () => {
    test("THEN codespace url is copied to the clipboard", async () => {
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        sinon_1.default
            .stub(common_server_1.GitUtils, "getGitProviderOwnerAndRepository")
            .resolves(["dendronhq", "dendron"]);
        const workspaces = vscode.workspace.workspaceFolders;
        sinon_1.default.stub(vscode.workspace, "getWorkspaceFolder").returns(workspaces[0]);
        const remoteDir = (0, common_server_1.tmpDir)().name;
        await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
        const cmd = new CopyCodespaceURL_1.CopyCodespaceURL();
        const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "root.md");
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        const resp = await cmd.execute({});
        (0, testUtilsv2_1.expect)(resp).toContain("https://github.dev/dendronhq/dendron/blob/");
    });
});
//# sourceMappingURL=CopyCodespaceURL.test.js.map