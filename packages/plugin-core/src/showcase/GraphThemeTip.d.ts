import { ShowcaseEntry } from "@dendronhq/engine-server";
import { DisplayLocation, IFeatureShowcaseMessage } from "./IFeatureShowcaseMessage";
export declare class GraphThemeTip implements IFeatureShowcaseMessage {
    shouldShow(displayLocation: DisplayLocation): boolean;
    get showcaseEntry(): ShowcaseEntry;
    getDisplayMessage(_displayLocation: DisplayLocation): string;
    onConfirm(): void;
    get confirmText(): string;
    get deferText(): string;
}
