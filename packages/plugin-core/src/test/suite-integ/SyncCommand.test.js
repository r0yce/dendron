"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const Sync_1 = require("../../commands/Sync");
const workspace_1 = require("../../workspace");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const fs_extra_1 = __importDefault(require("fs-extra"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const path_1 = __importDefault(require("path"));
suite("workspace sync command", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    (0, mocha_1.describe)("no repo", () => {
        test("do nothing", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                onInit: async () => {
                    const out = await new Sync_1.SyncCommand().execute();
                    (0, testUtilsv2_1.expect)(out).toBeTruthy();
                    const { committed, pulled, pushed } = out;
                    // Nothing should have happened since there is no repository
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    done();
                },
                ctx,
            });
        });
    });
    (0, mocha_1.describe)("no remote", () => {
        test("commit", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                onInit: async ({ wsRoot, vaults }) => {
                    await engine_test_utils_1.GitTestUtils.createRepoForWorkspace(wsRoot);
                    await changeConfig(wsRoot, "workspace.workspaceVaultSyncMode", common_all_1.DVaultSync.SYNC);
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    (0, testUtilsv2_1.expect)(out).toBeTruthy();
                    const { committed, pulled, pushed } = out;
                    // The note created above should get committed
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
                    // Nothing to pull or push since we don't have a remote set up
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.NO_REMOTE);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_REMOTE);
                    done();
                },
                ctx,
            });
        });
    });
    (0, mocha_1.describe)("with remote", () => {
        test("commit and push", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    (0, testUtilsv2_1.expect)(out).toBeTruthy();
                    const { committed, pulled, pushed } = out;
                    // Should not attempt to commit since this is technically a workspace vault, and the default is noCommit
                    // (the repo is at the root of the workspace, vault doesn't have it's own repo)
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    // Should attempt to pull since the remote is set up
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
                    // Should not push since there are no comitted changes
                    // (no commit since createRepo..., unlike other tests where changeConfig creates a commit)
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_CHANGES);
                    done();
                },
                ctx,
            });
        });
    });
    (0, mocha_1.describe)("with workspace vault config", async () => {
        test("no commit", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                modConfigCb: (config) => {
                    common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", common_all_1.DVaultSync.SKIP);
                    return config;
                },
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.workspaceVaultSyncMode", common_all_1.DVaultSync.NO_COMMIT);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // Nothing should get committed since "noCommit" is used
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    // Should pull and push since configuration allows it
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
                    done();
                },
            });
        });
        test("no push", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.workspaceVaultSyncMode", common_all_1.DVaultSync.NO_PUSH);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // The note added should get committed
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
                    // Should try to pull since allowed by configuration
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
                    // Should not push since "noPush" is used
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    done();
                },
            });
        });
        test("skip", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.workspaceVaultSyncMode", common_all_1.DVaultSync.SKIP);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // Nothing should be done since "skip" is used
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    done();
                },
            });
        });
        test("sync", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.workspaceVaultSyncMode", common_all_1.DVaultSync.SYNC);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // Should try doing everything since the config requires so
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("with per-vault config", async () => {
        test("no commit", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.vaults", [
                        { fsPath: "vault1", sync: common_all_1.DVaultSync.NO_COMMIT },
                        { fsPath: "vault2" },
                        { fsPath: "vault3", name: "vaultThree" },
                    ]);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // Nothing should get committed since "noCommit" is used
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    // Should pull and push since configuration allows it
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
                    done();
                },
            });
        });
        test("no push", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.vaults", [
                        { fsPath: "vault1", sync: common_all_1.DVaultSync.NO_PUSH },
                        { fsPath: "vault2" },
                        { fsPath: "vault3", name: "vaultThree" },
                    ]);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // The note added should get committed
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
                    // Should try to pull since allowed by configuration
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
                    // Should not push since "noPush" is used
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    done();
                },
            });
        });
        test("skip", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.vaults", [
                        { fsPath: "vault1", sync: common_all_1.DVaultSync.SKIP },
                        { fsPath: "vault2" },
                        { fsPath: "vault3", name: "vaultThree" },
                    ]);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // Nothing should be done since "skip" is used
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
                    done();
                },
            });
        });
        test("sync", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await changeConfig(wsRoot, "workspace.vaults", [
                        { fsPath: "vault1", sync: common_all_1.DVaultSync.SYNC },
                        { fsPath: "vault2" },
                        { fsPath: "vault3", name: "vaultThree" },
                    ]);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // Should try doing everything since the config requires so
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("WHEN repo has remote, but branch has no upstream", () => {
        test("THEN Dendron commits and warns about missing upstream", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                onInit: async ({ wsRoot, vaults }) => {
                    const remoteDir = (0, common_server_1.tmpDir)().name;
                    await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
                    await checkoutNewBranch(wsRoot, "test-branch");
                    await changeConfig(wsRoot, "workspace.vaults", [
                        { fsPath: "vault1", sync: common_all_1.DVaultSync.SYNC },
                        { fsPath: "vault2" },
                        { fsPath: "vault3", name: "vaultThree" },
                    ]);
                    // Create a new note so there are some changes
                    await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "my-new-note",
                        body: "Lorem ipsum",
                        wsRoot,
                        vault: vaults[0],
                    });
                    const out = await new Sync_1.SyncCommand().execute();
                    const { committed, pulled, pushed } = out;
                    // Should try to commit since there are changes
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
                    // Won't be able to pull or push because new branch has no upstream.
                    // This should be gracefully handled.
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.NO_UPSTREAM);
                    (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
                    (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_UPSTREAM);
                    done();
                },
            });
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there are no changes", {
        ctx,
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
    }, () => {
        test("THEN Dendron skips committing", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            // Add everything and push, so that there's no changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "add all and commit" });
            await git.push();
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_CHANGES);
            // Should still pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
            // nothing to push either
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_CHANGES);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there are tracked, uncommitted changes", {
        ctx,
        modConfigCb: (config) => {
            const vaults = common_all_1.ConfigUtils.getVaults(config);
            vaults[0].sync = common_all_1.DVaultSync.NO_COMMIT;
            common_all_1.ConfigUtils.setVaults(config, vaults);
            return config;
        },
    }, () => {
        test("THEN Dendron stashes and restores the changes", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "add all and commit" });
            await git.push();
            // Update root note so there are tracked changes
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0],
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Similique non atque");
            // Also create an untracked change
            const untrackedChange = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "untracked-new-note",
                vault: vaults[0],
                wsRoot,
                body: "Quia dolores rem ad et aut.",
            });
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
            // Should still stash and pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
            // the changes, tracked and untracked, should be restored after the pull
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath,
                match: ["Similique non atque"],
            });
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath: common_all_1.NoteUtils.getFullPath({ note: untrackedChange, wsRoot }),
                match: ["Quia dolores rem ad et aut."],
            });
            engine_test_utils_1.GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" });
            // nothing to push
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_CHANGES);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there are tracked, uncommitted changes", {
        ctx,
        modConfigCb: (config) => {
            const vaults = common_all_1.ConfigUtils.getVaults(config);
            vaults[0].sync = common_all_1.DVaultSync.NO_COMMIT;
            common_all_1.ConfigUtils.setVaults(config, vaults);
            return config;
        },
    }, () => {
        test("THEN Dendron stashes and restores the changes", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "add all and commit" });
            await git.push();
            // Update root note so there are tracked changes
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0],
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Similique non atque");
            // Also create an untracked change
            const untrackedChange = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "untracked-new-note",
                vault: vaults[0],
                wsRoot,
                body: "Quia dolores rem ad et aut.",
            });
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
            // Should still stash and pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
            // the changes, tracked and untracked, should be restored after the pull
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath,
                match: ["Similique non atque"],
            });
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath: common_all_1.NoteUtils.getFullPath({ note: untrackedChange, wsRoot }),
                match: ["Quia dolores rem ad et aut."],
            });
            // There should be tracked, uncommitted changes
            (0, testUtilsv2_1.expect)(await engine_test_utils_1.GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })).toBeTruthy();
            // nothing to push
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_CHANGES);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN git pull adds changes that conflict with local changes", {
        ctx,
        modConfigCb: (config) => {
            const vaults = common_all_1.ConfigUtils.getVaults(config);
            vaults[0].sync = common_all_1.DVaultSync.NO_COMMIT;
            common_all_1.ConfigUtils.setVaults(config, vaults);
            return config;
        },
    }, () => {
        test("THEN Dendron still restores local changes", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "add all and commit" });
            await git.push();
            const note = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            // Clone to a second location, then push a change through that
            const secondaryDir = (0, common_server_1.tmpDir)().name;
            const secondaryGit = new engine_server_1.Git({
                localUrl: secondaryDir,
                remoteUrl: remoteDir,
            });
            await secondaryGit.clone(".");
            const secondaryFpath = common_all_1.NoteUtils.getFullPath({
                note,
                wsRoot: secondaryDir,
            });
            await fs_extra_1.default.appendFile(secondaryFpath, "Aut ut nisi dolores quae et");
            await secondaryGit.addAll();
            await secondaryGit.commit({ msg: "secondary" });
            await secondaryGit.push();
            // Update root note so there are tracked changes
            const fpath = common_all_1.NoteUtils.getFullPath({
                note,
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Similique non atque");
            // Also create an untracked change
            const untrackedChange = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                engine,
                fname: "untracked-new-note",
                vault: vaults[0],
                wsRoot,
                body: "Quia dolores rem ad et aut.",
            });
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            // Should still stash and pull, but notice the merge conflict after restoring
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
            (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT_AFTER_RESTORE);
            // the changes, tracked and untracked, should be restored after the pull
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath,
                match: [
                    // The uncommitted changes in this repo, restored
                    "Similique non atque",
                    // The pulled changes from the secondary dir
                    "Aut ut nisi dolores quae et",
                    // There's a merge conflict because of the pulled changes
                    "<<<<<",
                    ">>>>>",
                ],
            });
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath: common_all_1.NoteUtils.getFullPath({ note: untrackedChange, wsRoot }),
                match: ["Quia dolores rem ad et aut."],
            });
            // There should be tracked, uncommitted changes
            (0, testUtilsv2_1.expect)(await engine_test_utils_1.GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })).toBeTruthy();
            // nothing to push
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN git pull adds changes that don't conflict with local changes", {
        ctx,
        modConfigCb: (config) => {
            const vaults = common_all_1.ConfigUtils.getVaults(config);
            vaults[0].sync = common_all_1.DVaultSync.NO_COMMIT;
            common_all_1.ConfigUtils.setVaults(config, vaults);
            return config;
        },
    }, () => {
        test("THEN Dendron still restores local changes", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            const rootNote = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            const otherNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "non-conflicting",
                vault: vaults[0],
                wsRoot,
                engine,
            });
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "add all and commit" });
            await git.push();
            // Clone to a second location, then push a change through that
            const secondaryDir = (0, common_server_1.tmpDir)().name;
            const secondaryGit = new engine_server_1.Git({
                localUrl: secondaryDir,
                remoteUrl: remoteDir,
            });
            await secondaryGit.clone(".");
            const secondaryFpath = common_all_1.NoteUtils.getFullPath({
                note: otherNote,
                wsRoot: secondaryDir,
            });
            await fs_extra_1.default.appendFile(secondaryFpath, "Aut ut nisi dolores quae et");
            await secondaryGit.addAll();
            await secondaryGit.commit({ msg: "secondary" });
            await secondaryGit.push();
            // Update root note so there are tracked changes
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Similique non atque");
            const otherNoteFpath = common_all_1.NoteUtils.getFullPath({
                note: otherNote,
                wsRoot,
            });
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
            // Should still stash and pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
            // the changes, tracked and untracked, should be restored after the pull
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath,
                match: [
                    // The uncommitted changes in this repo, restored
                    "Similique non atque",
                ],
                nomatch: [
                    // No merge conflict
                    "<<<<<",
                    ">>>>>",
                ],
            });
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath: otherNoteFpath,
                // we have the change that we pulled in
                match: ["Aut ut nisi dolores quae et"],
                nomatch: [
                    // No merge conflict
                    "<<<<<",
                    ">>>>>",
                ],
            });
            // There should be tracked, uncommitted changes
            (0, testUtilsv2_1.expect)(await engine_test_utils_1.GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })).toBeTruthy();
            // nothing to push
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_CHANGES);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN git pull causes a rebase", {
        ctx,
        modConfigCb: (config) => {
            const vaults = common_all_1.ConfigUtils.getVaults(config);
            vaults[0].sync = common_all_1.DVaultSync.NO_COMMIT;
            common_all_1.ConfigUtils.setVaults(config, vaults);
            return config;
        },
    }, () => {
        test("THEN rebase works, and Dendron still restores local changes", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            const rootNote = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            const otherNote = await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "non-conflicting",
                vault: vaults[0],
                wsRoot,
                engine,
            });
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "first commit" });
            await git.push();
            // Update root note and add a commit that's not in remote, so there'll be something to rebase
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Deserunt culpa in expedita\n");
            const otherNoteFpath = common_all_1.NoteUtils.getFullPath({
                note: otherNote,
                wsRoot,
            });
            await git.addAll();
            await git.commit({ msg: "second commit" });
            // Clone to a second location, then push a change through that
            const secondaryDir = (0, common_server_1.tmpDir)().name;
            const secondaryGit = new engine_server_1.Git({
                localUrl: secondaryDir,
                remoteUrl: remoteDir,
            });
            await secondaryGit.clone(".");
            const secondaryFpath = common_all_1.NoteUtils.getFullPath({
                note: otherNote,
                wsRoot: secondaryDir,
            });
            await fs_extra_1.default.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
            await secondaryGit.addAll();
            await secondaryGit.commit({ msg: "secondary" });
            await secondaryGit.push();
            // Update root note so there are tracked changes
            await fs_extra_1.default.appendFile(fpath, "Similique non atque\n");
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
            // Should still stash and pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
            // the changes, tracked and untracked, should be restored after the pull
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath,
                match: [
                    // The uncommitted changes in this repo, restored
                    "Similique non atque",
                    // the rebased change is still there too
                    "Deserunt culpa in expedita",
                ],
                nomatch: [
                    // No merge conflict
                    "<<<<<",
                    ">>>>>",
                ],
            });
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath: otherNoteFpath,
                // we have the change that we pulled in
                match: ["Aut ut nisi dolores quae et"],
                nomatch: [
                    // No merge conflict
                    "<<<<<",
                    ">>>>>",
                ],
            });
            // There should be tracked, uncommitted changes
            (0, testUtilsv2_1.expect)(await engine_test_utils_1.GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })).toBeTruthy();
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN git pull causes a rebase but hits a conflict, and there are no local changes", {
        ctx,
        modConfigCb: (config) => {
            const vaults = common_all_1.ConfigUtils.getVaults(config);
            vaults[0].sync = common_all_1.DVaultSync.NO_COMMIT;
            common_all_1.ConfigUtils.setVaults(config, vaults);
            return config;
        },
    }, () => {
        test("THEN pull succeeds but there's a merge conflict", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            const rootNote = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "first commit" });
            await git.push();
            // Update root note and add a commit that's not in remote, so there'll be something to rebase
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Deserunt culpa in expedita\n");
            await git.addAll();
            await git.commit({ msg: "second commit" });
            // Clone to a second location, then push a change through that
            const secondaryDir = (0, common_server_1.tmpDir)().name;
            const secondaryGit = new engine_server_1.Git({
                localUrl: secondaryDir,
                remoteUrl: remoteDir,
            });
            await secondaryGit.clone(".");
            const secondaryFpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot: secondaryDir,
            });
            await fs_extra_1.default.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
            await secondaryGit.addAll();
            await secondaryGit.commit({ msg: "secondary" });
            await secondaryGit.push();
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
            // Should still stash and pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
            (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT_AFTER_PULL);
            // the changes, tracked and untracked, should be restored after the pull
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath,
                match: [
                    // the stuff before the pull is still there
                    "Deserunt culpa in expedita",
                    // The pulled stuff is there
                    "Aut ut nisi dolores quae et",
                    // there's a merge conflict
                    "<<<<<",
                    ">>>>>",
                ],
            });
            // There should be tracked, uncommitted changes
            (0, testUtilsv2_1.expect)(await engine_test_utils_1.GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })).toBeTruthy();
            // can't push because there's a merge conflict that happened during the pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN git pull causes a rebase but hits a conflict, and there are local changes", {
        ctx,
        modConfigCb: (config) => {
            const vaults = common_all_1.ConfigUtils.getVaults(config);
            vaults[0].sync = common_all_1.DVaultSync.NO_COMMIT;
            common_all_1.ConfigUtils.setVaults(config, vaults);
            return config;
        },
    }, () => {
        test("THEN pull fails, and Dendron restores local changes", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            const rootNote = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "first commit" });
            await git.push();
            // Update root note and add a commit that's not in remote, so there'll be something to rebase
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Deserunt culpa in expedita\n");
            await git.addAll();
            await git.commit({ msg: "second commit" });
            // Clone to a second location, then push a change through that
            const secondaryDir = (0, common_server_1.tmpDir)().name;
            const secondaryGit = new engine_server_1.Git({
                localUrl: secondaryDir,
                remoteUrl: remoteDir,
            });
            await secondaryGit.clone(".");
            const secondaryFpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot: secondaryDir,
            });
            await fs_extra_1.default.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
            await secondaryGit.addAll();
            await secondaryGit.commit({ msg: "secondary" });
            await secondaryGit.push();
            // Update root note so there are tracked changes
            await fs_extra_1.default.appendFile(fpath, "Similique non atque\n");
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip committing since it's set to no commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.SKIP_CONFIG);
            // Should still stash and pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
            (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT_LOSES_CHANGES);
            // the changes, tracked and untracked, should be restored after the pull
            await common_test_utils_1.FileTestUtils.assertInFile({
                fpath,
                match: [
                    // The uncommitted changes in this repo, restored
                    "Similique non atque",
                    // the stuff before the pull is still there
                    "Deserunt culpa in expedita",
                ],
                nomatch: [
                    // no conflict because we rolled it back
                    "<<<<<",
                    ">>>>>",
                    // We failed to pull
                    "Aut ut nisi dolores quae et",
                ],
            });
            // There should be tracked, uncommitted changes
            (0, testUtilsv2_1.expect)(await engine_test_utils_1.GitTestUtils.hasChanges(wsRoot, { untrackedFiles: "no" })).toBeTruthy();
            // can't push because we couldn't pull the changes
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.UNPULLED_CHANGES);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there is a merge conflict", {
        ctx,
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
    }, () => {
        test("THEN Dendron skips doing stuff", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            const rootNote = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot, remoteUrl: remoteDir });
            await git.addAll();
            await git.commit({ msg: "first commit" });
            await git.push();
            // Update root note and add a commit that's not in remote, so there'll be something to rebase
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Deserunt culpa in expedita\n");
            await git.addAll();
            await git.commit({ msg: "second commit" });
            // Clone to a second location, then push a change through that
            const secondaryDir = (0, common_server_1.tmpDir)().name;
            const secondaryGit = new engine_server_1.Git({
                localUrl: secondaryDir,
                remoteUrl: remoteDir,
            });
            await secondaryGit.clone(".");
            const secondaryFpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot: secondaryDir,
            });
            await fs_extra_1.default.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
            await secondaryGit.addAll();
            await secondaryGit.commit({ msg: "secondary" });
            await secondaryGit.push();
            // Cause an ongoing rebase
            try {
                await git.pull();
            }
            catch {
                // deliberately ignored
            }
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip everything since there's an ongoing rebase the user needs to resolve
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT);
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
            (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT);
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there is a rebase in progress, but the merge conflict has been resolved already", {
        ctx,
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
    }, () => {
        test("THEN Dendron skips doing stuff", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            const rootNote = (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0];
            // Add everything and push, so that there's no untracked changes
            const git = new engine_server_1.Git({ localUrl: wsRoot, remoteUrl: remoteDir });
            await git.addAll();
            await git.commit({ msg: "first commit" });
            await git.push();
            // Update root note and add a commit that's not in remote, so there'll be something to rebase
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Deserunt culpa in expedita\n");
            await git.addAll();
            await git.commit({ msg: "second commit" });
            // Clone to a second location, then push a change through that
            const secondaryDir = (0, common_server_1.tmpDir)().name;
            const secondaryGit = new engine_server_1.Git({
                localUrl: secondaryDir,
                remoteUrl: remoteDir,
            });
            await secondaryGit.clone(".");
            const secondaryFpath = common_all_1.NoteUtils.getFullPath({
                note: rootNote,
                wsRoot: secondaryDir,
            });
            await fs_extra_1.default.appendFile(secondaryFpath, "Aut ut nisi dolores quae et\n");
            await secondaryGit.addAll();
            await secondaryGit.commit({ msg: "secondary" });
            await secondaryGit.push();
            // Cause an ongoing rebase
            try {
                await git.pull();
            }
            catch {
                // deliberately ignored
            }
            // Mark the conflict as resolved
            await git.add(fpath);
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should skip everything since there's an ongoing rebase the user needs to resolve
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.REBASE_IN_PROGRESS);
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
            (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.REBASE_IN_PROGRESS);
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.REBASE_IN_PROGRESS);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN the remote is bad", {
        ctx,
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
    }, () => {
        test("THEN Dendron warns that it can't connect to the remote", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            // Delete the remote at this point so we can't use it
            await fs_extra_1.default.rm(remoteDir, { force: true, recursive: true });
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // There are some changes to commit
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
            // Should fail to push or pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(0);
            (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.BAD_REMOTE);
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(0);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.BAD_REMOTE);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN using a self contained vault, it is treated as a regular vault", {
        ctx,
        selfContained: true,
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "skip");
            return config;
        },
    }, () => {
        test("THEN Dendron stashes and restores the changes", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            const vault = vaults[0];
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteVault({
                wsRoot,
                vault,
                remoteDir,
            });
            // Add the vault to a repo
            const git = new engine_server_1.Git({
                localUrl: path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vault)),
            });
            await git.addAll();
            await git.commit({ msg: "add all and commit" });
            await git.push();
            // Update root note so there are tracked changes
            const fpath = common_all_1.NoteUtils.getFullPath({
                note: (await engine.findNotesMeta({ fname: "root", vault: vaults[0] }))[0],
                wsRoot,
            });
            await fs_extra_1.default.appendFile(fpath, "Similique non atque");
            const out = await new Sync_1.SyncCommand().execute();
            const { committed, pulled, pushed } = out;
            // Should use the vault default and sync everthing, and ignore the workspace default config
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.DONE);
            // Should pull
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pulled)).toEqual(1);
            (0, testUtilsv2_1.expect)(pulled[0].status).toEqual(engine_server_1.SyncActionStatus.DONE);
            // Should push
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(pushed)).toEqual(1);
            (0, testUtilsv2_1.expect)(pushed[0].status).toEqual(engine_server_1.SyncActionStatus.DONE);
        });
    });
});
async function checkoutNewBranch(wsRoot, branch) {
    const git = new engine_server_1.Git({ localUrl: wsRoot });
    await git._execute(`git checkout -b ${branch} --no-track`);
}
/** Override the config option in `dendron.yml`, then add commit that change. */
async function changeConfig(wsRoot, overridePath, value) {
    // Get old config, and override it with the new config
    const serv = (0, workspace_1.getExtension)().workspaceService;
    const config = serv.config;
    const override = lodash_1.default.set(config, overridePath, value);
    await serv.setConfig(override);
    // Commit this change, otherwise it will be a tracked file with changes which breaks git pull
    const git = new engine_server_1.Git({ localUrl: wsRoot });
    await git.add("dendron.yml");
    await git.commit({ msg: "update-config" });
}
//# sourceMappingURL=SyncCommand.test.js.map