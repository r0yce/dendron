import { NoteProps } from "@dendronhq/common-all";
import { AirtableConnection, AirtableV2PodConfig, ExportPodV2, JSONSchemaType, RunnablePodConfigV2 } from "@dendronhq/pods-core";
import { HierarchySelector } from "../../../../../src/components/lookup/HierarchySelector";
import { BaseExportPodCommand } from "../../../../../src/commands/pods/BaseExportPodCommand";
import { IDendronExtension } from "../../../../dendronExtensionInterface";
/**
 * Test implementation of BaseExportPodCommand. For testing purposes only.
 */
export declare class TestExportPodCommand extends BaseExportPodCommand<RunnablePodConfigV2, string> {
    key: string;
    /**
     * Hardcoded to return the 'foo' Hierarchy and vault[0] from ENGINE_HOOKS.setupBasic
     */
    static mockedSelector: HierarchySelector;
    constructor(extension: IDendronExtension);
    /**
     * Note hard coded return values - these can be amended as new tests are written.
     * @param _config
     * @returns
     */
    createPod(_config: RunnablePodConfigV2): ExportPodV2<string>;
    getRunnableSchema(): JSONSchemaType<RunnablePodConfigV2>;
    gatherInputs(_opts?: Partial<AirtableV2PodConfig & AirtableConnection>): Promise<RunnablePodConfigV2 | undefined>;
    /**
     * No - op for now. TODO: Add validation on export
     * @param exportReturnValue
     * @returns
     */
    onExportComplete(_opts: {
        exportReturnValue: string;
        config: RunnablePodConfigV2;
        payload: NoteProps | NoteProps[];
    }): Promise<void>;
}
