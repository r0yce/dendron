import { NoteProps } from "@dendronhq/common-all";
import { ExportPodV2, JSONSchemaType, NotionConnection, NotionExportReturnType, NotionV2PodConfig, Page, RunnableNotionV2PodConfig } from "@dendronhq/pods-core";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { BaseExportPodCommand } from "./BaseExportPodCommand";
/**
 * VSCode command for running the Notion Export Pod. It is not meant to be
 * directly invoked throught the command palette, but is invoked by
 * {@link ExportPodV2Command}
 */
export declare class NotionExportPodCommand extends BaseExportPodCommand<RunnableNotionV2PodConfig, NotionExportReturnType> {
    key: string;
    constructor(extension: IDendronExtension);
    createPod(config: RunnableNotionV2PodConfig): ExportPodV2<NotionExportReturnType>;
    getRunnableSchema(): JSONSchemaType<RunnableNotionV2PodConfig>;
    gatherInputs(opts?: Partial<NotionV2PodConfig & NotionConnection>): Promise<RunnableNotionV2PodConfig | undefined>;
    onExportComplete({ exportReturnValue, }: {
        exportReturnValue: NotionExportReturnType;
        config: RunnableNotionV2PodConfig;
        payload: NoteProps[];
    }): Promise<void>;
    getAllNotionPages: (apiKey: string) => Promise<{
        [key: string]: string;
    }>;
    /**
     * Method to get page name of a Notion Page
     */
    getPageName: (page: Page) => string;
    /**
     * Prompt to choose the Parent Page in Notion. All the exported notes are created inside this page.
     * It is mandatory to have a parent page while create pages via API.
     * @param pagesMap
     * @returns pageId of selected page.
     */
    promptForParentPage: (pagesMap: string[]) => Promise<string | undefined>;
}
