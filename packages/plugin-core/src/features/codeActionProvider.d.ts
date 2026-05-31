import { CodeActionProvider, ExtensionContext } from "vscode";
declare function activate(context: ExtensionContext): void;
export declare const codeActionProvider: {
    activate: typeof activate;
};
export declare const doctorFrontmatterProvider: CodeActionProvider;
/**
 * Code Action Provider for Refactor.
 * 1. Refactor Code Action for Rename Header
 * 2. Refactor Code Action for Broken Wikilinks
 * 3. Refactor Extract for highlighted text
 * (Similar to the current functionality of creating a new note in 'Selection Extract' mode)
 */
export declare const refactorProvider: CodeActionProvider;
export {};
