import { Theme } from "../publishing";
/**
 * Namespace for all preview related configurations
 */
export type DendronPreviewConfig = {
    enableFMTitle: boolean;
    enableNoteTitleForLink: boolean;
    enableFrontmatterTags: boolean;
    enableHashesForFMTags: boolean;
    enablePrettyRefs: boolean;
    enableKatex: boolean;
    automaticallyShowPreview: boolean;
    theme?: Theme;
};
/**
 * Generate defaults for {@link DendronPreviewConfig}
 * @returns DendronPreviewConfig
 */
export declare function genDefaultPreviewConfig(): DendronPreviewConfig;
