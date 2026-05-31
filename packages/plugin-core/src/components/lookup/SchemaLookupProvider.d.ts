import { CancellationTokenSource } from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { ILookupProviderOptsV3, ILookupProviderV3, OnAcceptHook, OnUpdatePickerItemsOpts, ProvideOpts } from "./LookupProviderV3Interface";
import { DendronQuickPickerV2 } from "./types";
export declare class SchemaLookupProvider implements ILookupProviderV3 {
    id: string;
    private _extension;
    private _onAcceptHooks;
    opts: ILookupProviderOptsV3;
    constructor(id: string, opts: ILookupProviderOptsV3, extension: IDendronExtension);
    provide(opts: ProvideOpts): Promise<void>;
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
