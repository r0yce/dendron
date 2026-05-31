import { DVault, NoteProps, WorkspaceOpts } from "@dendronhq/common-all";
import { SetupHookFunction } from "@dendronhq/common-test-utils";
import { ExtensionContext, Location, Position, Selection } from "vscode";
import { SetupWorkspaceOpts } from "../commands/SetupWorkspace";
export type SetupCodeConfigurationV2 = {
    configOverride?: {
        [key: string]: any;
    };
};
export type SetupCodeWorkspaceMultiVaultV2Opts = SetupCodeConfigurationV2 & {
    ctx: ExtensionContext;
    preSetupHook?: SetupHookFunction;
    postSetupHook?: SetupHookFunction;
    setupWsOverride?: Partial<SetupWorkspaceOpts>;
};
export declare function genEmptyWSFiles(): string[];
export declare function genDefaultSettings(): {
    extensions: {
        recommendations: string[];
        unwantedRecommendations: string[];
    };
    folders: {
        path: string;
    }[];
    settings: {
        "dendron.rootDir": string;
        "editor.snippetSuggestions": string;
        "editor.suggest.showSnippets": boolean;
        "editor.suggest.snippetsPreventQuickSuggestions": boolean;
        "editor.tabCompletion": string;
        "files.autoSave": string;
        "markdown-preview-enhanced.enableWikiLinkSyntax": boolean;
        "markdown-preview-enhanced.wikiLinkFileExtension": string;
        "pasteImage.path": string;
        "pasteImage.prefix": string;
    };
};
/**
 * Setup DendronExtension config options
 * @param opts
 */
export declare function setupCodeConfiguration(opts: SetupCodeConfigurationV2): void;
export declare function resetCodeWorkspace(): Promise<void>;
export declare const getNoteFromTextEditor: () => NoteProps;
export declare class LocationTestUtils {
    /**
     * get default wiki link position
     */
    static getPresetWikiLinkPosition: (opts?: {
        line?: number;
        char?: number;
    }) => Position;
    static getPresetWikiLinkSelection: (opts?: {
        line?: number;
        char?: number;
    }) => Selection;
    static getBasenameFromLocation: (loc: Location) => string;
}
export declare const stubWorkspaceFile: (wsRoot: string) => void;
export declare const stubWorkspaceFolders: (wsRoot: string, vaults: DVault[]) => void;
export declare const stubWorkspace: ({ wsRoot, vaults }: WorkspaceOpts) => void;
/**
 *  Releases all registered VS Code Extension resouces such as commands and
 *  providers
 * @param ctx
 */
export declare function cleanupVSCodeContextSubscriptions(ctx: ExtensionContext): void;
export * from "./expect";
