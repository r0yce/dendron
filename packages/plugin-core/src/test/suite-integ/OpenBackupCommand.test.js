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
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const OpenBackupCommand_1 = require("../../commands/OpenBackupCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsV3_1 = require("../testUtilsV3");
const testUtilsv2_1 = require("../testUtilsv2");
const mocha_1 = require("mocha");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
suite("OpenBackupCommand", function () {
    (0, testUtilsV3_1.describeMultiWS)("GIVEN workspace with no backup root", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN command displays toast indicating no backups", async () => {
            const windowSpy = sinon_1.default.spy(vscode.window, "showInformationMessage");
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new OpenBackupCommand_1.OpenBackupCommand(ext);
            await cmd.run();
            (0, testUtilsv2_1.expect)(windowSpy.calledOnce).toBeTruthy();
            const infoMessage = windowSpy.getCall(0).args[0];
            (0, testUtilsv2_1.expect)(infoMessage).toEqual("There are no backups saved.");
            windowSpy.restore();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN workspace with backup root", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        (0, mocha_1.describe)("WHEN there is a backup under key `config`", () => {
            test("THEN quickpick shows the filename and selecting it will open the file", async () => {
                const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                const wsRoot = ext.getDWorkspace().wsRoot;
                const backupPath = path_1.default.join(wsRoot, ".backup", "config", "dendron.test.yml");
                fs_extra_1.default.ensureFileSync(backupPath);
                fs_extra_1.default.writeFileSync(backupPath, "test");
                const quickpickStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
                quickpickStub.onCall(0).resolves({
                    label: "config",
                });
                quickpickStub.onCall(1).resolves({
                    label: "dendron.test.yml",
                });
                await vsCodeUtils_1.VSCodeUtils.closeAllEditors();
                const cmd = new OpenBackupCommand_1.OpenBackupCommand(ext);
                await cmd.run();
                const activeEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                (0, testUtilsv2_1.expect)(quickpickStub.getCall(0).args[0]).toEqual([
                    {
                        label: "config",
                        detail: "1 backup(s)",
                    },
                ]);
                (0, testUtilsv2_1.expect)(quickpickStub.getCall(1).args[0]).toEqual([
                    {
                        label: "dendron.test.yml",
                    },
                ]);
                (0, testUtilsv2_1.expect)(activeEditor?.document.fileName).toEqual(backupPath);
                (0, testUtilsv2_1.expect)(activeEditor?.document.getText()).toEqual("test");
            });
        });
    });
});
//# sourceMappingURL=OpenBackupCommand.test.js.map