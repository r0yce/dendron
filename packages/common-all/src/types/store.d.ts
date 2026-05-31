import { NoteProps, NotePropsMeta } from "./foundation";
import { SchemaModuleProps } from "./typesv2";
export type WriteNoteOpts<K> = {
    key: K;
    note: NoteProps;
};
export type WriteNoteMetaOpts<K> = {
    key: K;
    noteMeta: NotePropsMeta;
};
export type WriteSchemaOpts<K> = {
    key: K;
    schema: SchemaModuleProps;
};
