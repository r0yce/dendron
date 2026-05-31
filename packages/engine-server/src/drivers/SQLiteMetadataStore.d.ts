import { DVault, IDataStore, NoteProps, NotePropsByIdDict, NotePropsMeta } from "@dendronhq/common-all";
type PrismaClient = any;
export type NoteIndexLightProps = {
    fname: string;
    id: string;
    foo: string;
};
export declare class SQLiteMetadataStore implements IDataStore<string, NotePropsMeta> {
    status: "loading" | "ready";
    constructor({ wsRoot, client, force, }: {
        wsRoot: string;
        client?: PrismaClient;
        force?: boolean;
    });
    dispose(): void;
    get(id: string): Promise<{
        error: import("@dendronhq/common-all").DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
        data?: never;
    } | {
        data: NotePropsMeta;
        error?: never;
    }>;
    find(opts: any): Promise<{
        data: NotePropsMeta[];
    }>;
    write(key: string, data: NotePropsMeta): Promise<{
        error: Error;
        data?: never;
    } | {
        data: string;
        error?: never;
    }>;
    delete(key: string): Promise<{
        error: Error;
        data?: never;
    } | {
        data: string;
        error?: never;
    }>;
    static prisma(): any;
    static isDBInitialized(): Promise<boolean>;
    /**
     * Check if this vault is initialized in sqlite
     */
    static isVaultInitialized(vault: DVault): Promise<boolean>;
    static createWorkspace(wsRoot: string): Promise<any>;
    static createAllTables(): Promise<any[]>;
    static upsertNote(_note: NoteProps): Promise<void>;
    static bulkInsertAllNotes({ notesIdDict, }: {
        notesIdDict: NotePropsByIdDict;
    }): Promise<{
        query: string;
    } | undefined>;
    static search(query: string): Promise<{
        hits: NoteIndexLightProps[];
        query: string;
    }>;
}
export {};
