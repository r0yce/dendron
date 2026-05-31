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
const pods_core_1 = require("@dendronhq/pods-core");
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
const common_all_1 = require("@dendronhq/common-all");
const GoogleDocsExportPodCommand_1 = require("../../../../commands/pods/GoogleDocsExportPodCommand");
const common_server_1 = require("@dendronhq/common-server");
const path_1 = __importDefault(require("path"));
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const vsCodeUtils_1 = require("../../../../vsCodeUtils");
suite("GoogleDocsExportPodCommand", function () {
    (0, mocha_1.describe)("GIVEN a GoogleDocsExportPodCommand is ran with Note scope", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN there is an error in response", {}, () => {
            test("THEN error message must be displayed", async () => {
                const cmd = new GoogleDocsExportPodCommand_1.GoogleDocsExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "root.md");
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
                const payload = await cmd.enrichInputs({
                    exportScope: pods_core_1.PodExportScope.Note,
                    accessToken: "test",
                    refreshToken: "test",
                    expirationTime: 1234,
                    connectionId: "gdoc",
                });
                const result = {
                    data: {
                        created: [],
                        updated: [],
                    },
                    error: new common_all_1.DendronError({
                        status: "401",
                        message: "Request failed with status code 401",
                    }),
                };
                const resp = await cmd.onExportComplete({
                    exportReturnValue: result,
                    payload: payload?.payload,
                    config: payload?.config,
                });
                (0, testUtilsv2_1.expect)(resp).toEqual(`Finished GoogleDocs Export. 0 docs created; 0 docs updated. Error encountered: ${common_all_1.ErrorFactory.safeStringify(result.error?.message)}`);
            });
        });
    });
});
//# sourceMappingURL=GoogleDocsExportCommand.test.js.map