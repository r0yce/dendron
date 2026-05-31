import { CommentJSONValue } from "@dendronhq/common-server";
import { CommentJSONArray } from "comment-json";
import { KeybindingConflict } from "./constants";
type Keybindings = Record<string, string>;
export declare class KeybindingUtils {
    static openDefaultKeybindingFileAndGetJSON(opts: {
        close?: boolean;
    }): Promise<CommentJSONArray<Keybindings> | undefined>;
    static openGlobalKeybindingFileAndGetJSON(opts: {
        close?: boolean;
    }): Promise<CommentJSONArray<Keybindings> | undefined>;
    static getInstallStatusForKnownConflictingExtensions(): {
        id: string;
        installed: boolean;
    }[];
    static getConflictingKeybindings(opts: {
        knownConflicts: KeybindingConflict[];
    }): KeybindingConflict[];
    static generateKeybindingBlockForCopy(opts: {
        entry: Keybindings;
        disable?: boolean;
    }): string;
    static showKeybindingConflictPreview(opts: {
        conflicts: KeybindingConflict[];
    }): Promise<void>;
    static showKeybindingConflictConfirmationMessage(opts: {
        conflicts: KeybindingConflict[];
    }): Promise<void>;
    static maybePromptKeybindingConflict(): Promise<void>;
    static checkKeybindingsExist(val: CommentJSONValue): val is CommentJSONArray<Keybindings>;
    /**
     * This returns the path of user-level `keybindings.json`.
     * This handles windows, linux and darwin, for both regular vscode and insider as well as portable mode.
     * This does NOT handle the case where vscode is opened through cli with a custom `--user-data-dir` argument.
     *
     * The most reliable way of accessing the path of `keybindings.json` is to execute `workbench.action.openGlobalKeybindingsFile`
     * and fetching the uri of the active editor document, but this requires opening and closing an editor tab in quick succession.
     * This will visually be very unpleasant, thus avoided here.
     *
     * @returns path of user defined `keybindings.json`, and the platform.
     */
    static getKeybindingConfigPath: () => {
        keybindingConfigPath: string;
        osName: string;
    };
    /**
     * For the given pod ID, returns a user-configured shortcut (in VSCode
     * settings) if it exists. Otherwise, returns undefined.
     * @param podId
     * @returns
     */
    static getKeybindingForPodIfExists(podId: string): string | undefined;
    static getKeybindingsForCopyAsIfExists(format: string): string | undefined;
    static getMultipleKeybindingsMsgFormat(cmd: string): string;
}
export {};
