import { QuickPick, QuickPickItem } from "vscode";
export declare class AutoCompleter {
    /**
     * Auto complete note look up will do its best to add completions incrementally,
     * since if the user already found the result they want they can just press Enter.
     *
     * currentValue: currently entered into lookup.
     * activeItemValue: val of the item that is in focus in the list of possible items
     *                 (if nothing is in focus this should be equal to the current value).
     * fnames: the file names to choose completions from sorted by most likely matches first.
     * */
    static autoCompleteNoteLookup(currentValue: string, activeItemValue: string, fnames: string[]): string;
    private static matchPrefixTillNextDot;
    private static matchNoteUpToCurrValue;
    static getAutoCompletedValue(_quickPick: QuickPick<QuickPickItem & {
        fname: string;
    }>): string;
}
