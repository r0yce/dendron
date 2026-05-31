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
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const AddExistingVaultCommand_1 = require("../../commands/AddExistingVaultCommand");
const ReloadIndex_1 = require("../../commands/ReloadIndex");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
// these tests can run longer than the default 2s timeout;
const timeout = 5e3;
suite("AddExistingVaultCommand", function () {
    (0, mocha_1.describe)("GIVEN Add Existing Vault command is run on a workspace with self contained config disabled", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN a remote workspace vault is added", {
            modConfigCb: disableSelfContainedVaults,
            timeout: 1e6,
        }, () => {
            (0, mocha_1.before)(() => {
                sinon_1.default.stub(vscode.commands, "executeCommand").resolves({});
            });
            test("THEN add vault, workspace to the config", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const remoteDir = (0, common_server_1.tmpDir)().name;
                await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                const gitIgnore = path_1.default.join(wsRoot, ".gitignore");
                const vname = "vaultRemote";
                const gitIgnoreInsideVault = path_1.default.join(wsRoot, vname, ".gitignore");
                const vpath = path_1.default.join(wsRoot, vname);
                const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                    type: "remote",
                    name: "dendron",
                    path: vpath,
                    pathRemote: remoteDir,
                }));
                await cmd.run();
                const configPath = common_server_1.DConfig.configPath(wsRoot);
                const configRaw = (0, common_server_1.readYAML)(configPath);
                const workspaces = common_all_1.ConfigUtils.getWorkspace(configRaw).workspaces;
                (0, testUtilsv2_1.expect)(workspaces).toEqual({
                    [vname]: {
                        remote: {
                            type: "git",
                            url: remoteDir,
                        },
                    },
                });
                await (0, engine_test_utils_1.checkVaults)({
                    wsRoot,
                    vaults: [
                        {
                            fsPath: "notes",
                            name: "dendron",
                            selfContained: true,
                            workspace: "vaultRemote",
                        },
                        vaults[0],
                    ],
                }, testUtilsv2_1.expect);
                (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertInFile({
                    fpath: gitIgnore,
                    match: ["vaultRemote"],
                })).toBeTruthy();
                (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertInFile({
                    fpath: gitIgnoreInsideVault,
                    match: [".dendron.cache.*"],
                })).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN adding a standard local vault", // not self conatined
        {
            modConfigCb: disableSelfContainedVaults,
            timeout,
        }, () => {
            const vaultName = "standard-vault";
            (0, mocha_1.before)(() => {
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "local" });
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(vaultName);
                sinon_1.default.stub(vscode.commands, "executeCommand").resolves({});
            });
            test("THEN the vault is added to the workspace", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vaultPath = path_1.default.join(wsRoot, vaultName);
                await (0, testUtilsV3_1.createVaultWithGit)(vaultPath);
                const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(cmd, "gatherDestinationFolder").resolves(vaultPath);
                await cmd.run();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeFalsy();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.FOLDERS.NOTES))).toBeFalsy();
            });
            test("THEN the vault was added to the workspace config correctly", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const config = common_server_1.DConfig.getOrCreate(wsRoot);
                const vault = common_all_1.VaultUtils.getVaultByName({
                    vaults: common_all_1.ConfigUtils.getVaults(config),
                    vname: vaultName,
                });
                (0, testUtilsv2_1.expect)(vault?.selfContained).toBeFalsy();
                (0, testUtilsv2_1.expect)(vault?.name).toEqual(vaultName);
                (0, testUtilsv2_1.expect)(vault?.fsPath).toEqual(vaultName);
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN adding a local self conatined vault with enableSelfConatinedVaults config set to false", {
            modConfigCb: disableSelfContainedVaults,
            timeout,
        }, () => {
            const vaultName = "sc-vault";
            (0, mocha_1.before)(() => {
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "local" });
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(vaultName);
                sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
            });
            test("THEN the vault is added to the workspace", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vaultPath = path_1.default.join(wsRoot, vaultName);
                await (0, testUtilsV3_1.createSelfContainedVaultWithGit)(vaultPath);
                const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(cmd, "gatherDestinationFolder").resolves(vaultPath);
                await cmd.run();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
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
                (0, testUtilsv2_1.expect)(vault?.fsPath).toEqual(vaultName);
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
});
function enableSelfContainedVaults(config) {
    config.dev.enableSelfContainedVaults = true;
    return config;
}
function disableSelfContainedVaults(config) {
    config.dev.enableSelfContainedVaults = false;
    return config;
}
(0, mocha_1.describe)("GIVEN Add Existing Vault Command is run with self contained vaults enabled", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN adding a standard local vault", // not self conatined
    {
        modConfigCb: enableSelfContainedVaults,
        timeout,
    }, () => {
        const vaultName = "standard-vault";
        (0, mocha_1.before)(() => {
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "local" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(vaultName);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });
        test("THEN the vault is added to the dependencies/localhost", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const sourcePath = path_1.default.join(wsRoot, vaultName);
            await (0, testUtilsV3_1.createVaultWithGit)(sourcePath);
            const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName);
            sinon_1.default.stub(cmd, "gatherDestinationFolder").resolves(sourcePath);
            await cmd.run();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeFalsy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.FOLDERS.NOTES))).toBeFalsy();
        });
        test("THEN the vault was added to the workspace config correctly", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getOrCreate(wsRoot);
            const vault = common_all_1.VaultUtils.getVaultByName({
                vaults: common_all_1.ConfigUtils.getVaults(config),
                vname: vaultName,
            });
            (0, testUtilsv2_1.expect)(vault?.selfContained).toBeFalsy();
            (0, testUtilsv2_1.expect)(vault?.name).toEqual(vaultName);
            (0, testUtilsv2_1.expect)(vault?.fsPath).toEqual(
            // vault paths always use UNIX style
            path_1.default.posix.join(common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName));
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN adding a local self conatined vault", {
        modConfigCb: enableSelfContainedVaults,
        timeout,
    }, () => {
        const vaultName = "sc-vault";
        (0, mocha_1.before)(() => {
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "local" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(vaultName);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });
        test("THEN the vault is added to the dependencies/localhost", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const sourcePath = path_1.default.join(wsRoot, vaultName);
            await (0, testUtilsV3_1.createSelfContainedVaultWithGit)(sourcePath);
            const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            sinon_1.default.stub(cmd, "gatherDestinationFolder").resolves(sourcePath);
            await cmd.run();
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName);
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
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
    (0, testUtilsV3_1.describeSingleWS)("WHEN adding a remote self contained vault", { modConfigCb: enableSelfContainedVaults, timeout }, () => {
        let vaultName;
        let remoteDir;
        (0, mocha_1.before)(async () => {
            // Create a self contained vault outside the current workspace
            remoteDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createSelfContainedVaultWithGit)(remoteDir);
            vaultName = path_1.default.basename(remoteDir);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });
        test("THEN the vault is added at the dependencies/remote, and is self contained", async () => {
            const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, vaultName);
            sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                type: "remote",
                name: vaultName,
                path: vaultPath,
                pathRemote: remoteDir,
                isSelfContained: true,
            }));
            await cmd.run();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.FOLDERS.NOTES))).toBeTruthy();
            (0, testUtilsv2_1.expect)(await (0, common_server_1.readYAMLAsync)(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
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
            path_1.default.posix.join(common_all_1.FOLDERS.DEPENDENCIES, vaultName));
            (0, testUtilsv2_1.expect)(vault?.remote?.url).toEqual(remoteDir);
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
    (0, testUtilsV3_1.describeSingleWS)("WHEN adding a remote workspace vault", { modConfigCb: enableSelfContainedVaults, timeout }, () => {
        let vaultName;
        let remoteDir;
        (0, mocha_1.before)(async () => {
            // Create a self contained vault outside the current workspace
            remoteDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createWorkspaceWithGit)(remoteDir);
            vaultName = path_1.default.basename(remoteDir);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });
        test("THEN the vault added, and is a workspace vault", async () => {
            const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = path_1.default.join(wsRoot, vaultName);
            sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                type: "remote",
                name: vaultName,
                path: vaultPath,
                pathRemote: remoteDir,
            }));
            await cmd.run();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await (0, common_server_1.readYAMLAsync)(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.FOLDERS.NOTES))).toBeFalsy();
        });
        test("THEN the vault was added to the workspace config correctly", async () => {
            await new ReloadIndex_1.ReloadIndexCommand().run();
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getOrCreate(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config).length).toEqual(2);
            const vault = common_all_1.ConfigUtils.getVaults(config).find((vault) => vault.workspace === vaultName);
            (0, testUtilsv2_1.expect)(vault?.selfContained).toBeFalsy();
            (0, testUtilsv2_1.expect)(vault?.fsPath).toEqual("vault");
            (0, testUtilsv2_1.expect)(config.workspace.workspaces).toBeTruthy();
            (0, testUtilsv2_1.expect)(config.workspace.workspaces[vaultName]).toBeTruthy();
            (0, testUtilsv2_1.expect)(config.workspace.workspaces[vaultName]?.remote.url).toEqual(remoteDir);
            (0, testUtilsv2_1.expect)(vault?.remote?.url).toBeFalsy();
        });
        test("THEN the notes in this vault are accessible", async () => {
            // Since we mock the reload window, need to reload index here to pick up the notes in the new vault
            await new ReloadIndex_1.ReloadIndexCommand().run();
            const { engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getOrCreate(wsRoot);
            const vault = common_all_1.ConfigUtils.getVaults(config).find((vault) => vault.workspace === vaultName);
            (0, testUtilsv2_1.expect)(vault).toBeTruthy();
            const note = (await engine.findNotesMeta({ fname: "root", vault }))[0];
            (0, testUtilsv2_1.expect)(note).toBeTruthy();
            (0, testUtilsv2_1.expect)(note?.vault.workspace).toEqual(vaultName);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN adding a remote regular (non self contained) vault", { modConfigCb: enableSelfContainedVaults, timeout }, () => {
        let vaultName;
        let remoteDir;
        (0, mocha_1.before)(async () => {
            // Create a self contained vault outside the current workspace
            remoteDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createVaultWithGit)(remoteDir);
            vaultName = path_1.default.basename(remoteDir);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
        });
        test("THEN the vault is added to the workspace, and is a regular vault", async () => {
            const cmd = new AddExistingVaultCommand_1.AddExistingVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            fs_extra_1.default.ensureDir(path_1.default.join(wsRoot, "testing"));
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, vaultName);
            sinon_1.default.stub(cmd, "gatherInputs").returns(Promise.resolve({
                type: "remote",
                name: vaultName,
                path: vaultPath,
                pathRemote: remoteDir,
            }));
            await cmd.run();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.FOLDERS.NOTES))).toBeFalsy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeFalsy();
        });
        test("THEN the vault was added to the workspace config correctly", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getOrCreate(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config).length).toEqual(2);
            const vault = common_all_1.VaultUtils.getVaultByName({
                vaults: common_all_1.ConfigUtils.getVaults(config),
                vname: vaultName,
            });
            (0, testUtilsv2_1.expect)(vault?.selfContained).toBeFalsy();
            (0, testUtilsv2_1.expect)(vault?.fsPath).toEqual(
            // vault paths always use UNIX style
            path_1.default.posix.join(common_all_1.FOLDERS.DEPENDENCIES, vaultName));
            (0, testUtilsv2_1.expect)(vault?.remote?.url).toEqual(remoteDir);
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
//# sourceMappingURL=AddExistingVaultCommand.test.js.map