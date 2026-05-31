"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const AddAndCommit_1 = require("../../commands/AddAndCommit");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
suite("GIVEN Workspace Add And Commit command is run", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN there are no changes", {
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
        timeout: 1e4,
    }, () => {
        test("THEN skip committing AND show no new changes message", async () => {
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            // Add everything and push, so that there's no changes
            const git = new engine_server_1.Git({ localUrl: wsRoot });
            await git.addAll();
            await git.commit({ msg: "add all and commit" });
            const out = await new AddAndCommit_1.AddAndCommit().execute();
            const { committed, finalMessage } = out;
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.NO_CHANGES);
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body: finalMessage,
                match: [
                    "Finished Commit",
                    "Skipped",
                    "because it has no new changes",
                    "Committed 0 repo",
                ],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there is a merge conflict", {
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
        timeout: 1e4,
    }, () => {
        test("THEN skip committing files AND show merge conflict message", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await engine_test_utils_1.GitTestUtils.createRemoteRepoWithRebaseConflict(wsRoot, vaults, engine);
            const out = await new AddAndCommit_1.AddAndCommit().execute();
            const { committed, finalMessage } = out;
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.MERGE_CONFLICT);
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body: finalMessage,
                match: [
                    "Finished Commit",
                    "Skipped",
                    "because they have merge conflicts that must be resolved manually. Committed 0 repo",
                ],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there is a rebase in progress", {
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
        timeout: 1e4,
    }, () => {
        test("THEN skip committing files AND show rebase conflict message", async () => {
            const { vaults, wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const { git, fpath } = await engine_test_utils_1.GitTestUtils.createRemoteRepoWithRebaseConflict(wsRoot, vaults, engine);
            // Mark the conflict as resolved
            await git.add(fpath);
            const out = await new AddAndCommit_1.AddAndCommit().execute();
            const { committed, finalMessage } = out;
            // Should skip everything since there's an ongoing rebase the user needs to resolve
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(0);
            (0, testUtilsv2_1.expect)(committed[0].status).toEqual(engine_server_1.SyncActionStatus.REBASE_IN_PROGRESS);
            (0, testUtilsv2_1.expect)(await common_test_utils_1.AssertUtils.assertInString({
                body: finalMessage,
                match: [
                    "Finished Commit",
                    "Skipped",
                    "because there's a rebase in progress that must be resolved. Committed 0 repo",
                ],
            })).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("WHEN there are unstaged changes", {
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setWorkspaceProp(config, "workspaceVaultSyncMode", "sync");
            return config;
        },
        timeout: 1e4,
    }, () => {
        test("THEN Dendron commit files successfully", async () => {
            const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const remoteDir = (0, common_server_1.tmpDir)().name;
            await engine_test_utils_1.GitTestUtils.createRepoForRemoteWorkspace(wsRoot, remoteDir);
            // Create a new note so there are some changes
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "my-new-note",
                body: "Lorem ipsum",
                wsRoot,
                vault: vaults[0],
            });
            const out = await new AddAndCommit_1.AddAndCommit().execute();
            const { committed, finalMessage } = out;
            // Should try to commit since there are changes
            (0, testUtilsv2_1.expect)(engine_server_1.WorkspaceUtils.getCountForStatusDone(committed)).toEqual(1);
            (0, testUtilsv2_1.expect)(finalMessage).toEqual("Finished Commit. Committed 1 repo");
        });
    });
});
//# sourceMappingURL=AddAndCommitCommand.test.js.map