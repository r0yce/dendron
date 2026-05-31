import { ExportPodConfigurationV2, PodExportScope, PodV2Types } from "@dendronhq/pods-core";
import { CodeCommandInstance } from "../../commands/base";
export declare class PodCommandFactory {
    /**
     * Creates a runnable vs code command that will execute the appropriate pod
     * based on the passed in pod configuration
     * @param configId
     * @returns A pod command configured with the found configuration
     */
    static createPodCommandForStoredConfig({ configId, exportScope, config, }: {
        configId?: Pick<ExportPodConfigurationV2, "podId">;
        exportScope?: PodExportScope;
        config?: ExportPodConfigurationV2 & {
            destination?: string;
        };
    }): CodeCommandInstance;
    /**
     * Creates a vanilla pod command for the specified Pod(V2) type. This is meant
     * to be used when there is no pre-existing pod config for the command - no
     * arguments will be passed to the pod command for run().
     * @param podType
     * @returns
     */
    static createPodCommandForPodType(podType: PodV2Types): CodeCommandInstance;
}
