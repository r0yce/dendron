import { DEngineClient } from "@dendronhq/common-all";
import { Git } from "@dendronhq/engine-server";
import type { DVault } from "..";
export declare class GitTestUtils {
    static createRepoForWorkspace(wsRoot: string): Promise<void>;
    static createRepoForVault({ wsRoot, vault, }: {
        wsRoot: string;
        vault: DVault;
    }): Promise<void>;
    static hasChanges(wsRoot: string, opts: Parameters<Git["hasChanges"]>[0]): Promise<boolean>;
    /** Creates a "bare" git repository, to be used as the remote for a workspace.
     *
     * You'll probably want to just use `createRepoForRemoteWorkspace` instead, but this is provided if you are testing something it can't handle.
     */
    static remoteCreate(remoteDir: string): Promise<void>;
    /** Adds a bare repository created with `createRemote` as the remote for the workspace.
     *
     * You'll probably want to just use `createRepoForRemoteWorkspace` instead, but this is provided if you are testing something it can't handle.
     */
    static remoteAdd(wsRoot: string, remoteDir: string): Promise<void>;
    /** Set up a workspace with a remote, intended to be used when testing pull or push functionality.
     *
     * @param wsRoot Directory where the workspace will be stored.
     * @param remoteDir Directory where the remote will be stored. The workspace will pull and push to this remote.
     */
    static createRepoForRemoteWorkspace(wsRoot: string, remoteDir: string): Promise<void>;
    /** Set up a vault with a remote, intended to be used when testing pull or push functionality.
     *
     * @param wsRoot Directory where the vault exists.
     * @param remoteDir Directory where the remote will be stored. The vault will pull and push to this remote.
     */
    static createRepoForRemoteVault({ wsRoot, vault, remoteDir, }: {
        wsRoot: string;
        vault: DVault;
        remoteDir: string;
    }): Promise<void>;
    /**
     * Convert existing workspace into a remote workspace
     * @param wsRoot Directory where the workspace will be stored.
     * @param remoteDir Directory where the remote will be stored. The workspace will pull and push to this remote.
     */
    static addRepoToWorkspace(wsRoot: string): Promise<void>;
    /**
     * Create a git backed remote
     * /{root}
     *   - .git
     *   - README.md
     * @param root
     * @param opts
     */
    static createRepoWithReadme(root: string, opts?: {
        remote?: boolean;
        branchName?: string;
    }): Promise<void>;
    /** Set up a workspace with a remote, intended to be used when testing rebase and merge conflicts.
     * @param wsRoot Directory where the workspace will be stored.
     * @param engine
     * @param vaults
     */
    static createRemoteRepoWithRebaseConflict(wsRoot: string, vaults: DVault[], engine: DEngineClient): Promise<{
        git: Git;
        fpath: string;
    }>;
}
