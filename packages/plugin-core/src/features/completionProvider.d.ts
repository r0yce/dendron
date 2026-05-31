import _ from "lodash";
import { CancellationToken, CompletionItem, CompletionList, ExtensionContext, Position, TextDocument } from "vscode";
export declare const provideCompletionItems: (document: TextDocument, position: Position) => Promise<CompletionList<CompletionItem> | undefined>;
/**
 * Debounced version of {@link provideCompletionItems}.
 *
 * We trigger on both leading and trailing edge of the debounce window because:
 * 1. without the leading edge we lose focus to the Intellisense
 * 2. without the trailing edge we may miss some keystrokes from the users at the end.
 *
 * related discussion: https://github.com/dendronhq/dendron/pull/3116#discussion_r902075154
 */
export declare const debouncedProvideCompletionItems: _.DebouncedFunc<(document: TextDocument, position: Position) => Promise<CompletionList<CompletionItem> | undefined>>;
export declare const resolveCompletionItem: (item: CompletionItem, token: CancellationToken) => Promise<CompletionItem | undefined>;
export declare function provideBlockCompletionItems(document: TextDocument, position: Position, token?: CancellationToken): Promise<CompletionItem[] | undefined>;
export declare const activate: (context: ExtensionContext) => void;
export declare const completionProvider: {
    activate: (context: ExtensionContext) => void;
};
