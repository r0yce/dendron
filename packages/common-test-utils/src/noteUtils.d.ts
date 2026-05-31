import { DVault, NoteProps, SchemaModuleProps, DNodePropsQuickInputV2, DEngineClient, EngineWriteOptsV2, SchemaTemplate } from "@dendronhq/common-all";
export type CreateNoteOptsV4 = {
    vault: DVault;
    wsRoot: string;
    fname: string;
    body?: string;
    props?: Partial<Omit<NoteProps, "vault" | "fname" | "body" | "custom">>;
    genRandomId?: boolean;
    noWrite?: boolean;
    custom?: any;
    stub?: boolean;
};
export type CreateNoteInputOpts = {
    label?: string;
} & CreateNoteOptsV4;
export type CreateSchemaOptsV4 = {
    vault: DVault;
    wsRoot: string;
    fname: string;
    noWrite?: boolean;
    modifier?: (schema: SchemaModuleProps) => SchemaModuleProps;
};
/**
 * Class for simplifying creation of multiple notes for tests by being
 * able to specify defaults upon construction.
 *
 * Example usage:
 * <pre>
 *    const noteFactory = TestNoteFactory.defaultUnitTestFactory();
 *
 *    const note = await noteFactory.createForFName("your-fname");
 * </pre>
 *
 * */
export declare class TestNoteFactory {
    static readonly DEFAULT_VAULT: {
        fsPath: string;
    };
    static readonly DEFAULT_WS_ROOT = "/tmp/ws";
    private readonly _defaults;
    static defaultUnitTestFactory(): TestNoteFactory;
    constructor(defaults: Omit<CreateNoteOptsV4, "fname">);
    createForFName(fname: string): Promise<NoteProps>;
    createForFNameWithEngine(fname: string, props: Partial<NoteProps> & {
        engine: DEngineClient;
    }): Promise<NoteProps>;
    createNoteInputWithFNames(fnames: string[]): Promise<DNodePropsQuickInputV2[]>;
    createNoteInputWithFName(fname: string): Promise<DNodePropsQuickInputV2>;
    createForFNames(fnames: string[]): Promise<NoteProps[]>;
}
export declare class NoteTestUtilsV4 {
    static createSchema: (opts: CreateSchemaOptsV4) => Promise<SchemaModuleProps>;
    /**
     * By default, create note with following properties:
     *  - created & updated = 1
     *  - id = note.fname
     *  - body = ""
     * @param opts
     * @returns
     */
    static createNote: (opts: CreateNoteOptsV4) => Promise<NoteProps>;
    /** This is like `createNote`, except it will make sure the engine is updated with the note.
     *
     * Prefer this over `createNote` if you are creating a note when the engine is
     * already active. For example, when you are using `describeMultiWs` or
     * `describeSingleWs` where the engine is already active inside the block.
     *
     * Avoid using this to update an existing note, this may cause issues.
     */
    static createNoteWithEngine(opts: Omit<CreateNoteOptsV4, "noWrite"> & {
        engine: DEngineClient;
    } & {
        engineWriteNoteOverride?: EngineWriteOptsV2;
    }): Promise<NoteProps>;
    static createNotePropsInput(opts: CreateNoteInputOpts): Promise<DNodePropsQuickInputV2>;
    static modifyNoteByPath(opts: {
        wsRoot: string;
        vault: DVault;
        fname: string;
    }, cb: (note: NoteProps) => NoteProps): Promise<string>;
    static modifySchemaByPath(opts: {
        wsRoot: string;
        vault: DVault;
        fname: string;
    }, cb: (schema: SchemaModuleProps) => SchemaModuleProps): Promise<void>;
    /**
     * Setup schema that references template that may or may not lie in same vault
     */
    static setupSchemaCrossVault: (opts: {
        wsRoot: string;
        vault: DVault;
        template: SchemaTemplate;
    }) => Promise<SchemaModuleProps>;
}
