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
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const ReloadIndex_1 = require("../../commands/ReloadIndex");
const VaultAddCommand_1 = require("../../commands/VaultAddCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
suite("VaultAddCommand", function () {
    const beforeHook = () => {
        // prevents a ReloadWorkspace
        sinon_1.default.stub(vscode.commands, "executeCommand").resolves({});
    };
    // TODO: need to stub git clone with side effects
    (0, mocha_1.describe)("remote", () => {
        this.beforeEach(beforeHook);
        (0, testUtilsV3_1.describeSingleWS)("WHEN running VaultAdd", { timeout: 1e6 }, () => {
            test("THEN add vault to config", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const remoteDir = (0, common_server_1.tmpDir)().name;
                await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                const gitIgnore = path_1.default.join(wsRoot, ".gitignore");
                const gitIgnoreInsideVault = path_1.default.join(wsRoot, "vaultRemote", ".gitignore");
                const cmd = new VaultAddCommand_1.VaultAddCommand();
                (0, testUtilsV3_1.stubVaultInput)({
                    cmd,
                    sourceType: "remote",
                    sourcePath: "vaultRemote",
                    sourcePathRemote: remoteDir,
                    sourceName: "dendron",
                });
                await cmd.run();
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
        (0, testUtilsV3_1.describeSingleWS)("WHEN add vault inside workspace", {}, () => {
            test("THEN workspace vault is added", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const { wsRoot: remoteDir } = await (0, engine_test_utils_1.setupWS)({
                    vaults: [{ fsPath: "vault1" }],
                    asRemote: true,
                });
                // stub
                const gitIgnore = path_1.default.join(wsRoot, ".gitignore");
                const cmd = new VaultAddCommand_1.VaultAddCommand();
                const wsName = "wsRemote";
                (0, testUtilsV3_1.stubVaultInput)({
                    cmd,
                    sourceType: "remote",
                    sourcePath: wsName,
                    sourcePathRemote: remoteDir,
                    sourceName: "dendron",
                });
                await cmd.run();
                const gitIgnoreInsideVault = path_1.default.join(wsRoot, wsName, ".gitignore");
                const config = common_server_1.DConfig.getOrCreate(wsRoot);
                const workspaces = common_all_1.ConfigUtils.getWorkspace(config).workspaces;
                (0, testUtilsv2_1.expect)(workspaces).toEqual({
                    [wsName]: {
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
                            fsPath: "vault1",
                            workspace: wsName,
                            name: "dendron",
                        },
                        vaults[0],
                    ],
                }, testUtilsv2_1.expect);
                (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertInFile({
                    fpath: gitIgnore,
                    match: [wsName],
                })).toBeTruthy();
                (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertInFile({
                    fpath: gitIgnoreInsideVault,
                    match: [".dendron.cache.*"],
                })).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN add workspace vault with same name as existing vault", {}, () => {
            test("THEN do right thing", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // create remote repo
                const remoteDir = (0, common_server_1.tmpDir)().name;
                const vaultPath = "vault";
                const vaultsRemote = [{ fsPath: vaultPath }];
                await engine_server_1.WorkspaceService.createWorkspace({
                    wsRoot: remoteDir,
                    additionalVaults: vaultsRemote,
                });
                await engine_test_utils_1.GitTestUtils.createRepoWithReadme(remoteDir);
                // stub
                const gitIgnore = path_1.default.join(wsRoot, ".gitignore");
                const cmd = new VaultAddCommand_1.VaultAddCommand();
                const wsName = "wsRemote";
                (0, testUtilsV3_1.stubVaultInput)({
                    cmd,
                    sourceType: "remote",
                    sourcePath: wsName,
                    sourcePathRemote: remoteDir,
                    sourceName: "dendron",
                });
                await cmd.run();
                const config = common_server_1.DConfig.getOrCreate(wsRoot);
                const workspaces = common_all_1.ConfigUtils.getWorkspace(config).workspaces;
                (0, testUtilsv2_1.expect)(workspaces).toEqual({
                    [wsName]: {
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
                            fsPath: (0, common_all_1.normalizeUnixPath)(vaultPath),
                            workspace: wsName,
                            name: "dendron",
                        },
                        vaults[0],
                    ],
                }, testUtilsv2_1.expect);
                (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertInFile({
                    fpath: gitIgnore,
                    match: [wsName],
                })).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN vault was already in .gitignore", {}, () => {
            (0, mocha_1.describe)("AND vaultAddCommand is run", () => {
                test("THEN vault is not duplicated", async () => {
                    const vaultPath = "vaultRemote";
                    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const gitIgnore = path_1.default.join(wsRoot, ".gitignore");
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await fs_extra_1.default.writeFile(gitIgnore, vaultPath);
                    const cmd = new VaultAddCommand_1.VaultAddCommand();
                    (0, testUtilsV3_1.stubVaultInput)({
                        cmd,
                        sourceType: "remote",
                        sourcePath: vaultPath,
                        sourcePathRemote: remoteDir,
                        sourceName: "dendron",
                    });
                    await cmd.run();
                    (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertTimesInFile({
                        fpath: gitIgnore,
                        match: [[1, vaultPath]],
                    })).toBeTruthy();
                });
            });
        });
    });
    (0, mocha_1.describe)("local", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN add to existing folder", {
            modConfigCb: disableSelfContainedVaults,
            postSetupHook: async ({ wsRoot }) => {
                const vpath = path_1.default.join(wsRoot, "vault2");
                fs_extra_1.default.ensureDirSync(vpath);
                const vault = { fsPath: vpath };
                const note = common_all_1.NoteUtils.createRoot({
                    vault: { fsPath: vpath },
                    body: ["existing note"].join("\n"),
                });
                await (0, common_server_1.note2File)({ note, vault, wsRoot });
                const schema = common_all_1.SchemaUtils.createRootModule({ vault });
                await (0, common_server_1.schemaModuleOpts2File)(schema, vault.fsPath, "root");
            },
            timeout: 1e4,
        }, () => {
            test("THEN do right thing", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vpath = path_1.default.join(wsRoot, "vault2");
                (0, testUtilsV3_1.stubVaultInput)({ sourceType: "local", sourcePath: vpath });
                await new VaultAddCommand_1.VaultAddCommand().run();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.readdir(vpath)).toEqual([
                    ".gitignore",
                    "root.md",
                    "root.schema.yml",
                ]);
                const vaultsAfter = ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults;
                await (0, engine_test_utils_1.checkVaults)({
                    wsRoot,
                    vaults: vaultsAfter,
                }, testUtilsv2_1.expect);
                (0, testUtilsv2_1.expect)(vaultsAfter.length).toEqual(2);
                // new file added to newline
                (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertInFile({
                    fpath: path_1.default.join(wsRoot, ".gitignore"),
                    match: ["vault2"],
                })).toBeTruthy();
                // check note is still existing note
                (0, testUtilsv2_1.expect)(await common_test_utils_1.FileTestUtils.assertInFile({
                    fpath: path_1.default.join(vpath, "root.md"),
                    match: ["existing note"],
                })).toBeTruthy();
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN add absolute path inside wsRoot", { modConfigCb: disableSelfContainedVaults }, () => {
            test("THEN do right thing", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vpath = path_1.default.join(wsRoot, "vault2");
                (0, testUtilsV3_1.stubVaultInput)({ sourceType: "local", sourcePath: vpath });
                await new VaultAddCommand_1.VaultAddCommand().run();
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
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN add rel path inside wsRoot", { modConfigCb: disableSelfContainedVaults, timeout: 1e4 }, () => {
            test("THEN do right thing", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const sourcePath = "vault2";
                (0, testUtilsV3_1.stubVaultInput)({ sourceType: "local", sourcePath });
                await new VaultAddCommand_1.VaultAddCommand().run();
                const vaultsAfter = ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults;
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
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN add absolute path outside of wsRoot", {
            modConfigCb: disableSelfContainedVaults,
        }, () => {
            test("THEN do right thing", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vpath = (0, common_server_1.tmpDir)().name;
                (0, testUtilsV3_1.stubVaultInput)({ sourceType: "local", sourcePath: vpath });
                await new VaultAddCommand_1.VaultAddCommand().run();
                const vaultsAfter = ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults;
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
(0, mocha_1.describe)("GIVEN a workspace with local override", function () {
    const beforeHook = () => {
        // prevents a ReloadWorkspace
        sinon_1.default.stub(vscode.commands, "executeCommand").resolves({});
    };
    (0, testUtilsV3_1.describeSingleWS)("WHEN adding a vault", {
        preSetupHook: async ({ wsRoot }) => {
            // create a vault that we are adding as override
            const vpath = path_1.default.join(wsRoot, "vault2");
            fs_extra_1.default.ensureDirSync(vpath);
            const vault = { fsPath: vpath };
            const note = common_all_1.NoteUtils.createRoot({
                vault: { fsPath: vpath },
                body: ["existing note"].join("\n"),
            });
            await (0, common_server_1.note2File)({ note, vault, wsRoot });
            const schema = common_all_1.SchemaUtils.createRootModule({ vault });
            await (0, common_server_1.schemaModuleOpts2File)(schema, vault.fsPath, "root");
            // add it to workspace override
            const overridePath = common_server_1.DConfig.configOverridePath(wsRoot, common_server_1.LocalConfigScope.WORKSPACE);
            const overridePayload = {
                workspace: {
                    vaults: [{ fsPath: "vault2" }],
                },
            };
            (0, common_server_1.writeYAML)(overridePath, overridePayload);
        },
    }, () => {
        this.beforeEach(beforeHook);
        test("locally overriden vault is not merged into config", async () => {
            const vaultPath = "vaultRemote";
            const { wsRoot, config: preRunConfigWithOverride } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const gitIgnore = path_1.default.join(wsRoot, ".gitignore");
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            await fs_extra_1.default.writeFile(gitIgnore, vaultPath);
            // the config that has local override should have two vaults
            (0, testUtilsv2_1.expect)(preRunConfigWithOverride.workspace.vaults.length).toEqual(2);
            // dendron.yml should have one vault;
            const preRunConfig = common_server_1.DConfig.readConfigSync(wsRoot);
            (0, testUtilsv2_1.expect)(preRunConfig.workspace.vaults.length).toEqual(1);
            const cmd = new VaultAddCommand_1.VaultAddCommand();
            (0, testUtilsV3_1.stubVaultInput)({
                cmd,
                sourceType: "remote",
                sourcePath: vaultPath,
                sourcePathRemote: remoteDir,
                sourceName: "dendron",
            });
            await cmd.run();
            // dendron.yml should now have two vault
            const postRunConfig = common_server_1.DConfig.readConfigSync(wsRoot);
            (0, testUtilsv2_1.expect)(postRunConfig.workspace.vaults.length).toEqual(2);
            // config + override should have three vaults
            const postRunConfigWithOverride = ExtensionProvider_1.ExtensionProvider.getDWorkspace().config;
            (0, testUtilsv2_1.expect)(postRunConfigWithOverride.workspace.vaults.length).toEqual(3);
        });
    });
});
(0, mocha_1.describe)("GIVEN VaultAddCommand with self contained vaults enabled", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN creating and adding a local vault", {
        modConfigCb: enableSelfCOntainedVaults,
    }, () => {
        const vaultName = "my-self-contained-vault";
        (0, mocha_1.before)(async () => {
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "local" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(vaultName);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
            await new VaultAddCommand_1.VaultAddCommand().run();
        });
        test("THEN the vault is under `dependencies/localhost`, and is self contained", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName);
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
    (0, testUtilsV3_1.describeSingleWS)("WHEN creating and adding a remote self contained vault", { modConfigCb: enableSelfCOntainedVaults }, () => {
        let vaultName;
        let remoteDir;
        (0, mocha_1.before)(async () => {
            // Create a self contained vault outside the current workspace
            remoteDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createSelfContainedVaultWithGit)(remoteDir);
            vaultName = path_1.default.basename(remoteDir);
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(remoteDir);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
            await new VaultAddCommand_1.VaultAddCommand().run();
        });
        test("THEN the vault is under `dependencies/remote`, and is self contained", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // It's kinda hard to mock git cloning from a remote here, so the remote
            // we're using is a directory. Because of that, the name of the vault
            // will fall back to the directory name.
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, vaultName);
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
    (0, testUtilsV3_1.describeSingleWS)("WHEN adding a remote self contained vault with transitive deps", { modConfigCb: enableSelfCOntainedVaults }, () => {
        let vaultName;
        let remoteDir;
        let transitiveDir;
        let showMessageStub;
        (0, mocha_1.before)(async () => {
            // Create two self contained vaults with git. Add the first one into the second one.
            // The first vault becomes a transitive dependency.
            transitiveDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createSelfContainedVaultWithGit)(transitiveDir);
            remoteDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createSelfContainedVaultWithGit)(remoteDir);
            const wsService = new engine_server_1.WorkspaceService({ wsRoot: remoteDir });
            await wsService.createSelfContainedVault({
                addToConfig: true,
                addToCodeWorkspace: true,
                newVault: true,
                vault: {
                    fsPath: "transitive",
                    selfContained: true,
                    remote: {
                        type: "git",
                        url: transitiveDir,
                    },
                },
            });
            wsService.dispose();
            const git = new engine_server_1.Git({
                localUrl: remoteDir,
            });
            await git.addAll();
            await git.commit({ msg: "add transitive dep" });
            vaultName = path_1.default.basename(remoteDir);
            // Now, run the command to add the second vault into the current
            // workspace. It should add the second vault, but prompt that the first
            // vault won't be added because we don't support transitive
            // dependencies.
            showMessageStub = sinon_1.default
                .stub(vsCodeUtils_1.VSCodeUtils, "showMessage")
                .resolves({ title: "" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(remoteDir);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
            await new VaultAddCommand_1.VaultAddCommand().run();
        });
        test("THEN the vault is under `dependencies/remote`, and is self contained", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // It's kinda hard to mock git cloning from a remote here, so the remote
            // we're using is a directory. Because of that, the name of the vault
            // will fall back to the directory name.
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, vaultName);
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
            // vaults always use unix separators in config files. Added in #3096
            (0, testUtilsv2_1.expect)(vault?.fsPath).toEqual(path_1.default.posix.join(common_all_1.FOLDERS.DEPENDENCIES, vaultName));
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
        test("THEN we prompted the user that the transitive dependency is not supported", async () => {
            // Called once to prompt the user that the transitive dependency is not supported
            (0, testUtilsv2_1.expect)(showMessageStub.calledOnce).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.runTestButSkipForWindows)()("", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN creating and adding a remote vault inside a native workspace", {
            modConfigCb: enableSelfCOntainedVaults,
            workspaceType: common_all_1.WorkspaceType.NATIVE,
        }, () => {
            let remoteDir;
            let vaultName;
            (0, mocha_1.before)(async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const tmpVaultPath = "tmp";
                remoteDir = path_1.default.join(wsRoot, tmpVaultPath);
                await (0, testUtilsV3_1.createSelfContainedVaultWithGit)(remoteDir);
                vaultName = path_1.default.basename(remoteDir);
                sinon_1.default
                    .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                    .resolves({ label: "remote" });
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(remoteDir);
                sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
                await new VaultAddCommand_1.VaultAddCommand().run();
            });
            test("THEN the vault is under `dependencies/remote`, and is self contained", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // It's kinda hard to mock git cloning from a remote here, so the remote
                // we're using is a directory. That means this looks like
                // `dependencies/tmp-123-foo` which is not "up to spec" but it's a good
                // fallback behavior
                const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, vaultName);
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
    (0, testUtilsV3_1.describeSingleWS)("WHEN creating and adding a remote workspace vault", { modConfigCb: enableSelfCOntainedVaults }, () => {
        let vaultName;
        let remoteDir;
        (0, mocha_1.before)(async () => {
            // Create a self contained vault outside the current workspace
            remoteDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createWorkspaceWithGit)(remoteDir);
            vaultName = path_1.default.basename(remoteDir);
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(remoteDir);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
            await new VaultAddCommand_1.VaultAddCommand().run();
        });
        test("THEN the vault is under `dependencies/remote`, and is a workspace vault", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // It's kinda hard to mock git cloning from a remote here, so the remote
            // we're using is a directory. Because of that, the name of the vault
            // will fall back to the directory name.
            const vaultPath = path_1.default.join(wsRoot, vaultName);
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultPath)).toBeTruthy();
            (0, testUtilsv2_1.expect)(await (0, common_server_1.readYAMLAsync)(path_1.default.join(vaultPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultPath, common_all_1.FOLDERS.NOTES))).toBeFalsy();
        });
        test("THEN the vault was added to the workspace config correctly", async () => {
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
    (0, testUtilsV3_1.describeSingleWS)("WHEN creating and adding a remote regular (non self contained) vault", { modConfigCb: enableSelfCOntainedVaults }, () => {
        let vaultName;
        let remoteDir;
        (0, mocha_1.before)(async () => {
            // Create a self contained vault outside the current workspace
            remoteDir = (0, common_server_1.tmpDir)().name;
            await (0, testUtilsV3_1.createVaultWithGit)(remoteDir);
            vaultName = path_1.default.basename(remoteDir);
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({ label: "remote" });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showInputBox").resolves(remoteDir);
            sinon_1.default.stub(vscode.commands, "executeCommand").resolves({}); // stub reload window
            await new VaultAddCommand_1.VaultAddCommand().run();
        });
        test("THEN the vault is under `dependencies/remote`, and is a regular vault", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // It's kinda hard to mock git cloning from a remote here, so the remote
            // we're using is a directory. Because of that, the name of the vault
            // will fall back to the directory name.
            const vaultPath = path_1.default.join(wsRoot, common_all_1.FOLDERS.DEPENDENCIES, vaultName);
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
//# sourceMappingURL=VaultAddCommand.test.js.map