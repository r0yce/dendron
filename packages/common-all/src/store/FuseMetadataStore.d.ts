import { StatusCodes } from "http-status-codes";
import { ResultAsync } from "neverthrow";
import { DendronError } from "../error";
import { FuseEngine } from "../FuseEngine";
import { NoteChangeEntry, NotePropsByIdDict, NotePropsMeta, SchemaModuleDict, SchemaModuleProps } from "../types";
import { INoteQueryOpts, IQueryStore } from "./IDataQuery";
export declare class FuseQueryStore implements IQueryStore {
    fuseEngine: FuseEngine;
    constructor(opts?: {
        fuzzThreshold: number;
    });
    addSchemaToIndex(schema: SchemaModuleProps): ResultAsync<void, DendronError<StatusCodes | undefined>>;
    queryNotes(qs: string, opts: INoteQueryOpts): ResultAsync<NotePropsMeta[], DendronError<StatusCodes | undefined>>;
    querySchemas(qs: string): ResultAsync<{
        id: string;
    }[], DendronError<StatusCodes | undefined>>;
    removeSchemaFromIndex(schema: SchemaModuleProps): ResultAsync<void, DendronError>;
    replaceNotesIndex(props: NotePropsByIdDict): ResultAsync<void, DendronError>;
    replaceSchemasIndex(props: SchemaModuleDict): ResultAsync<void, DendronError>;
    updateNotesIndex(changes: NoteChangeEntry[]): ResultAsync<void, DendronError>;
    updateSchemasIndex(): ResultAsync<void, DendronError<StatusCodes | undefined>>;
}
