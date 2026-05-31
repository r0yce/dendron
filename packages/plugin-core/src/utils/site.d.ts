import { NextjsExportConfig, PodItemV4, PublishTarget } from "@dendronhq/pods-core";
import { ExportPodCommand } from "../commands/ExportPod";
export declare const getSiteRootDirPath: () => string;
export declare class NextJSPublishUtils {
    static prepareNextJSExportPod(): Promise<{
        enrichedOpts: {
            podChoice: PodItemV4;
            config: NextjsExportConfig;
        } | undefined;
        wsRoot: string;
        cmd: ExportPodCommand;
        nextPath: string;
    }>;
    static isInitialized(wsRoot: string): Promise<boolean>;
    static removeNextPath(nextPath: string): Promise<void>;
    static install(nextPath: string): Promise<void>;
    static clone(nextPath: string): Promise<void>;
    static initialize(nextPath: string): Promise<void>;
    static build(cmd: ExportPodCommand, podChoice: PodItemV4, podConfig: NextjsExportConfig): Promise<void>;
    static promptSkipBuild(): Promise<boolean>;
    static export(nextPath: string): Promise<void>;
    static dev(nextPath: string): Promise<number | undefined>;
    static handlePublishTarget(target: PublishTarget, nextPath: string, wsRoot: string): Promise<void>;
}
