import { NoteProps } from "@dendronhq/common-all";
import { ExportPodV2, GoogleDocsConnection, GoogleDocsExportReturnType, GoogleDocsV2PodConfig, JSONSchemaType, RunnableGoogleDocsV2PodConfig } from "@dendronhq/pods-core";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { BaseExportPodCommand } from "./BaseExportPodCommand";
/**
 * VSCode command for running the Google Docs Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export declare class GoogleDocsExportPodCommand extends BaseExportPodCommand<RunnableGoogleDocsV2PodConfig, GoogleDocsExportReturnType> {
    key: string;
    constructor(extension: IDendronExtension);
    createPod(config: RunnableGoogleDocsV2PodConfig): ExportPodV2<GoogleDocsExportReturnType>;
    getRunnableSchema(): JSONSchemaType<RunnableGoogleDocsV2PodConfig>;
    gatherInputs(opts?: Partial<GoogleDocsV2PodConfig & GoogleDocsConnection>): Promise<RunnableGoogleDocsV2PodConfig | undefined>;
    candidateForParentFolders(accessToken: string): Promise<{
        [key: string]: string;
    }>;
    /**
     * sends request to drive API to fetch folders
     */
    getAllFoldersInDrive(accessToken: string): Promise<{
        [key: string]: string;
    }>;
    /**
     * prompts to select the folder docs are exported to
     * @param folderIdsHashMap
     */
    promtForParentFolderId(folderIdsHashMap: string[]): Promise<string | undefined>;
    onExportComplete(opts: {
        exportReturnValue: GoogleDocsExportReturnType;
        payload: NoteProps[];
        config: RunnableGoogleDocsV2PodConfig;
    }): Promise<string>;
}
