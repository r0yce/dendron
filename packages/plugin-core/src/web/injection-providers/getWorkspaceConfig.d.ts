import "reflect-metadata";
import { DendronConfig } from "@dendronhq/common-all";
import { Uri } from "vscode";
export declare function getWorkspaceConfig(wsRoot: Uri): Promise<DendronConfig>;
