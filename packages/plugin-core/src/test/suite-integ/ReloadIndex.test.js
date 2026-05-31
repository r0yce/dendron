"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const ReloadIndex_1 = require("../../commands/ReloadIndex");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const mocha_1 = require("mocha");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const common_all_1 = require("@dendronhq/common-all");
const vscode_1 = require("vscode");
const sinon_1 = __importDefault(require("sinon"));
const vsCodeUtils_1 = require("../../vsCodeUtils");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
suite("GIVEN ReloadIndex", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN root files are missing", {}, () => {
        let rootFiles = [];
        (0, mocha_1.before)(async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultDir = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
            rootFiles = [
                path_1.default.join(vaultDir, "root.md"),
                path_1.default.join(vaultDir, "root.schema.yml"),
            ];
            await Promise.all(rootFiles.map((ent) => fs_extra_1.default.remove(ent)));
            await new ReloadIndex_1.ReloadIndexCommand().run();
        });
        (0, mocha_1.test)("THEN the root files are recreated", async () => {
            (0, testUtilsv2_1.expect)(lodash_1.default.every(await Promise.all(rootFiles.map((ent) => fs_extra_1.default.pathExists(ent))))).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN root files exist", {}, () => {
        let rootFiles = [];
        (0, mocha_1.before)(async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultDir = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
            rootFiles = [
                path_1.default.join(vaultDir, "root.md"),
                path_1.default.join(vaultDir, "root.schema.yml"),
            ];
            await Promise.all([
                fs_extra_1.default.appendFile(rootFiles[0], "bond", { encoding: "utf8" }),
                fs_extra_1.default.appendFile(rootFiles[1], "# bond", { encoding: "utf8" }),
            ]);
            await new ReloadIndex_1.ReloadIndexCommand().run();
        });
        (0, mocha_1.test)("THEN the root files are not overwritten", async () => {
            (0, testUtilsv2_1.expect)(lodash_1.default.every(await Promise.all(rootFiles.map(async (ent) => (await fs_extra_1.default.readFile(ent)).includes("bond"))))).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there are 2 notes with duplicate note IDs", {}, () => {
        const duplicateId = "duplicate";
        const firstNote = "first";
        const secondNote = "second";
        let showMessage;
        (0, mocha_1.before)(async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: firstNote,
                vault: vaults[0],
                wsRoot,
                props: {
                    id: duplicateId,
                },
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: secondNote,
                vault: vaults[0],
                wsRoot,
                props: {
                    id: duplicateId,
                },
            });
            showMessage = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showMessage").resolves(undefined);
            await new ReloadIndex_1.ReloadIndexCommand().run();
        });
        (0, mocha_1.test)("THEN warns that there are notes with duplicated IDs", async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(showMessage.callCount).toEqual(1);
            (0, testUtilsv2_1.expect)(showMessage.firstCall.args[1].includes(firstNote)).toBeTruthy();
            (0, testUtilsv2_1.expect)(showMessage.firstCall.args[1].includes(secondNote)).toBeTruthy();
            (0, testUtilsv2_1.expect)(showMessage.firstCall.args[1].includes(common_all_1.VaultUtils.getName(vaults[0]))).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there are many notes with duplicate note IDs", {}, () => {
        const duplicateId = "duplicate";
        const firstNote = "first";
        const secondNote = "second";
        const thirdNote = "third";
        let showMessage;
        (0, mocha_1.before)(async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: firstNote,
                vault: vaults[0],
                wsRoot,
                props: {
                    id: duplicateId,
                },
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: secondNote,
                vault: vaults[0],
                wsRoot,
                props: {
                    id: duplicateId,
                },
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: thirdNote,
                vault: vaults[0],
                wsRoot,
                props: {
                    id: duplicateId,
                },
            });
            showMessage = sinon_1.default
                .stub(vsCodeUtils_1.VSCodeUtils, "showMessage")
                .resolves(undefined);
            await new ReloadIndex_1.ReloadIndexCommand().run();
        });
        (0, mocha_1.test)("THEN warns multiple times that there are notes with duplicated IDs", async () => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(showMessage.callCount).toEqual(2);
            (0, testUtilsv2_1.expect)(showMessage.getCall(0).args[1].includes(firstNote)).toBeTruthy();
            (0, testUtilsv2_1.expect)(showMessage.getCall(0).args[1].includes(secondNote)).toBeTruthy();
            (0, testUtilsv2_1.expect)(showMessage.getCall(0).args[1].includes(common_all_1.VaultUtils.getName(vaults[0]))).toBeTruthy();
            (0, testUtilsv2_1.expect)(showMessage.getCall(1).args[1].includes(secondNote)).toBeTruthy();
            (0, testUtilsv2_1.expect)(showMessage.getCall(1).args[1].includes(thirdNote)).toBeTruthy();
            (0, testUtilsv2_1.expect)(showMessage.getCall(1).args[1].includes(common_all_1.VaultUtils.getName(vaults[0]))).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN there is a single vault missing", {}, () => {
        (0, mocha_1.before)(async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
            await fs_extra_1.default.rm(vaultPath, { recursive: true, maxRetries: 2 });
        });
        (0, mocha_1.test)("THEN other vaults are still loaded", async () => {
            const engine = await new ReloadIndex_1.ReloadIndexCommand().run();
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            (0, testUtilsv2_1.expect)(engine).toBeTruthy();
            const allNotes = await engine?.findNotesMeta({ fname: "root" });
            const notes = lodash_1.default.sortBy(allNotes, (note) => path_1.default.basename(note.vault.fsPath));
            (0, testUtilsv2_1.expect)(notes.length).toEqual(2);
            (0, testUtilsv2_1.expect)(common_all_1.VaultUtils.isEqualV2(notes[0].vault, vaults[1])).toBeTruthy();
            (0, testUtilsv2_1.expect)(common_all_1.VaultUtils.isEqualV2(notes[1].vault, vaults[2])).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN a self contained vault is misconfigured", {
        selfContained: true,
        postSetupHook: async ({ wsRoot }) => {
            const config = common_server_1.DConfig.getOrCreate(wsRoot);
            (0, testUtilsv2_1.expect)(config.workspace.vaults.length).toEqual(1);
            delete config.workspace.vaults[0].selfContained;
            await common_server_1.DConfig.writeConfig({ wsRoot, config });
        },
    }, () => {
        (0, mocha_1.test)("THEN it prompts to fix the config", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            sinon_1.default
                .stub(vscode_1.window, "showWarningMessage")
                // Cast needed because sinon doesn't get which overload we're stubbing
                .resolves(ReloadIndex_1.FIX_CONFIG_SELF_CONTAINED);
            const reloadWindow = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            await ReloadIndex_1.ReloadIndexCommand.checkAndPromptForMisconfiguredSelfContainedVaults({ engine: ExtensionProvider_1.ExtensionProvider.getEngine() });
            // Should reload window after fixing so the plugin picks up new vault config
            (0, testUtilsv2_1.expect)(reloadWindow.calledOnce).toBeTruthy();
            // The config should be updated to mark the vault as self contained
            const configAfter = common_server_1.DConfig.getOrCreate(wsRoot);
            (0, testUtilsv2_1.expect)(configAfter.workspace.vaults[0].selfContained).toBeTruthy();
        });
    });
});
//# sourceMappingURL=ReloadIndex.test.js.map