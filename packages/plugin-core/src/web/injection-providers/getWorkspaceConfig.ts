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
  // @ts-expect-error - browser interop: must use global DOM TextDecoder (provided by "DOM" + "DOM.Iterable" libs in tsconfig; VSCode web extension + webview contexts have no Node 'util'/'node:util' TextDecoder available in webpack browser bundle). Precise dated justification (final Post-M2 + Doctor Smoke Burn, 2026-06-01); never bare per ts-expect-error-burner SKILL. See NoteParserV2 + VSCodeFileStore siblings + web/ DI cluster. 0 bare rule upheld. (Previously bare @ts-ignore + inline comment.)
  const textDecoder = new TextDecoder();
  const file = await vscode.workspace.fs.readFile(path);
  const bar = textDecoder.decode(file);
  return YAML.load(bar, {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  });
}
