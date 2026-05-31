import { ExportPodV2, JSONExportReturnType, JSONSchemaType, JSONV2PodConfig, RunnableJSONV2PodConfig } from "@dendronhq/pods-core";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { BaseExportPodCommand } from "./BaseExportPodCommand";
/**
 * VSCode command for running the JSON Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export declare class JSONExportPodCommand extends BaseExportPodCommand<RunnableJSONV2PodConfig, JSONExportReturnType> {
    key: string;
    constructor(extension: IDendronExtension);
    gatherInputs(opts?: Partial<JSONV2PodConfig>): Promise<RunnableJSONV2PodConfig | undefined>;
    onExportComplete({ exportReturnValue, config, }: {
        exportReturnValue: JSONExportReturnType;
        config: RunnableJSONV2PodConfig;
    }): Promise<void>;
    createPod(config: RunnableJSONV2PodConfig): ExportPodV2<JSONExportReturnType>;
    getRunnableSchema(): JSONSchemaType<RunnableJSONV2PodConfig>;
}
