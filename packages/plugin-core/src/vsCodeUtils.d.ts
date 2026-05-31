import { InstallStatus, Point, Position, VSRange } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { CancellationTokenSource } from "vscode";
import { DendronContext } from "./constants";
import { FileItem } from "./external/fileutils/FileItem";
type PointOffset = {
    line?: number;
    column?: number;
};
/** The severity of a message shown by {@link VSCodeUtils.showMessage}.
 *
 * The function will call `vscode.window.show(Information|Warning|Error)Message` with the parameters given to it.
 *
 * The severities map to numbers for easy comparison, `INFO < WARN && WARN < ERROR`.
 */
export declare enum MessageSeverity {
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
/**
 * IMPORTANT: Do not import from  workspace.ts from this file. Any utils that
 * depend on workspace must go into WSUtils, otherwise this will create circular
 * dependencies.
 */
export declare class VSCodeUtils {
    /**
     * In development, this is `packages/plugin-core/assets`
     * In production, this is `$HOME/$VSCODE_DIR/{path-to-app}/dist/
     * @param context
     * @returns
     */
    static getAssetUri(context: vscode.ExtensionContext): vscode.Uri;
    static closeCurrentFileEditor(): Thenable<unknown>;
    static closeAllEditors(): Promise<[unknown, unknown]>;
    static createCancelSource(existingSource?: CancellationTokenSource): vscode.CancellationTokenSource;
    static createQuickPick: typeof vscode.window.createQuickPick;
    static extractRangeFromActiveEditor: (documentParam?: vscode.TextDocument, rangeParam?: vscode.Range) => Promise<{
        document: vscode.TextDocument;
        range: vscode.Range;
    } | undefined>;
    static deleteRange: (document: vscode.TextDocument, range: vscode.Range) => Promise<void>;
    /** Wraps the selected range with comment symbols using builtin VSCode command. */
    static makeBlockComment(editor: vscode.TextEditor, range?: vscode.Range): Promise<void>;
    static getActiveTextEditor(): vscode.TextEditor | undefined;
    static getActiveTextEditorOrThrow(): vscode.TextEditor;
    static getFsPathFromTextEditor(editor: vscode.TextEditor): string;
    /**
     * Check if we upgraded, initialized for the first time or no change was detected
     * @returns {@link InstallStatus}
     */
    static getInstallStatusForWorkspace({ previousWorkspaceVersion, currentVersion, }: {
        previousWorkspaceVersion?: string;
        currentVersion: string;
    }): InstallStatus;
    /**
     * Get {@link InstallStatus}
     * ^pubko8e3tu7i
     */
    static getInstallStatusForExtension({ previousGlobalVersion, currentVersion, }: {
        previousGlobalVersion?: string;
        currentVersion: string;
    }): InstallStatus;
    static getSelection(): {
        text: undefined;
        selection: undefined;
        editor: undefined;
    } | {
        text: string;
        selection: vscode.Selection;
        editor: vscode.TextEditor;
    };
    static getOrCreateMockContext(): vscode.ExtensionContext;
    static createMockState(settings: any): vscode.WorkspaceConfiguration;
    static createWSFolder(root: string): vscode.WorkspaceFolder;
    /**
     * URI.joinPath currentl'y doesn't work in theia
     * @param uri
     * @param path
     */
    static joinPath(uri: vscode.Uri, ...fpath: string[]): vscode.Uri;
    static openFileInEditor(fileItemOrURI: FileItem | vscode.Uri, opts?: Partial<{
        column: vscode.ViewColumn;
    }>): Promise<vscode.TextEditor | undefined>;
    static openLink(link: string): void;
    closeAllEditors(): Thenable<unknown>;
    static openWS(wsFile: string): Promise<unknown>;
    static reloadWindow(): Promise<void>;
    /**
     * Opens file picker which allows user to select a file or folder
     *
     * @param options Options to configure the behaviour of a file open dialog
     * @returns Filesystem path
     */
    static openFilePicker(options?: vscode.OpenDialogOptions): Promise<string | undefined>;
    /** Prompt the user for an absolute path to a folder. Supports `~`.
     *
     * @param opts.default The default path to suggest.
     * @param opts.relativeTo If given, this should be an absolute folder prefix. Anything the user types will be prefixed with this.
     * @param opts.override Use to override the prompts suggestions.
     * @returns
     */
    static gatherFolderPath(opts?: {
        default: string;
        relativeTo?: string;
        override?: Partial<vscode.InputBoxOptions>;
    }): Promise<string | undefined>;
    static isDevMode(): boolean;
    static setContext(key: DendronContext, status: boolean): void;
    static setContextStringValue(key: DendronContext, value: string): void;
    static showInputBox: typeof vscode.window.showInputBox;
    static showQuickPick: typeof vscode.window.showQuickPick;
    static showWebView: (opts: {
        title: string;
        content: string;
        rawHTML?: boolean;
    }) => void;
    static showMessage(severity: MessageSeverity, ...opts: Parameters<typeof vscode.window["showInformationMessage"]>): Thenable<vscode.MessageItem | undefined>;
    /** Convert a `Point` from a parsed remark node to a `vscode.Poisition`
     *
     * @param point The point to convert.
     * @param offset When converting the point, shift it by this much.
     * @returns The converted Position, shifted by `offset` if provided.
     */
    static point2VSCodePosition(point: Point, offset?: PointOffset): vscode.Position;
    /** Convert a `Position` from a parsed remark node to a `vscode.Range`
     *
     * @param position The position to convert.
     * @returns The converted Range.
     */
    static position2VSCodeRange(position: Position, offset?: PointOffset): vscode.Range;
    /** Given a `range`, extend the start and end lines of the range by `padding` many lines.
     *
     * @param opts.range The range to extend.
     * @param opts.padding The number of lines to extend the range.
     * @param zeroCharacter If true, the starting and ending characters of the range will be set to 0.
     * @returns
     */
    static padRange(opts: {
        range: vscode.Range;
        padding: number;
        zeroCharacter?: boolean;
    }): vscode.Range;
    /** Given a list of ranges, return a set of ranges where any overlapping ranges have been merged together. No two returned range will overlap. */
    static mergeOverlappingRanges(ranges: vscode.Range[]): vscode.Range[];
    /** Converts any range similar to a VSCode range into an actual VSCode range, which is needed for VSCode APIs. */
    static toRangeObject(range: VSRange): vscode.Range;
    /** Opposite of `toRangeObject`, which is required to call Dendron APIs. */
    static toPlainRange(range: vscode.Range): VSRange;
    /** Fold the foldable region at the given line for the active editor.
     *
     * This is equivalent to selecting that point, and using the "Fold" command in the editor.
     */
    static foldActiveEditorAtPosition(opts: {
        line?: number;
        levels?: number;
    }): Thenable<unknown>;
    /** Use the built-in markdown preview to display preview for a file. */
    static showDefaultPreview(uri?: vscode.Uri): Thenable<unknown>;
    static getCodeUserConfigDir(): {
        userConfigDir: string;
        delimiter: string;
        osName: string;
    };
    static getWorkspaceConfig: typeof vscode.workspace.getConfiguration;
    static setWorkspaceConfig(section: string, value: any, configurationTarget?: vscode.ConfigurationTarget | boolean | null): void;
    static isExtensionInstalled(extensionId: string): boolean;
    static isTextDocument(obj: any): obj is vscode.TextDocument;
}
export {};
