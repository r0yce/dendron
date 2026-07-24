/**
 * Schema lookup helpers.
 * Pure gates are Node-smokeable; fetch/create rows need engine only (no vscode import).
 */
import {
  DEngineClient,
  DNodeUtils,
  DNodePropsQuickInputV2,
  DVault,
  NoteQuickInput,
  SchemaModuleProps,
  SchemaUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { CREATE_NEW_LABEL, CREATE_NEW_SCHEMA_DETAIL } from "./constants";

/**
 * Multi-level schema ids (a.b) are not supported for create.
 */
export function isMultiLevelSchemaQuery(value: string): boolean {
  return value.split(".").length > 1;
}

function createSchemaNoActiveItem(fname: string): DNodePropsQuickInputV2 {
  const props = DNodeUtils.create({
    id: CREATE_NEW_LABEL,
    fname,
    type: "note",
    vault: { fsPath: "", name: "" } as DVault,
  });
  return {
    ...props,
    label: CREATE_NEW_LABEL,
    detail: CREATE_NEW_SCHEMA_DETAIL,
    alwaysShow: true,
  };
}

/**
 * Append Create New schema row when allowed and no perfect match.
 */
export function appendCreateNewSchemaItem(opts: {
  updatedItems: NoteQuickInput[];
  querystring: string;
  allowNewNote: boolean;
  hasPerfectMatch: boolean;
}): NoteQuickInput[] {
  if (opts.allowNewNote && !opts.hasPerfectMatch) {
    return opts.updatedItems.concat([
      createSchemaNoActiveItem(opts.querystring),
    ]);
  }
  return opts.updatedItems;
}

/**
 * Empty schema lookup: all schema module roots as QuickPick items.
 */
export async function fetchSchemaRootPickerItems(opts: {
  engine: DEngineClient;
  wsRoot: string;
  vaults: DVault[];
}): Promise<NoteQuickInput[]> {
  const { engine, wsRoot, vaults } = opts;
  const nodes = _.map(
    _.values((await engine.querySchema("*")).data),
    (ent: SchemaModuleProps) => SchemaUtils.getModuleRoot(ent),
  );
  return Promise.all(
    nodes.map(async (ent) =>
      DNodeUtils.enhancePropForQuickInputV3({
        wsRoot,
        props: ent,
        schema: ent.schema
          ? (await engine.getSchema(ent.schema.moduleId)).data
          : undefined,
        vaults,
      }),
    ),
  );
}
