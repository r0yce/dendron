"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = __importDefault(require("sinon"));
const vscode_1 = require("vscode");
const MigrateSelfContainedVault_1 = require("../../commands/MigrateSelfContainedVault");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
const testUtilsv2_1 = require("../testUtilsv2");
const common_all_1 = require("@dendronhq/common-all");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const engine_server_1 = require("@dendronhq/engine-server");
const common_server_1 = require("@dendronhq/common-server");
function stubMigrateQuickPick(vaultSelect, continueOption = MigrateSelfContainedVault_1.MigrateVaultContinueOption.continue) {
    const stub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
    stub.onFirstCall().resolves({
        label: vaultSelect,
    });
    stub.onSecondCall().resolves({ label: continueOption });
    return stub;
}
(0, mocha_1.suite)("GIVEN the MigrateSelfContainedVault command", () => {
    (0, testUtilsV3_1.describeSingleWS)("WHEN the vault prompt is cancelled", { selfContained: false }, () => {
        let showErrorMessage;
        let reloadWindow;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const cmd = new MigrateSelfContainedVault_1.MigrateSelfContainedVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            showErrorMessage = sinon_1.default.stub(vscode_1.window, "showErrorMessage");
            reloadWindow = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            showQuickPick = sinon_1.default
                .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                .resolves(undefined);
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            [showErrorMessage, reloadWindow, showQuickPick].forEach((stub) => stub.restore());
        });
        (0, mocha_1.test)("THEN the workspace did not reload since there was no migration", () => {
            (0, testUtilsv2_1.expect)(reloadWindow.called).toBeFalsy();
        });
        (0, mocha_1.test)("THEN the vault should not have migrated", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(await verifyVaultNotMigrated({ wsRoot, vault: vaults[0] })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN the backup prompt is cancelled", { selfContained: false }, () => {
        let showErrorMessage;
        let reloadWindow;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const cmd = new MigrateSelfContainedVault_1.MigrateSelfContainedVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            showErrorMessage = sinon_1.default.stub(vscode_1.window, "showErrorMessage");
            reloadWindow = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            showQuickPick = stubMigrateQuickPick(common_all_1.VaultUtils.getName(vaults[0]), MigrateSelfContainedVault_1.MigrateVaultContinueOption.cancel);
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            [showErrorMessage, reloadWindow, showQuickPick].forEach((stub) => stub.restore());
        });
        (0, mocha_1.test)("THEN the workspace did not reload since there was no migration", () => {
            (0, testUtilsv2_1.expect)(reloadWindow.called).toBeFalsy();
        });
        (0, mocha_1.test)("THEN the vault should not have migrated", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(await verifyVaultNotMigrated({ wsRoot, vault: vaults[0] })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there's only a single vault, and it's self contained", { selfContained: true }, () => {
        let showErrorMessage;
        let reloadWindow;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const cmd = new MigrateSelfContainedVault_1.MigrateSelfContainedVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            showErrorMessage = sinon_1.default.stub(vscode_1.window, "showErrorMessage");
            reloadWindow = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            showQuickPick = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick");
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            [showErrorMessage, reloadWindow, showQuickPick].forEach((stub) => stub.restore());
        });
        (0, mocha_1.test)("THEN there's an error that there's nothing to migrate", () => {
            (0, testUtilsv2_1.expect)(showErrorMessage.calledOnce).toBeTruthy();
            (0, testUtilsv2_1.expect)(showErrorMessage.args[0][0].includes("no vault")).toBeTruthy();
        });
        (0, mocha_1.test)("THEN no vault is prompted for", () => {
            (0, testUtilsv2_1.expect)(showQuickPick.called).toBeFalsy();
        });
        (0, mocha_1.test)("THEN the workspace did not reload since there was no migration", () => {
            (0, testUtilsv2_1.expect)(reloadWindow.called).toBeFalsy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there's only a single vault, and it's not self contained", {
        selfContained: false,
        modConfigCb: (config) => {
            const vault = common_all_1.ConfigUtils.getVaults(config)[0];
            // Using an asset in the vault as the logo. Migration should update the path.
            common_all_1.ConfigUtils.setPublishProp(config, "logoPath", `${vault.fsPath}/assets/image.png`);
            return config;
        },
        postSetupHook: async ({ wsRoot, vaults }) => {
            const vaultPath = (0, common_server_1.pathForVaultRoot)({ wsRoot, vault: vaults[0] });
            // Mock git folder & files to see if migration handles them.
            await fs_extra_1.default.ensureDir(path_1.default.join(vaultPath, ".git"));
            await fs_extra_1.default.writeFile(path_1.default.join(vaultPath, ".gitignore"), "");
            // Also mock the logo file
            await fs_extra_1.default.ensureDir(path_1.default.join(vaultPath, "assets"));
            await fs_extra_1.default.writeFile(path_1.default.join(vaultPath, "assets", "image.png"), "");
        },
    }, () => {
        let reloadWindow;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const cmd = new MigrateSelfContainedVault_1.MigrateSelfContainedVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            reloadWindow = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            showQuickPick = stubMigrateQuickPick(common_all_1.VaultUtils.getName(vaults[0]));
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            [reloadWindow, showQuickPick].forEach((stub) => stub.restore());
        });
        (0, mocha_1.test)("THEN it prompts for the vault and confirmation", () => {
            (0, testUtilsv2_1.expect)(showQuickPick.callCount).toEqual(2);
        });
        (0, mocha_1.test)("THEN the workspace reloads to apply the migration", () => {
            (0, testUtilsv2_1.expect)(reloadWindow.called).toBeTruthy();
        });
        (0, mocha_1.test)("THEN the vault is migrated", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(await verifyVaultHasMigrated({ wsRoot, vault: vaults[0] })).toBeTruthy();
        });
        (0, mocha_1.test)("THEN the logoPath is updated to account for the moved asset", async () => {
            const { wsRoot, config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const logoPath = common_all_1.ConfigUtils.getPublishing(config).logoPath;
            (0, testUtilsv2_1.expect)(logoPath).toBeTruthy();
            // If the logoPath was not updated, then we won't find the asset file there
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, path_1.default.normalize(logoPath)))).toBeTruthy();
        });
        (0, mocha_1.test)("THEN the git folders/files are handled correctly", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join((0, common_server_1.pathForVaultRoot)({ vault: vaults[0], wsRoot }), ".git"))).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join((0, common_server_1.pathForVaultRoot)({ vault: vaults[0], wsRoot }), ".gitignore"))).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there's a workspace vault", {
        selfContained: false,
        postSetupHook: async ({ wsRoot, vaults }) => {
            const vaultPath = (0, common_server_1.pathForVaultRoot)({ wsRoot, vault: vaults[0] });
            // Turn the regular vault inside the workspace into a workspace vault
            await engine_server_1.WorkspaceService.createWorkspace({
                useSelfContainedVault: false,
                wsRoot: vaultPath,
                wsVault: {
                    fsPath: "inner",
                },
            });
            const wsService = new engine_server_1.WorkspaceService({
                wsRoot: vaultPath,
            });
            await wsService.createVault({
                addToCodeWorkspace: true,
                vault: {
                    fsPath: "vault",
                },
            });
        },
    }, () => {
        let reloadWindow;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const cmd = new MigrateSelfContainedVault_1.MigrateSelfContainedVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            reloadWindow = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            showQuickPick = stubMigrateQuickPick(common_all_1.VaultUtils.getName(vaults[0]));
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            [reloadWindow, showQuickPick].forEach((stub) => stub.restore());
        });
        (0, mocha_1.test)("THEN it prompts for the vault and confirmation", () => {
            (0, testUtilsv2_1.expect)(showQuickPick.callCount).toEqual(2);
        });
        (0, mocha_1.test)("THEN the workspace reloads to apply the migration", () => {
            (0, testUtilsv2_1.expect)(reloadWindow.called).toBeTruthy();
        });
        (0, mocha_1.test)("THEN the vault is migrated", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(await verifyVaultHasMigrated({ wsRoot, vault: vaults[0] })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN there are multiple vaults", { selfContained: false }, () => {
        let reloadWindow;
        let showQuickPick;
        (0, mocha_1.before)(async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const cmd = new MigrateSelfContainedVault_1.MigrateSelfContainedVaultCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
            reloadWindow = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            showQuickPick = stubMigrateQuickPick(common_all_1.VaultUtils.getName(vaults[0]));
            await cmd.run();
        });
        (0, mocha_1.after)(() => {
            [reloadWindow, showQuickPick].forEach((stub) => stub.restore());
        });
        (0, mocha_1.test)("THEN it prompts for the vault and confirmation", () => {
            (0, testUtilsv2_1.expect)(showQuickPick.callCount).toEqual(2);
        });
        (0, mocha_1.test)("THEN the workspace reloads to apply the migration", () => {
            (0, testUtilsv2_1.expect)(reloadWindow.called).toBeTruthy();
        });
        (0, mocha_1.test)("THEN the vault is migrated", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(await verifyVaultHasMigrated({ wsRoot, vault: vaults[0] })).toBeTruthy();
        });
    });
});
async function verifyVaultNotMigrated({ wsRoot, vault, }) {
    const vaultFolder = path_1.default.join(wsRoot, vault.fsPath);
    // No config files inside the vault
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultFolder, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeFalsy();
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultFolder, common_all_1.CONSTANTS.DENDRON_WS_NAME))).toBeFalsy();
    // No notes folder
    const notesFolder = path_1.default.join(vaultFolder, common_all_1.FOLDERS.NOTES);
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(notesFolder)).toBeFalsy();
    // and the vault should NOT be marked as self contained in the config
    const config = common_server_1.DConfig.getRaw(wsRoot);
    const newVault = common_all_1.ConfigUtils.getVaults(config).find((newVault) => newVault.fsPath === vault.fsPath);
    (0, testUtilsv2_1.expect)(newVault?.selfContained).toBeFalsy();
    return true;
}
async function verifyVaultHasMigrated({ wsRoot, vault, }) {
    const vaultFolder = path_1.default.join(wsRoot, vault.fsPath);
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(vaultFolder)).toBeTruthy();
    // If it is migrated, then it should have config files inside it
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultFolder, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultFolder, common_all_1.CONSTANTS.DENDRON_WS_NAME))).toBeTruthy();
    // If it is migrated, the notes should be inside `notes` now
    const notesFolder = path_1.default.join(vaultFolder, common_all_1.FOLDERS.NOTES);
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(notesFolder)).toBeTruthy();
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(notesFolder, "root.md"))).toBeTruthy();
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(notesFolder, "root.schema.yml"))).toBeTruthy();
    // and there should be no notes outside the notes folder
    (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(vaultFolder, "root.md"))).toBeFalsy();
    // and the vault should be marked as self contained in the config
    const config = common_server_1.DConfig.getRaw(wsRoot);
    const newVault = common_all_1.ConfigUtils.getVaults(config).find((newVault) => newVault.fsPath === vault.fsPath);
    (0, testUtilsv2_1.expect)(newVault?.selfContained).toBeTruthy();
    return true;
}
//# sourceMappingURL=MigrateSelfContainedVault.test.js.map