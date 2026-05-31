/**
 * Namespace for all global configurations.
 */
export type DendronGlobalConfig = {
    enableFMTitle: boolean;
    enableNoteTitleForLink: boolean;
    enablePrettyRefs: boolean;
    enableKatex: boolean;
    enableChildLinks: boolean;
    enableBackLinks: boolean;
};
/**
 * Generates default for {@link DendronGlobalConfig}
 * @returns DendronGlobalConfig
 */
export declare function genDefaultGlobalConfig(): DendronGlobalConfig;
