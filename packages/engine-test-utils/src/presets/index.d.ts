import { WorkspaceOpts } from "../engine";
export * from "./engine-server";
export * from "./pods-core";
export * from "./vaults";
export declare enum SETUP_HOOK_KEYS {
    /**
     * alpha: link(beta)
     * beta: link(alpha)
     */
    WITH_LINKS = "WITH_LINKS"
}
export declare function callSetupHook(key: SETUP_HOOK_KEYS, opts: {
    workspaceType: "single" | "multi";
    withVaultPrefix?: boolean;
} & WorkspaceOpts): Promise<void>;
