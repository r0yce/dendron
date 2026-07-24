/**
 * Schema-driven lookup completions for NoteLookupProvider.
 * Candidate construction is pure; engine/schema enhance is async.
 */
import {
  DEngineClient,
  DVault,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  SchemaModuleProps,
  SchemaProps,
  SchemaUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { enhanceNotesForQuickInput } from "./notePickerEnhance";
import { sortBySimilarity } from "./pickerSort";

/**
 * Build note props for simple-pattern schema children under `dirName`.
 * Pure aside from SchemaUtils helpers (no engine / VS Code).
 */
export function buildSchemaChildNoteCandidates(opts: {
  dirName: string;
  vault: DVault;
  schema: SchemaProps;
  schemaModule: SchemaModuleProps;
}): NoteProps[] {
  const { dirName, vault, schema, schemaModule } = opts;
  return schema.children
    .map((ent) => {
      const mschema = schemaModule.schemas[ent];
      if (
        mschema &&
        SchemaUtils.hasSimplePattern(mschema, {
          isNotNamespace: true,
        })
      ) {
        const pattern = SchemaUtils.getPattern(mschema, {
          isNotNamespace: true,
        });
        const fname = [dirName, pattern].join(".");
        return NoteUtils.fromSchema({
          schemaModule,
          schemaId: ent,
          fname,
          vault,
        });
      }
      return undefined;
    })
    .filter(Boolean) as NoteProps[];
}

/**
 * Drop candidates whose fname already appears in existing items; rank by similarity.
 */
export function selectNewSchemaCandidates(opts: {
  candidates: NoteProps[];
  existingItems: { fname: string }[];
  originalQuery: string;
}): NoteProps[] {
  const candidatesToAdd = _.differenceBy(
    opts.candidates,
    opts.existingItems,
    (ent) => ent.fname,
  );
  return sortBySimilarity(candidatesToAdd, opts.originalQuery);
}

/**
 * Match path under schema and append new completion items to the picker list.
 */
export async function appendSchemaCompletions(opts: {
  queryUpToLastDot: string | undefined;
  wasMadeFromWikiLink: boolean;
  engine: DEngineClient;
  vault: DVault;
  wsRoot: string;
  vaults: DVault[];
  existingItems: NoteQuickInput[];
  originalQuery: string;
}): Promise<NoteQuickInput[]> {
  const {
    queryUpToLastDot,
    wasMadeFromWikiLink,
    engine,
    vault,
    wsRoot,
    vaults,
    existingItems,
    originalQuery,
  } = opts;

  if (_.isUndefined(queryUpToLastDot) || wasMadeFromWikiLink) {
    return existingItems;
  }

  const results = await SchemaUtils.matchPath({
    notePath: queryUpToLastDot,
    engine,
  });
  // namespace matches everything — skip completions for those
  if (!results || results.namespace) {
    return existingItems;
  }

  const { schema, schemaModule } = results;
  const candidates = buildSchemaChildNoteCandidates({
    dirName: queryUpToLastDot,
    vault,
    schema,
    schemaModule,
  });
  const candidatesToAdd = selectNewSchemaCandidates({
    candidates,
    existingItems,
    originalQuery,
  });
  if (candidatesToAdd.length === 0) {
    return existingItems;
  }

  const itemsToAdd = await enhanceNotesForQuickInput({
    nodes: candidatesToAdd,
    engine,
    wsRoot,
    vaults,
  });

  return existingItems.concat(itemsToAdd);
}
