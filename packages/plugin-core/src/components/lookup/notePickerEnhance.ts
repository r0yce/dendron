/**
 * Batch schema load + enhance notes for QuickPick (shared by fetchPickerResults
 * and schema completions).
 */
import {
  DEngineClient,
  DNodeUtils,
  DVault,
  NoteProps,
  NoteQuickInput,
} from "@dendronhq/common-all";
import _ from "lodash";

export async function loadSchemasByModuleIds(
  engine: DEngineClient,
  moduleIds: string[],
): Promise<
  Map<string, Awaited<ReturnType<DEngineClient["getSchema"]>>["data"]>
> {
  const schemaByModule = new Map<
    string,
    Awaited<ReturnType<DEngineClient["getSchema"]>>["data"]
  >();
  await Promise.all(
    moduleIds.map(async (moduleId) => {
      const resp = await engine.getSchema(moduleId);
      if (resp.data) {
        schemaByModule.set(moduleId, resp.data);
      }
    }),
  );
  return schemaByModule;
}

/**
 * Enhance note props for QuickInput, batching unique schema module loads.
 */
export async function enhanceNotesForQuickInput(opts: {
  nodes: NoteProps[];
  engine: DEngineClient;
  wsRoot: string;
  vaults: DVault[];
  alwaysShow?: boolean;
}): Promise<NoteQuickInput[]> {
  const { nodes, engine, wsRoot, vaults, alwaysShow } = opts;
  const schemaModuleIds = _.uniq(
    nodes.map((ent) => ent.schema?.moduleId).filter((id): id is string => !!id),
  );
  const schemaByModule = await loadSchemasByModuleIds(engine, schemaModuleIds);

  return Promise.all(
    nodes.map(async (ent) =>
      DNodeUtils.enhancePropForQuickInputV3({
        wsRoot,
        props: ent,
        schema: ent.schema?.moduleId
          ? schemaByModule.get(ent.schema.moduleId)
          : undefined,
        vaults,
        ...(alwaysShow !== undefined ? { alwaysShow } : {}),
      }),
    ),
  );
}
