import { DVault } from "@dendronhq/common-all";
/**
 * Wrapper around common-all VaultUtils which provides defaults
 * using the the current workspace accessible from the plugin. */
export declare class PluginVaultUtils {
    static getVaultByNotePath({ vaults, wsRoot, fsPath, }: {
        /** Absolute or relative path to note  */
        fsPath: string;
        wsRoot?: string;
        vaults?: DVault[];
    }): DVault;
}
