/**
 * Create a new schema module from schema lookup QuickPick value.
 */
import { DVault, SchemaModuleProps, SchemaUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { Uri } from "vscode";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { ExtensionProvider } from "../ExtensionProvider";
import { SchemaLookupAcceptReturn } from "./schemaLookupAcceptTypes";

export async function acceptNewSchemaLookupItem(opts: {
  picker: DendronQuickPickerV2;
}): Promise<SchemaLookupAcceptReturn | undefined> {
  const { picker } = opts;
  const fname = picker.value;
  const ws = ExtensionProvider.getDWorkspace();
  const { engine } = ws;
  const vault: DVault = picker.vault
    ? picker.vault
    : PickerUtilsV2.getVaultForOpenEditor();
  const nodeSchemaModuleNew: SchemaModuleProps = SchemaUtils.createModuleProps({
    fname,
    vault,
  });
  const vpath = vault2Path({ vault, wsRoot: ws.wsRoot });
  const uri = Uri.file(SchemaUtils.getPath({ root: vpath, fname }));
  const resp = await engine.writeSchema(nodeSchemaModuleNew);

  return { uri, node: nodeSchemaModuleNew, resp };
}
