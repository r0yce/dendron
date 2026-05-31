import { Theme } from "@dendronhq/common-all";
/**
 * Configuration for the preview panel
 */
export interface IPreviewPanelConfig {
    /**
     * Configures the theme used for preview
     */
    theme: Theme;
}
export declare class DummyPreviewPanelConfig implements IPreviewPanelConfig {
    get theme(): Theme;
}
