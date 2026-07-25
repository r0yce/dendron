/**
 * Completion provider activation shell.
 * Implementation: completionHelpers (pure), completionNoteProvider, completionBlockProvider.
 */
import { ExtensionContext, languages } from "vscode";
import { provideBlockCompletionItems } from "./completionBlockProvider";
import { debouncedProvideCompletionItems } from "./completionNoteProvider";

export { padWithZero } from "./completionHelpers";
export {
  debouncedProvideCompletionItems,
  provideCompletionItems,
  resolveCompletionItem,
} from "./completionNoteProvider";
export { provideBlockCompletionItems } from "./completionBlockProvider";

export const activate = (context: ExtensionContext) => {
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        // we debounce this provider since we don't want lookup to be triggered on every keystroke.
        provideCompletionItems: debouncedProvideCompletionItems,
      },

      "[", // for wikilinks and references
      "#", // for hashtags
      "@", // for user tags
      "", // for new levels in the hieirarchy
    ),
  );
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        /**
         * we don't have to debounce this since it is not triggered on every keystroke
         * and is ligher than {@link provideCompletionItems} in general.
         */
        provideCompletionItems: provideBlockCompletionItems,
      },
      "#",
      "^",
    ),
  );
};

export const completionProvider = {
  activate,
};
