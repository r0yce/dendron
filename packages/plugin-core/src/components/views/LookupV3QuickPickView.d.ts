import { Disposable } from "vscode";
import { ILookupViewModel } from "../lookup/LookupViewModel";
import { DendronQuickPickerV2 } from "../lookup/types";
/**
 * A 'view' that represents the UI state of the Lookup Quick Pick. This
 * essentially controls the button state of the quick pick and reacts upon user
 * mouse clicks to the buttons.
 */
export declare class LookupV3QuickPickView implements Disposable {
    private _quickPick;
    private _viewState;
    private _disposables;
    private _providerId?;
    constructor(quickPick: DendronQuickPickerV2, viewModel: ILookupViewModel, providerId?: string);
    dispose(): void;
    private setupViewModel;
    private getButtonFromArray;
    private getButton;
    private updateButtonsOnQuickPick;
    private onTriggerButton;
}
