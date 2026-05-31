import { VaultSelectionMode } from "./types";
/**
 * Class responsible for proxying interaction with vault
 * selection mode configuration.
 * */
export declare class VaultSelectionModeConfigUtils {
    static getVaultSelectionMode(): VaultSelectionMode.smart | VaultSelectionMode.alwaysPrompt;
    static configVaultSelectionMode(): "smart" | "alwaysPrompt";
    static shouldAlwaysPromptVaultSelection(): boolean;
    private static toVaultSelectionMode;
}
