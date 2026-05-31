import { ShowcaseEntry } from "@dendronhq/engine-server";
import { DisplayLocation, IFeatureShowcaseMessage } from "./IFeatureShowcaseMessage";
export declare class BacklinksPanelHoverTip implements IFeatureShowcaseMessage {
    shouldShow(_displayLocation: DisplayLocation): boolean;
    get showcaseEntry(): ShowcaseEntry;
    getDisplayMessage(displayLocation: DisplayLocation): string;
    onConfirm(): void;
    get confirmText(): string;
    get deferText(): string;
}
