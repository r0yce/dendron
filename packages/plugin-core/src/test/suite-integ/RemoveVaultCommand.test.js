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
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const VaultAddCommand_1 = require("../../commands/VaultAddCommand");
const RemoveVaultCommand_1 = require("../../commands/RemoveVaultCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const workspace_1 = require("../../workspace");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
async function addWorkspaceVault({ vaults, wsName, }) {
    const { wsRoot } = await (0, engine_test_utils_1.setupWS)({
        vaults,
        asRemote: true,
    });
    // stub
    const cmd = new VaultAddCommand_1.VaultAddCommand();
    (0, testUtilsV3_1.stubVaultInput)({
        cmd,
        sourceType: "remote",
        sourcePath: wsName,
        sourcePathRemote: wsRoot,
        sourceName: "dendron",
    });
    await cmd.run();
    return { wsRoot, vaults };
}
function stubQuickPick(vault) {
    // @ts-ignore
    vsCodeUtils_1.VSCodeUtils.showQuickPick = () => {
        return { data: vault };
    };
}
function getConfig() {
    return common_server_1.DConfig.getRaw(ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot);
}
function getWorkspaceFile() {
    const settings = fs_extra_1.default.readJSONSync(workspace_1.DendronExtension.workspaceFile().fsPath);
    return settings;
}
suite("GIVEN RemoveVaultCommand", function () {
    let executeCmdStub;
    this.beforeEach(() => {
        executeCmdStub = sinon_1.default.stub(vscode.commands, "executeCommand").resolves({});
    });
    this.afterEach(() => {
        executeCmdStub.restore();
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN removing a workspace vault", {}, () => {
        test("THEN the vault is removed", async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteVaultName = "remoteVault";
            const remoteWsName = "remoteWs";
            const vaultsRemote = [{ fsPath: remoteVaultName }];
            await addWorkspaceVault({
                vaults: vaultsRemote,
                wsName: remoteWsName,
            });
            stubQuickPick({ fsPath: remoteVaultName, workspace: remoteWsName });
            await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
            const config = getConfig();
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)).toEqual(vaults);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getWorkspace(config).workspaces).toEqual({});
            (0, testUtilsv2_1.expect)(lodash_1.default.find(getWorkspaceFile().folders, {
                path: path_1.default.join(remoteWsName, remoteVaultName),
            })).toEqual(undefined);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN removing a regular vault", {}, () => {
        test("THEN the vault is removed", async () => {
            const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultToRemove = vaults[1];
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({
                // RemoveVaultCommand uses this internally, but TypeScript doesn't recognize it for the stub
                // @ts-ignore
                data: vaultToRemove,
            });
            await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
            // Shouldn't delete the actual files
            (0, testUtilsv2_1.expect)(common_test_utils_1.FileTestUtils.cmpFilesV2(path_1.default.join(wsRoot, vaultToRemove.fsPath), [
                "root.md",
                "root.schema.yml",
            ])).toBeTruthy();
            // check that the config updated
            const config = common_server_1.DConfig.getRaw(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config).map((ent) => ent.fsPath)).toEqual([
                vaults[0].fsPath,
                vaults[2].fsPath,
            ]);
            // check vscode settings updated
            const settings = (await fs_extra_1.default.readJSON(workspace_1.DendronExtension.workspaceFile().fsPath));
            (0, testUtilsv2_1.expect)(settings.folders).toEqual([
                { path: vaults[0].fsPath },
                { path: vaults[2].fsPath },
            ]);
        });
    });
    (0, mocha_1.describe)("WHEN removing a vault when override is present", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN removing a regular vault", {
            timeout: 1e9,
            preSetupHook: async ({ wsRoot }) => {
                // // create a vault that we are adding as override
                const vpath = path_1.default.join(wsRoot, "vault4");
                fs_extra_1.default.ensureDirSync(vpath);
                const vault = { fsPath: vpath };
                const note = common_all_1.NoteUtils.createRoot({
                    vault: { fsPath: vpath },
                    body: ["existing note"].join("\n"),
                });
                await (0, common_server_1.note2File)({ note, vault, wsRoot });
                const schema = common_all_1.SchemaUtils.createRootModule({ vault });
                await (0, common_server_1.schemaModuleOpts2File)(schema, vault.fsPath, "root");
                const overridePath = common_server_1.DConfig.configOverridePath(wsRoot, common_server_1.LocalConfigScope.WORKSPACE);
                const overridePayload = {
                    workspace: {
                        vaults: [{ fsPath: "vault4" }],
                    },
                };
                (0, common_server_1.writeYAML)(overridePath, overridePayload);
            },
        }, () => {
            test("THEN the vault is removed from dendron.yml, and override is not merged into config", async () => {
                const { wsRoot, config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vaultToRemove = { fsPath: "vault2" };
                // before remove, we have 4 vaults including the overriden one
                (0, testUtilsv2_1.expect)(config.workspace.vaults.length).toEqual(4);
                // before remove, dendron.yml has 3 vaults
                const preRunConfig = common_server_1.DConfig.readConfigSync(wsRoot);
                (0, testUtilsv2_1.expect)(preRunConfig.workspace.vaults.length).toEqual(3);
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({
                    // RemoveVaultCommand uses this internally, but TypeScript doesn't recognize it for the stub
                    // @ts-ignore
                    data: vaultToRemove,
                });
                await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                // after remove, we have 2 vaults in dendron.yml
                const postRunConfig = common_server_1.DConfig.readConfigSync(wsRoot);
                (0, testUtilsv2_1.expect)(postRunConfig.workspace.vaults.length).toEqual(2);
                // after remove, we have 3 vaults including the overriden one
                const postRunConfigWithOverride = ExtensionProvider_1.ExtensionProvider.getDWorkspace().config;
                (0, testUtilsv2_1.expect)(postRunConfigWithOverride.workspace.vaults.length).toEqual(3);
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN removing a self contained vault", { selfContained: true }, () => {
        test("THEN the vault is removed", async () => {
            const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultToRemove = vaults[1];
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({
                // RemoveVaultCommand uses this internally, but TypeScript doesn't recognize it for the stub
                // @ts-ignore
                data: vaultToRemove,
            });
            await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
            // Shouldn't delete the actual files
            (0, testUtilsv2_1.expect)(common_test_utils_1.FileTestUtils.cmpFilesV2(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaultToRemove)), ["root.md", "root.schema.yml"])).toBeTruthy();
            // check that the config updated
            const config = common_server_1.DConfig.getRaw(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config).map((ent) => ent.fsPath)).toEqual([
                vaults[0].fsPath,
                vaults[2].fsPath,
            ]);
            // check vscode settings updated
            const settings = (await fs_extra_1.default.readJSON(workspace_1.DendronExtension.workspaceFile().fsPath));
            (0, testUtilsv2_1.expect)(settings.folders).toEqual([
                { path: common_all_1.VaultUtils.getRelPath(vaults[0]) },
                { path: common_all_1.VaultUtils.getRelPath(vaults[2]) },
            ]);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN removing the top level self contained vault", { selfContained: true }, () => {
        test("THEN the vault is removed", async () => {
            const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultToRemove = vaults[0];
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick").resolves({
                // RemoveVaultCommand uses this internally, but TypeScript doesn't recognize it for the stub
                // @ts-ignore
                data: vaultToRemove,
            });
            await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
            // Shouldn't delete the actual files
            (0, testUtilsv2_1.expect)(common_test_utils_1.FileTestUtils.cmpFilesV2(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaultToRemove)), ["root.md", "root.schema.yml"])).toBeTruthy();
            // check that the config updated
            const config = common_server_1.DConfig.getRaw(wsRoot);
            (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config).map((ent) => ent.fsPath)).toEqual([
                vaults[1].fsPath,
                vaults[2].fsPath,
            ]);
            // check vscode settings updated
            const settings = (await fs_extra_1.default.readJSON(workspace_1.DendronExtension.workspaceFile().fsPath));
            (0, testUtilsv2_1.expect)(settings.folders).toEqual([
                { path: common_all_1.VaultUtils.getRelPath(vaults[1]) },
                { path: common_all_1.VaultUtils.getRelPath(vaults[2]) },
            ]);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there's only one vault left after remove", {}, () => {
        test("THEN duplicateNoteBehavior is omitted", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const configPath = common_server_1.DConfig.configPath(wsRoot);
            // add a second vault
            const vault2 = "vault2";
            (0, testUtilsV3_1.stubVaultInput)({ sourceType: "local", sourcePath: vault2 });
            await new VaultAddCommand_1.VaultAddCommand().run();
            const config = (0, common_server_1.readYAML)(configPath);
            // confirm that duplicateNoteBehavior option exists
            const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
            (0, testUtilsv2_1.expect)(publishingConfig.duplicateNoteBehavior).toBeTruthy();
            const vaultsAfter = ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults;
            // @ts-ignore
            vsCodeUtils_1.VSCodeUtils.showQuickPick = () => {
                return { data: vaultsAfter[1] };
            };
            await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
            const configNew = (0, common_server_1.readYAML)(configPath);
            // confirm that duplicateNoteBehavior setting is gone
            const publishingConfigNew = common_all_1.ConfigUtils.getPublishing(configNew);
            (0, testUtilsv2_1.expect)(publishingConfigNew.duplicateNoteBehavior).toBeFalsy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN a published vault is removed", {}, () => {
        test("THEN the vault is removed from duplicateNoteBehavior payload", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            // add two more vaults
            const vpath2 = "vault2";
            const vpath3 = "vault3";
            (0, testUtilsV3_1.stubVaultInput)({ sourceType: "local", sourcePath: vpath2 });
            await new VaultAddCommand_1.VaultAddCommand().run();
            (0, testUtilsV3_1.stubVaultInput)({ sourceType: "local", sourcePath: vpath3 });
            await new VaultAddCommand_1.VaultAddCommand().run();
            const vaultsAfter = ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults;
            const configOrig = common_server_1.DConfig.getRaw(wsRoot);
            // check what we are starting from.
            const origVaults = common_all_1.ConfigUtils.getVaults(configOrig);
            (0, testUtilsv2_1.expect)(origVaults.map((ent) => ent.fsPath)).toEqual([
                vaultsAfter[0].fsPath,
                vaultsAfter[1].fsPath,
                vaultsAfter[2].fsPath,
            ]);
            // @ts-ignore
            vsCodeUtils_1.VSCodeUtils.showQuickPick = () => {
                return { data: vaultsAfter[1] };
            };
            await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
            const config = common_server_1.DConfig.getRaw(wsRoot);
            // check that "vault2" is gone from payload
            const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
            (0, testUtilsv2_1.expect)(publishingConfig.duplicateNoteBehavior.payload).toEqual([
                common_all_1.VaultUtils.getName(vaultsAfter[2]),
                common_all_1.VaultUtils.getName(vaultsAfter[0]),
            ]);
        });
    });
    (0, mocha_1.describe)("WHEN it's used from the Contextual-UI", () => {
        (0, testUtilsV3_1.describeMultiWS)("AND it removes a regular vault vault1", {}, () => {
            test("THEN vault1 should be removed from workspace and config", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const args = {
                    fsPath: path_1.default.join(wsRoot, vaults[1].fsPath),
                };
                await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run(args);
                const config = getConfig();
                (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)).toNotEqual(vaults);
                (0, testUtilsv2_1.expect)(lodash_1.default.find(getWorkspaceFile().folders, {
                    path: path_1.default.join(vaults[1].fsPath),
                })).toEqual(undefined);
            });
        });
        (0, mocha_1.describe)("AND it removes a remote workspace vault remoteWs", () => {
            test("THEN remoteWs should be removed from workspace and config", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const remoteVaultName = "remoteVault";
                const remoteWsName = "remoteWs";
                const vaultsRemote = [{ fsPath: remoteVaultName }];
                await addWorkspaceVault({
                    vaults: vaultsRemote,
                    wsName: remoteWsName,
                });
                const args = {
                    fsPath: path_1.default.join(wsRoot, remoteWsName, remoteVaultName),
                };
                await new RemoveVaultCommand_1.RemoveVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run(args);
                const config = getConfig();
                (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getVaults(config)).toEqual(vaults);
                (0, testUtilsv2_1.expect)(common_all_1.ConfigUtils.getWorkspace(config).workspaces).toEqual({});
                (0, testUtilsv2_1.expect)(lodash_1.default.find(getWorkspaceFile().folders, {
                    path: path_1.default.join(remoteWsName, remoteVaultName),
                })).toEqual(undefined);
            });
        });
    });
});
//# sourceMappingURL=RemoveVaultCommand.test.js.map