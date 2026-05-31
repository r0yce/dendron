import { IFeatureShowcaseMessage } from "./IFeatureShowcaseMessage";
/**
 * Class to showcase certain features of Dendron as a toast message
 */
export declare class FeatureShowcaseToaster {
    /**
     * Show a toast containing information about a Dendron Feature. Doesn't show
     * messages more than once, and it also doesn't show to new user's in their
     * first week of Dendron.
     * @returns whether a toast was shown or not
     */
    showToast(): boolean;
    /**
     * Show a specific toast message. This will not show if the message has
     * already been shown to the user, but unlike {@link showToast}, it will show
     * even if the user is still in their first week of usage.
     * @param message
     * @returns
     */
    showSpecificToast(message: IFeatureShowcaseMessage): boolean;
    /**
     * Check if we've shown this particular message to the user already
     * @param type
     * @returns
     */
    private hasShownMessage;
    private showInformationMessage;
}
