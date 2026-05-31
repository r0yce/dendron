import { InvalidFilenameReason, NoteQuickInput } from "@dendronhq/common-all";
import { CancellationTokenSource } from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ILookupProviderOptsV3, ILookupProviderV3, OnAcceptHook, OnUpdatePickerItemsOpts } from "./LookupProviderV3Interface";
import { DendronQuickPickerV2 } from "./types";
export declare class NoteLookupProvider implements ILookupProviderV3 {
    id: string;
    private _onAcceptHooks;
    opts: ILookupProviderOptsV3;
    private extension;
    constructor(id: string, opts: ILookupProviderOptsV3, extension: IDendronExtension);
    provide(opts: {
        quickpick: DendronQuickPickerV2;
        token: CancellationTokenSource;
        fuzzThreshold: number;
    }): Promise<void>;
    shouldRejectItem(opts: {
        item: NoteQuickInput;
    }): {
        shouldReject: true;
        reason: InvalidFilenameReason;
    } | {
        shouldReject: false;
        reason?: never;
    };
    /**
     * Takes selection and runs accept, followed by hooks.
     * @param opts
     * @returns
     */
    onDidAccept(opts: {
        quickpick: DendronQuickPickerV2;
        cancellationToken: CancellationTokenSource;
    }): () => Promise<void>;
    onUpdatePickerItems(opts: OnUpdatePickerItemsOpts): Promise<void>;
    registerOnAcceptHook(hook: OnAcceptHook): void;
}
