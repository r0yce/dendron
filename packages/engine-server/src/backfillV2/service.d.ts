import { DEngineClient, NoteProps } from "@dendronhq/common-all";
type BackfillServiceOpts = {
    engine: DEngineClient;
    note?: NoteProps;
    overwriteFields?: string[] | undefined;
};
export declare class BackfillService {
    updateNotes(opts: BackfillServiceOpts): Promise<{}>;
}
export {};
