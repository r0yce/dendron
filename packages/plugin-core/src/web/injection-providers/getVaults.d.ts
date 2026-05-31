import { DVault } from "@dendronhq/common-all";
import "reflect-metadata";
import { Uri } from "vscode";
/**
 * Get all the vaults from the specified workspace root
 * @param wsRoot
 * @returns
 */
export declare function getVaults(wsRoot: Uri): Promise<DVault[]>;
