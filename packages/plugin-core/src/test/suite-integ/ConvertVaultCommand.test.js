"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const ConvertVaultCommand_1 = require("../../commands/ConvertVaultCommand");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mocha_1 = require("mocha");
const common_all_1 = require("@dendronhq/common-all");
const ExtensionProvider_1 = require("../../ExtensionProvider");
suite("GIVEN ConvertVaultCommand", function () {
    (0, testUtilsV3_1.describeMultiWS)("WHEN converting a local vault to a remote vault", { preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti, timeout: 5e3 }, () => {
        let remote;
        (0, mocha_1.before)(async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const cmd = new ConvertVaultCommand_1.ConvertVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            sinon_1.default.stub(cmd, "gatherType").resolves("remote");
            sinon_1.default.stub(cmd, "gatherVault").resolves(vaults[0]);
            // Create a remote repository to be the upstream
            remote = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.remoteCreate(remote);
            sinon_1.default.stub(cmd, "gatherRemoteURL").resolves(remote);
            await cmd.run();
        });
        (0, mocha_1.after)(async () => {
            sinon_1.default.restore();
        });
        test("THEN updates .gitignore", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const contents = await fs_extra_1.default.readFile(path_1.default.join(wsRoot, ".gitignore"), {
                encoding: "utf-8",
            });
            (0, testUtilsv2_1.expect)(contents.match(/^vault1$/m)).toBeTruthy();
        });
        test("THEN updates config", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getRaw(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)[0].remote).toEqual({
                type: "git",
                url: remote,
            });
        });
        test("THEN the folder is a git repository", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const git = new engine_server_1.Git({ localUrl: path_1.default.join(wsRoot, vaults[0].fsPath) });
            (0, testUtilsv2_1.expect)(await git.getRemote()).toEqual("origin");
            (0, testUtilsv2_1.expect)(await git.getCurrentBranch()).toBeTruthy();
        });
        (0, mocha_1.describe)("AND converting that back to a local vault", () => {
            (0, mocha_1.before)(async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new ConvertVaultCommand_1.ConvertVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(cmd, "gatherType").resolves("local");
                sinon_1.default.stub(cmd, "gatherVault").resolves(vaults[0]);
                await cmd.run();
            });
            (0, mocha_1.after)(async () => {
                sinon_1.default.restore();
            });
            test("THEN updates .gitignore", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const contents = await fs_extra_1.default.readFile(path_1.default.join(wsRoot, ".gitignore"), {
                    encoding: "utf-8",
                });
                (0, testUtilsv2_1.expect)(contents.match(/^vault1$/m)).toBeFalsy();
            });
            test("THEN updates config", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const config = common_server_1.DConfig.getRaw(wsRoot);
                (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)[0].remote).toBeFalsy();
            });
            test("THEN the folder is NOT a git repository", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const git = new engine_server_1.Git({
                    localUrl: path_1.default.join(wsRoot, vaults[0].fsPath),
                });
                (0, testUtilsv2_1.expect)(await git.getRemote()).toBeFalsy();
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN converting a local vault to a remote vault with self contained vaults enabled", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti,
        modConfigCb: (config) => {
            config.dev = { enableSelfContainedVaults: true };
            return config;
        },
    }, () => {
        let remote;
        (0, mocha_1.before)(async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const cmd = new ConvertVaultCommand_1.ConvertVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            sinon_1.default.stub(cmd, "gatherType").resolves("remote");
            sinon_1.default.stub(cmd, "gatherVault").resolves(vaults[0]);
            sinon_1.default.stub(cmd, "promptForFolderMove").resolves(true);
            // Create a remote repository to be the upstream
            remote = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.remoteCreate(remote);
            sinon_1.default.stub(cmd, "gatherRemoteURL").resolves(remote);
            await cmd.run();
        });
        (0, mocha_1.after)(async () => {
            sinon_1.default.restore();
        });
        test("THEN updates .gitignore", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const contents = await fs_extra_1.default.readFile(path_1.default.join(wsRoot, ".gitignore"), {
                encoding: "utf-8",
            });
            // Should have moved under dependencies
            (0, testUtilsv2_1.expect)(contents.match(new RegExp(`^dependencies${lodash_1.default.escapeRegExp(path_1.default.sep)}${path_1.default.basename(remote)}`, "m"))).toBeTruthy();
        });
        test("THEN updates config", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getRaw(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)[0].remote).toEqual({
                type: "git",
                url: remote,
            });
        });
        test("THEN the vault is moved to the right folder", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = vaults[0];
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vault), "root.md"))).toBeTruthy();
            (0, testUtilsv2_1.expect)(vault.fsPath.startsWith(common_all_1.FOLDERS.DEPENDENCIES)).toBeTruthy();
            (0, testUtilsv2_1.expect)(vault.fsPath.endsWith(path_1.default.basename(remote))).toBeTruthy();
        });
        test("THEN the folder is a git repository", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const git = new engine_server_1.Git({ localUrl: path_1.default.join(wsRoot, vaults[0].fsPath) });
            (0, testUtilsv2_1.expect)(await git.getRemote()).toEqual("origin");
            (0, testUtilsv2_1.expect)(await git.getCurrentBranch()).toBeTruthy();
        });
        (0, mocha_1.describe)("AND converting that back to a local vault", () => {
            (0, mocha_1.before)(async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new ConvertVaultCommand_1.ConvertVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(cmd, "gatherType").resolves("local");
                sinon_1.default.stub(cmd, "gatherVault").resolves(vaults[0]);
                sinon_1.default.stub(cmd, "promptForFolderMove").resolves(true);
                await cmd.run();
            });
            (0, mocha_1.after)(async () => {
                sinon_1.default.restore();
            });
            test("THEN updates .gitignore", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const contents = await fs_extra_1.default.readFile(path_1.default.join(wsRoot, ".gitignore"), {
                    encoding: "utf-8",
                });
                (0, testUtilsv2_1.expect)(contents.match(/^dependencies/m)).toBeFalsy();
            });
            test("THEN updates config", async () => {
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const config = common_server_1.DConfig.getRaw(wsRoot);
                (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)[0].remote).toBeFalsy();
            });
            test("THEN the vault is moved to the right folder", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vault), "root.md"))).toBeTruthy();
                (0, testUtilsv2_1.expect)(vault.fsPath.startsWith(path_1.default.join(common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY))).toBeTruthy();
            });
            test("THEN the folder is NOT a git repository", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const git = new engine_server_1.Git({
                    localUrl: path_1.default.join(wsRoot, vaults[0].fsPath),
                });
                (0, testUtilsv2_1.expect)(await git.getRemote()).toBeFalsy();
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN given a bad remote URL", { preSetupHook: engine_test_utils_1.ENGINE_HOOKS_MULTI.setupBasicMulti }, () => {
        (0, mocha_1.before)(async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const cmd = new ConvertVaultCommand_1.ConvertVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            sinon_1.default.stub(cmd, "gatherType").resolves("remote");
            sinon_1.default.stub(cmd, "gatherVault").resolves(vaults[0]);
            // Bad remote, not actually a vault
            const remote = (0, common_server_1.tmpDir)().name;
            sinon_1.default.stub(cmd, "gatherRemoteURL").resolves(remote);
            await cmd.run();
        });
        (0, mocha_1.after)(async () => {
            sinon_1.default.restore();
        });
        test("THEN conversion fails mid-operation", async () => {
            // config is updated after the remote is fully set up, so if the config has been updated we know that we were able to set up and push to remote
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const config = common_server_1.DConfig.getRaw(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)[0].remote).toBeFalsy();
        });
        (0, mocha_1.describe)("AND running the conversion command again", () => {
            (0, mocha_1.before)(async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const cmd = new ConvertVaultCommand_1.ConvertVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
                sinon_1.default.stub(cmd, "gatherType").resolves("remote");
                sinon_1.default.stub(cmd, "gatherVault").resolves(vaults[0]);
                // Create a remote repository to be the upstream
                const remote = (0, common_server_1.tmpDir)().name;
                await engine_test_utils_1.GitTestUtils.remoteCreate(remote);
                sinon_1.default.stub(cmd, "gatherRemoteURL").resolves(remote);
                await cmd.run();
            });
            (0, mocha_1.after)(async () => {
                sinon_1.default.restore();
            });
            test("THEN the conversion completes", async () => {
                // config is updated after the remote is fully set up, so if the config has been updated we know that we were able to set up and push to remote
                const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const config = common_server_1.DConfig.getRaw(wsRoot);
                (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)[0].remote).toBeTruthy();
            });
        });
    });
});
//# sourceMappingURL=ConvertVaultCommand.test.js.map