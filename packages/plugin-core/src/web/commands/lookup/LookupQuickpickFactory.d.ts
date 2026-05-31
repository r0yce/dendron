import { DVault, NoteQuickInputV2, type ReducedDEngine } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { Event, QuickPick, QuickPickOptions } from "vscode";
import { WSUtilsWeb } from "../../utils/WSUtils";
import { type ILookupProvider } from "./ILookupProvider";
export type LookupQuickpickFactoryCreateOpts = QuickPickOptions & {
    provider: ILookupProvider;
    buttons?: vscode.QuickInputButton[];
    initialValue?: string;
};
export type LookupAcceptPayload = {
    items: readonly NoteQuickInputV2[];
    createNew?: boolean;
};
export declare class LookupQuickpickFactory {
    private _engine;
    private vaults;
    private tabAutoCompleteEvent;
    private wsUtils;
    constructor(_engine: ReducedDEngine, vaults: DVault[], tabAutoCompleteEvent: Event<void>, wsUtils: WSUtilsWeb);
    showLookup(opts: LookupQuickpickFactoryCreateOpts): Promise<LookupAcceptPayload | undefined>;
    create(opts: LookupQuickpickFactoryCreateOpts): QuickPick<NoteQuickInputV2>;
    private getInitialValueBasedOnActiveNote;
    private addCreateNewOptionIfNecessary;
    private createNewNoteQPItem;
    /** This function presumes that 'CreateNew' should be shown and determines whether
     *  CreateNew should be at the top of the look up results or not. */
    private shouldBubbleUpCreateNew;
}
