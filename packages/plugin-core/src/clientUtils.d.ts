import { DEngineClient, LookupNoteTypeEnum, NoteAddBehavior, SchemaModuleProps } from "@dendronhq/common-all";
type CreateFnameOverrides = {
    domain?: string;
};
type CreateFnameOpts = {
    overrides?: CreateFnameOverrides;
};
export declare class DendronClientUtilsV2 {
    static genNotePrefix(fname: string, addBehavior: NoteAddBehavior): string;
    /**
     * Generates a file name for a meeting note. The date format is not
     * configurable, because it needs to match a pre-defined generated schema
     * pattern for meeting notes.
     * @returns
     */
    static getMeetingNoteName(): string;
    /**
     * Generates a file name for a journal or scratch note. Must be derived by an
     * open note, or passed as an option.
     * @param type 'JOURNAL' | 'SCRATCH'
     * @param opts Options to control how the note will be named
     * @returns The file name of the new note
     */
    static genNoteName(type: LookupNoteTypeEnum.journal | LookupNoteTypeEnum.scratch | LookupNoteTypeEnum.task, opts?: CreateFnameOpts): {
        noteName: string;
        prefix: string;
    };
    static getSchemaModByFname: ({ fname, client, }: {
        fname: string;
        client: DEngineClient;
    }) => Promise<SchemaModuleProps>;
    static shouldUseVaultPrefix(engine: DEngineClient): boolean;
}
export {};
