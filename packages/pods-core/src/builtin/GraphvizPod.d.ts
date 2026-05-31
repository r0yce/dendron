import { NoteProps } from "@dendronhq/common-all";
import { ExportPod, ExportPodPlantOpts, ExportPodConfig } from "../basev3";
import { JSONSchemaType } from "ajv";
type ParentDictionary = {
    [childID: string]: string;
};
type GraphvizExportPodCustomOpts = {
    showGraphByHierarchy: boolean;
    showGraphByEdges: boolean;
};
export type GraphvizExportConfig = ExportPodConfig & GraphvizExportPodCustomOpts;
type GraphvizExportPodProcessProps = GraphvizExportPodCustomOpts & {
    note: NoteProps;
    notes: NoteProps[];
    connections: string[];
    parentDictionary: ParentDictionary;
    wsRoot: string;
};
export declare class GraphvizExportPod extends ExportPod<GraphvizExportConfig> {
    static id: string;
    static description: string;
    get config(): JSONSchemaType<GraphvizExportConfig>;
    parseText: (s: string) => string;
    processNote(opts: GraphvizExportPodProcessProps): [string[], ParentDictionary];
    plant(opts: ExportPodPlantOpts): Promise<{
        notes: NoteProps[];
    }>;
}
export {};
