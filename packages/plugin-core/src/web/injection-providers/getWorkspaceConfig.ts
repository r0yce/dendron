import "reflect-metadata";
import { CONSTANTS, DendronConfig } from "@dendronhq/common-all";
import YAML from "js-yaml";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { decodeUtf8 } from "../../utils/browserTextDecoder";

export async function getWorkspaceConfig(wsRoot: Uri) {
  const configPath = Uri.joinPath(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  const config = (await readYAML(configPath, true)) as DendronConfig;
  return config;
}

async function readYAML(path: Uri, overwriteDuplicate?: boolean): Promise<any> {
  const file = await vscode.workspace.fs.readFile(path);
  const bar = decodeUtf8(file);
  return YAML.load(bar, {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  });
}
