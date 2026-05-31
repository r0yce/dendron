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
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const CreateNewVaultCommand_1 = require("../../commands/CreateNewVaultCommand");
const ReloadIndex_1 = require("../../commands/ReloadIndex");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("CreateNewVault Command", function () {
    (0, mocha_1.describe)("GIVEN Create new vault command is run within a workspace", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN ran inside a workspace with dev.enableSelfContainedVaults config set to false", { modConfigCb: disableSelfContainedVaults, timeout: 1e4 }, () => {
            (0, mocha_1.before)(async () => {
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves();
                sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
            });
            test("THEN create a new standard vault at selected destination", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vpath = path_1.default.join(wsRoot, "vault2");
                const cmd = new CreateNewVaultCommand_1.CreateNewVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(cmd, "gatherDestinationFolder").resolves(vpath);
                await cmd.run();
                const vaultsAfter = ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults;
                (0, testUtilsv2_1.expect)(vaultsAfter.length).toEqual(2);
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.readdir((0, common_server_1.vault2Path)({ vault: vaultsAfter[1], wsRoot }))).toEqual([
                    ".dendron.cache.json",
                    ".vscode",
                    "assets",
                    "root.md",
                    "root.schema.yml",
                ]);
                await (0, engine_test_utils_1.checkVaults)({
                    wsRoot,
                    vaults: vaultsAfter,
                }, testUtilsv2_1.expect);
            });
        });
    });
});
function enableSelfCOntainedVaults(config) {
    config.dev.enableSelfContainedVaults = true;
    return config;
}
function disableSelfContainedVaults(config) {
    config.dev.enableSelfContainedVaults = false;
    return config;
}
(0, mocha_1.describe)("GIVEN Create existing vault command is run with self contained vaults enabled", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN creating a vault", {
        modConfigCb: enableSelfCOntainedVaults,
        timeout: 5e3,
    }, () => {
        const vaultName = "my-self-contained-vault";
        (0, mocha_1.before)(async () => {
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(vaultName);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });
        test("THEN new vault is created in dependencies/localhost folder, and is self contained", async () => {
            const cmd = new CreateNewVaultCommand_1.CreateNewVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName);
            await cmd.run();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await (0, common_server_1.readYAMLAsync)(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.FOLDERS.NOTES))).toBeTruthy();
        });
        test("THEN the vault was added to the workspace config correctly", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getOrCreate(wsRoot);
            const vault = common_all_1.VaultUtils.getVaultByName({
                vaults: common_all_1.ConfigUtils.getVaults(config),
                vname: vaultName,
            });
            (0, testUtilsv2_1.expect)(vault?.selfContained).toBeTruthy();
            (0, testUtilsv2_1.expect)(vault?.name).toEqual(vaultName);
            (0, testUtilsv2_1.expect)(vault?.fsPath).toEqual(
            // vault paths always use UNIX style
            path_1.default.posix.join(common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName));
        });
        test("THEN the notes in this vault are accessible", async () => {
            // Since we mock the reload window, need to reload index here to pick up the notes in the new vault
            await new ReloadIndex_1.ReloadIndexCommand().run();
            const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = common_all_1.VaultUtils.getVaultByName({
                vaults,
                vname: vaultName,
            });
            (0, testUtilsv2_1.expect)(vault).toBeTruthy();
            const note = (await engine.findNotesMeta({ fname: "root", vault }))[0];
            (0, testUtilsv2_1.expect)(note).toBeTruthy();
            (0, testUtilsv2_1.expect)(note?.vault.name).toEqual(vaultName);
        });
    });
});
//# sourceMappingURL=CreateNewVaultCommand.test.js.map