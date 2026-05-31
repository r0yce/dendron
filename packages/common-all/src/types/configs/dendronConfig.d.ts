import { DendronCommandConfig } from "./commands/commands";
import { DendronWorkspaceConfig } from "./workspace/DendronWorkspaceConfig";
import { DendronPreviewConfig } from "./preview/preview";
import { DendronPublishingConfig } from "./publishing/publishing";
import { DendronGlobalConfig } from "./global/global";
import { DendronDevConfig } from "./dev/DendronDevConfig";
/**
 * DendronConfig
 * This is the top level config that will hold everything.
 */
export type DendronConfig = {
    version: number;
    global?: DendronGlobalConfig;
    commands: DendronCommandConfig;
    workspace: DendronWorkspaceConfig;
    preview: DendronPreviewConfig;
    publishing: DendronPublishingConfig;
    dev?: DendronDevConfig | undefined;
};
export type TopLevelDendronConfig = keyof DendronConfig;
/**
 * Generates a default DendronConfig using
 * respective default config generators of each sub config groups.
 * @returns DendronConfig
 */
export declare function genDefaultDendronConfig(): DendronConfig;
