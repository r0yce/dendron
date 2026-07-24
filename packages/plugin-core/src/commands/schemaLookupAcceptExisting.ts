/**
 * Accept an existing schema module from schema lookup.
 */
import { SchemaQuickInput, SchemaUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { Uri } from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { SchemaLookupAcceptReturn } from "./schemaLookupAcceptTypes";

export async function acceptExistingSchemaLookupItem(
  item: SchemaQuickInput,
): Promise<SchemaLookupAcceptReturn | undefined> {
  const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
  const vpath = vault2Path({
    vault: item.vault,
    wsRoot,
  });
  const schemaModule = await engine.getSchema(item.id);

  if (!schemaModule.data) {
    return;
  }
  const uri = Uri.file(
    SchemaUtils.getPath({
      root: vpath,
      fname: schemaModule.data.fname,
    }),
  );
  return { uri, node: schemaModule.data };
}
