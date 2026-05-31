import { DendronConfig, DEngineClient, DVault, DWorkspaceV2, WorkspaceType } from "@dendronhq/common-all";
import * as vscode from "vscode";
export declare abstract class DendronBaseWorkspace implements DWorkspaceV2 {
    wsRoot: string;
    type: WorkspaceType;
    logUri: vscode.Uri;
    assetUri: vscode.Uri;
    protected _engine?: DEngineClient;
    constructor({ wsRoot, logUri, assetUri, }: {
        wsRoot: string;
        logUri: vscode.Uri;
        assetUri: vscode.Uri;
    });
    get config(): DendronConfig;
    get vaults(): DVault[];
    get engine(): DEngineClient;
    set engine(engine: DEngineClient);
}
