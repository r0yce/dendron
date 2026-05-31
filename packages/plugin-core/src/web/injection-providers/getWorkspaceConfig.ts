import "reflect-metadata";
import { CONSTANTS, DendronConfig } from "@dendronhq/common-all";
import YAML from "js-yaml";
import * as vscode from "vscode";
import { Uri } from "vscode";

export async function getWorkspaceConfig(wsRoot: Uri) {
  const configPath = Uri.joinPath(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  const config = (await readYAML(configPath, true)) as DendronConfig;
  return config;
}

async function readYAML(path: Uri, overwriteDuplicate?: boolean): Promise<any> {
  // browser interop: global DOM TextDecoder (no Node util in web bundle). Directive removed — no longer triggers (justification in Suppression Registry + 2026-06-01 dated note).
  const textDecoder = new TextDecoder();
  const file = await vscode.workspace.fs.readFile(path);
  const bar = textDecoder.decode(file);
  return YAML.load(bar, {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  });
}
