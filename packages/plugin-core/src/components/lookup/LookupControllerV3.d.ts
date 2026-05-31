import { DNodeType } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { DendronBtn } from "./ButtonTypes";
import type { CreateQuickPickOpts, ILookupControllerV3, LookupControllerV3CreateOpts, PrepareQuickPickOpts, ShowQuickPickOpts } from "./LookupControllerV3Interface";
import { ILookupProviderV3 } from "./LookupProviderV3Interface";
import { ILookupViewModel } from "./LookupViewModel";
import { DendronQuickPickerV2 } from "./types";
export { LookupControllerV3CreateOpts };
/**
 * For initialization lifecycle,
 * see [[dendron://dendron.docs/pkg.plugin-core.t.lookup.arch]]
 */
export declare class LookupControllerV3 implements ILookupControllerV3 {
    nodeType: DNodeType;
    private _cancelTokenSource?;
    private _quickPick?;
    fuzzThreshold: number;
    private _provider?;
    private _title?;
    private _viewModel;
    private _initButtons;
    private _disposables;
    constructor(opts: {
        nodeType: DNodeType;
        buttons: DendronBtn[];
        fuzzThreshold?: number;
        enableLookupView?: boolean;
        title?: string;
        viewModel: ILookupViewModel;
    });
    isJournalButtonPressed(): boolean;
    show(opts: CreateQuickPickOpts & {
        /**
         * Don't show quickpick
         */
        nonInteractive?: boolean;
        /**
         * Initial value for quickpick
         */
        initialValue?: string;
        provider: ILookupProviderV3;
    }): Promise<DendronQuickPickerV2>;
    get quickPick(): DendronQuickPickerV2;
    get cancelToken(): vscode.CancellationTokenSource;
    get provider(): ILookupProviderV3;
    createCancelSource(): vscode.CancellationTokenSource;
    /**
     * Wire up quickpick and initialize buttons
     */
    prepareQuickPick(opts: PrepareQuickPickOpts): Promise<{
        quickpick: DendronQuickPickerV2;
    }>;
    showQuickPick(opts: ShowQuickPickOpts): Promise<DendronQuickPickerV2>;
    onHide(): void;
    private getButtonFromArray;
    private getButton;
    private setupViewModelCallbacks;
    /**
     *  Adjust View State based on what the initial button state is
     * @param buttons
     */
    private initializeViewStateFromButtons;
    private setNextPicker;
    private onJournalButtonToggled;
    private onScratchButtonToggled;
    private onTaskButtonToggled;
    private onSelect2ItemsBtnToggled;
    private onCopyNoteLinkBtnToggled;
    private onSelectionExtractBtnToggled;
    private onSelection2LinkBtnToggled;
    /**
     * Helper for {@link LookupControllerV3.selectionToNoteProps}
     * given a selection, find backlinks that point to
     * any anchors in the selection and update them to point to the
     * given destination note instead
     */
    private updateBacklinksToAnchorsInSelection;
    private selectionToNoteProps;
    __DO_NOT_USE_IN_PROD_exposePropsForTesting(): {
        onSelect2ItemsBtnToggled: (enabled: boolean) => Promise<void>;
    };
}
