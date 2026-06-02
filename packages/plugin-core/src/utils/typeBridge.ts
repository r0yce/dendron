/**
 * Bridges @dendronhq/common-all types to api-extractor-inlined types in
 * @dendronhq/common-server .d.ts rolls (exactOptionalPropertyTypes mismatch).
 */
import type {
  DEngineClient,
  NoteProps,
  SchemaModuleOpts,
} from "@dendronhq/common-all";
import type { TemplateUtils } from "@dendronhq/common-server";
import type { note2File, schemaModuleOpts2File } from "@dendronhq/common-server";

type CSNoteProps = Parameters<
  typeof TemplateUtils.applyTemplate
>[0]["templateNote"];

type CSEngineClient = Parameters<
  typeof TemplateUtils.applyTemplate
>[0]["engine"];

type CSNotePropsForFile = Parameters<typeof note2File>[0]["note"];

type CSSchemaModuleOpts = Parameters<typeof schemaModuleOpts2File>[0];

/** NoteProps acceptable to common-server TemplateUtils / bundled rolls. */
export function toCSNoteProps(note: NoteProps): CSNoteProps {
  return note as CSNoteProps;
}

/** NoteProps for note2File and similar file helpers. */
export function toCSNotePropsForFile(note: NoteProps): CSNotePropsForFile {
  return note as CSNotePropsForFile;
}

/** Engine client acceptable to common-server APIs expecting DEngineClient. */
export function toDEngineClient(engine: DEngineClient): CSEngineClient {
  return engine as CSEngineClient;
}

export function toCSSchemaModuleOpts(
  schema: SchemaModuleOpts
): CSSchemaModuleOpts {
  return schema as CSSchemaModuleOpts;
}