import { DendronConfig, DVault } from "@dendronhq/common-all";
export declare class WorkspaceTestUtils {
    /**
     * Hardcoded version of the default config.
     */
    static generateDefaultConfig({ vaults, duplicateNoteBehavior, }: {
        vaults: DVault[];
        duplicateNoteBehavior?: DendronConfig["publishing"]["duplicateNoteBehavior"];
    }): DendronConfig;
}
