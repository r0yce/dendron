import { ShowcaseEntry } from "@dendronhq/engine-server";
import { IFeatureShowcaseMessage } from "./IFeatureShowcaseMessage";
/**
 * Creates a tip of the day that contains a simple message with no buttons
 * @param showcaseEntry
 * @param displayMessage
 * @returns
 */
export declare function createSimpleTipOfDayMsg(showcaseEntry: ShowcaseEntry, displayMessage: string): IFeatureShowcaseMessage;
/**
 * Creates a tip of the day that also contains a button linking to a url containing a doc
 * url (to wiki.dendron.so for example)
 * @param input
 * @returns
 */
export declare function createTipOfDayMsgWithDocsLink(input: Pick<IFeatureShowcaseMessage, "confirmText"> & {
    showcaseEntry: ShowcaseEntry;
    displayMessage: string;
    docsUrl: string;
}): IFeatureShowcaseMessage;
