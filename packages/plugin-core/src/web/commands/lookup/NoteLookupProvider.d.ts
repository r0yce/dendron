import { NoteQuickInputV2, type ReducedDEngine } from "@dendronhq/common-all";
import { ILookupProvider, provideItemsProps } from "./ILookupProvider";
/**
 * Provides Note Lookup results by querying the engine.
 */
export declare class NoteLookupProvider implements ILookupProvider {
    private engine;
    constructor(engine: ReducedDEngine);
    provideItems(opts: provideItemsProps): Promise<NoteQuickInputV2[]>;
    private fetchRootQuickPickResults;
    private fetchPickerResults;
}
