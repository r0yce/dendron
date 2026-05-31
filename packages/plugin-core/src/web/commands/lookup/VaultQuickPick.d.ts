import { DVault, type ReducedDEngine } from "@dendronhq/common-all";
import { VaultSelectionMode } from "../../../components/lookup/types";
export declare class VaultQuickPick {
    private CONTEXT_DETAIL;
    private HIERARCHY_MATCH_DETAIL;
    private FULL_MATCH_DETAIL;
    private _engine;
    constructor(engine: ReducedDEngine);
    getOrPromptVaultForNewNote({ vault, fname, vaults, vaultSelectionMode, }: {
        vault: DVault;
        fname: string;
        vaults: DVault[];
        vaultSelectionMode?: VaultSelectionMode;
    }): Promise<DVault | undefined>;
    /**
     * Determine which vault(s) are the most appropriate to create this note in.
     * Vaults determined as better matches appear earlier in the returned array
     * @param
     * @returns
     */
    private getVaultRecommendations;
    private promptVault;
}
