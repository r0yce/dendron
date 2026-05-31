import { DVault } from "@dendronhq/common-all";
import { ExportPod, ExportPodPlantOpts, ExportPodConfig, ImportPod, ImportPodConfig, ImportPodPlantOpts } from "../basev3";
import { JSONSchemaType } from "ajv";
export type SnapshotExportPodResp = {
    snapshotDirPath: string;
};
export type SnapshotExportPodPlantOpts = ExportPodPlantOpts;
export declare class SnapshotExportPod extends ExportPod {
    static id: string;
    static description: string;
    get config(): JSONSchemaType<ExportPodConfig>;
    backupVault({ vault, snapshotDirPath, ignore, }: {
        vault: DVault;
        snapshotDirPath: string;
        ignore: string[];
    }): Promise<void>;
    plant(opts: SnapshotExportPodPlantOpts): Promise<{
        notes: never[];
        data: string;
    }>;
}
export type SnapshotImportPodResp = {
    snapshotDirPath: string;
};
export declare class SnapshotImportPod extends ImportPod {
    static id: string;
    static description: string;
    get config(): JSONSchemaType<ImportPodConfig>;
    restoreVault({ wsRoot, vaults, snapshotDirPath, }: {
        vaults: DVault[];
        snapshotDirPath: string;
        wsRoot: string;
    }): Promise<void>;
    plant(opts: ImportPodPlantOpts): Promise<{
        importedNotes: never[];
    }>;
}
