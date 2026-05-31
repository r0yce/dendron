import { IDendronExtension } from "../../dendronExtensionInterface";
import { PreviewProxy } from "./PreviewProxy";
/**
 * NOTE: This class is meant to only be used in _extension.ts/workspace.ts, or in
 * tests. If you need to show preview in a component, inject a PreviewProxy in
 * the constructor signature and use that object to show/hide preview instead.
 */
export declare class PreviewPanelFactory {
    private static _preview;
    /**
     * Get a usable PreviewProxy for showing the preview
     */
    static create(extension: IDendronExtension): PreviewProxy;
}
