import { ExportPodV2, JSONSchemaType, MarkdownExportReturnType, MarkdownV2PodConfig, RunnableMarkdownV2PodConfig } from "@dendronhq/pods-core";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { BaseExportPodCommand } from "./BaseExportPodCommand";
/**
 * VSCode command for running the Markdown Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export declare class MarkdownExportPodCommand extends BaseExportPodCommand<RunnableMarkdownV2PodConfig, MarkdownExportReturnType> {
    key: string;
    constructor(extension: IDendronExtension);
    gatherInputs(opts?: Partial<MarkdownV2PodConfig>): Promise<RunnableMarkdownV2PodConfig | undefined>;
    onExportComplete({ exportReturnValue, config, }: {
        exportReturnValue: MarkdownExportReturnType;
        config: RunnableMarkdownV2PodConfig;
    }): Promise<void>;
    createPod(config: RunnableMarkdownV2PodConfig): ExportPodV2<MarkdownExportReturnType>;
    getRunnableSchema(): JSONSchemaType<RunnableMarkdownV2PodConfig>;
    /**
     * Prompt user with simple quick pick to select whether to use FM title as h1 header or not
     * @returns
     */
    private promptUserForaddFMTitleSetting;
}
