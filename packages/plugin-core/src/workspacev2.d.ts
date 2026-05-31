import { DVault } from "@dendronhq/common-all";
import { DendronEngineClient, DEngineClient } from "@dendronhq/engine-server";
import { FSWatcher } from "fs-extra";
import vscode from "vscode";
export type DWorkspaceInitOpts = {
    onReady?: (({}: {
        ws: DWorkspace;
    }) => Promise<void>) | undefined;
    numRetries?: number | undefined;
};
export declare class DWorkspace {
    wsRoot: string;
    vaults: DVault[];
    _engine: DEngineClient | undefined;
    port: number | undefined;
    onReady?: (({ ws }: {
        ws: DWorkspace;
    }) => Promise<void>) | undefined;
    serverPortWatcher?: FSWatcher;
    static _WS: DWorkspace | undefined;
    static getOrCreate(opts?: {
        force: boolean;
    }): {
        justInitialized: boolean;
        ws: DWorkspace;
    };
    static workspaceFile: vscode.Uri | undefined;
    static workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined;
    constructor();
    init(opts?: DWorkspaceInitOpts): Promise<void>;
    initEngine({ port }: {
        port: number;
    }): Promise<DendronEngineClient>;
    get engine(): DEngineClient;
    createServerWatcher(opts?: {
        numRetries?: number | undefined;
    }): Promise<void>;
    onChangePort({ port }: {
        port: number;
    }): Promise<void>;
}
