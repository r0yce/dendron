import { Uri } from "vscode";
/**
 * Get the siteIndex from publishing config
 * @param wsRoot
 * @returns siteIndex
 */
export declare function getSiteIndex(wsRoot: Uri): Promise<string | undefined>;
