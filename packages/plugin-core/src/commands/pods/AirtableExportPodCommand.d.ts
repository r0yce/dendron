import { AirtableConnection, AirtableExportReturnType, AirtableV2PodConfig, ExportPodV2, JSONSchemaType, RunnableAirtableV2PodConfig } from "@dendronhq/pods-core";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { BaseExportPodCommand } from "./BaseExportPodCommand";
/**
 * VSCode command for running the Airtable Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export declare class AirtableExportPodCommand extends BaseExportPodCommand<RunnableAirtableV2PodConfig, AirtableExportReturnType> {
    key: string;
    constructor(extension: IDendronExtension);
    createPod(config: RunnableAirtableV2PodConfig): ExportPodV2<AirtableExportReturnType>;
    getRunnableSchema(): JSONSchemaType<RunnableAirtableV2PodConfig>;
    gatherInputs(opts?: Partial<AirtableV2PodConfig & AirtableConnection>): Promise<RunnableAirtableV2PodConfig | undefined>;
    /**
     * Upon finishing the export, add the airtable record ID back to the
     * corresponding note in Dendron, so that on future writes, we know how to
     * distinguish between whether a note export should create a new row in
     * Airtable or update an existing one.
     * @param exportReturnValue
     * @returns
     */
    onExportComplete({ exportReturnValue, config, }: {
        exportReturnValue: AirtableExportReturnType;
        config: RunnableAirtableV2PodConfig;
    }): Promise<string>;
    /**
     * Get the Airtable base name to export to
     * v1 - just an input box
     * v2 - get available tables via an airtable api
     */
    private getAirtableBaseFromUser;
    /**
     * Get the Airtable table name to export to
     * v1 - just an input box
     * v2 - get available tables via an airtable api
     */
    private getTableFromUser;
}
