import { ShowcaseEntry } from "@dendronhq/engine-server";
import { DisplayLocation, IFeatureShowcaseMessage } from "./IFeatureShowcaseMessage";
export declare class ObsidianImportTip implements IFeatureShowcaseMessage {
    /**
     * Only shows a toast, this tip does not appear in tip of day.
     * @param displayLocation
     * @returns
     */
    shouldShow(displayLocation: DisplayLocation): boolean;
    get showcaseEntry(): ShowcaseEntry;
    getDisplayMessage(_displayLocation: DisplayLocation): string;
    onConfirm(): void;
    get confirmText(): string;
    get deferText(): string;
}
