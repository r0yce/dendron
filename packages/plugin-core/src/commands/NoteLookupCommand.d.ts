import { LookupNoteType, LookupSelectionType, NoteProps, NoteQuickInput } from "@dendronhq/common-all";
import { Uri } from "vscode";
import { LookupFilterType, LookupSplitType } from "../components/lookup/ButtonTypes";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { ILookupProviderV3 } from "../components/lookup/LookupProviderV3Interface";
import { DendronQuickPickerV2, VaultSelectionMode } from "../components/lookup/types";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { BaseCommand } from "./base";
export type CommandRunOpts = {
    initialValue?: string | undefined;
    noConfirm?: boolean | undefined;
    fuzzThreshold?: number | undefined;
    multiSelect?: boolean | undefined;
    copyNoteLink?: boolean | undefined;
    noteType?: LookupNoteType | undefined;
    selectionType?: LookupSelectionType | undefined;
    splitType?: LookupSplitType | undefined;
    /**
     * NOTE: currently, only one filter is supported
     */
    filterMiddleware?: LookupFilterType[] | undefined;
    vaultSelectionMode?: VaultSelectionMode | undefined;
};
/**
 * Everything that's necessary to initialize the quickpick
 */
type CommandGatherOutput = {
    quickpick: DendronQuickPickerV2;
    controller: ILookupControllerV3;
    provider: ILookupProviderV3;
    noConfirm?: boolean;
    fuzzThreshold?: number;
};
/**
 * Passed into execute command
 */
export type CommandOpts = {
    selectedItems: readonly NoteQuickInput[];
    /** source of the command. Added for contextual UI analytics. */
    source?: string;
} & CommandGatherOutput;
export type CommandOutput = {
    quickpick: DendronQuickPickerV2;
    controller: ILookupControllerV3;
    provider: ILookupProviderV3;
};
type OnDidAcceptReturn = {
    uri: Uri;
    node: NoteProps;
    resp?: any;
};
export { CommandOpts as LookupCommandOptsV3 };
/**
 * Note look up command instance that is used by the UI.
 * */
export declare class NoteLookupCommand extends BaseCommand<CommandOpts, CommandOutput, CommandGatherOutput, CommandRunOpts> {
    key: string;
    protected _controller: ILookupControllerV3 | undefined;
    protected _provider: ILookupProviderV3 | undefined;
    protected _quickPick: DendronQuickPickerV2 | undefined;
    constructor();
    get controller(): ILookupControllerV3;
    set controller(controller: ILookupControllerV3 | undefined);
    get provider(): ILookupProviderV3;
    /**
     * @deprecated
     *
     * This is not a good pattern and causes a lot of problems with state.
     * This will be deprecated so that we never have to swap out the provider
     * of an already existing instance of a lookup command.
     *
     * In the meantime, if you absolutely _have_ to provide a custom provider to an instance of
     * a lookup command, make sure the provider's id is `lookup`.
     */
    set provider(provider: ILookupProviderV3 | undefined);
    gatherInputs(opts?: CommandRunOpts): Promise<CommandGatherOutput>;
    enrichInputs(opts: CommandGatherOutput): Promise<CommandOpts | undefined>;
    getSelected({ quickpick, selectedItems, }: Pick<CommandOpts, "selectedItems" | "quickpick">): readonly NoteQuickInput[];
    /**
     * Executed after user accepts a quickpick item
     */
    execute(opts: CommandOpts): Promise<CommandOpts>;
    cleanUp(): void;
    acceptItem(item: NoteQuickInput): Promise<OnDidAcceptReturn | undefined>;
    acceptExistingItem(item: NoteQuickInput): Promise<OnDidAcceptReturn | undefined>;
    /**
     * Given a selected note item that is a stub note,
     * Prepare it for accepting as a new item.
     * This removes the `stub` frontmatter
     * and applies schema if there is one that matches
     */
    prepareStubItem(opts: {
        item: NoteQuickInput;
        engine: IEngineAPIService;
    }): Promise<NoteProps>;
    acceptNewItem(item: NoteQuickInput): Promise<OnDidAcceptReturn | undefined>;
    acceptNewWithTemplateItem(item: NoteQuickInput): Promise<OnDidAcceptReturn | undefined>;
    /**
     * TODO: align note creation file name choosing for follow a single path when accepting new item.
     *
     * Added to quickly fix the journal names not being created properly.
     */
    private getFNameForNewItem;
    private getVaultForNewNote;
    private getTemplateForNewNote;
    private isJournalButtonPressed;
    addAnalyticsPayload(opts?: CommandOpts, resp?: CommandOpts): {
        source: import("@dendronhq/common-all").ContextualUIEvents;
    } | {
        source?: never;
    };
}
