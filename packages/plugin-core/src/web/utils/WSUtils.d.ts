import { DVault, NoteProps, type ReducedDEngine } from "@dendronhq/common-all";
import vscode from "vscode";
import { URI } from "vscode-uri";
export declare class WSUtilsWeb {
    private engine;
    private wsRoot;
    private vaults;
    constructor(engine: ReducedDEngine, wsRoot: URI, vaults: DVault[]);
    getVaultFromDocument(document: vscode.TextDocument): DVault;
    getNoteFromDocument(document: vscode.TextDocument): Promise<import("@dendronhq/common-all").FindNotesResp> | undefined;
    getActiveNote(): Promise<NoteProps | undefined>;
    /**
     * Returns a URI for a given fname/vault combination. Note - this will return
     * a URI, even if a valid note doesn't exist at the specified location/vault.
     * @param fname
     * @param vault
     */
    getURIForNote(fname: string, vault: DVault): Promise<URI>;
}
