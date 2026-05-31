import { Uri } from "vscode";
/**
 * Get the siteUrl from publishing config
 * @param wsRoot
 * @returns siteUrl
 */
export declare function getSiteUrl(wsRoot: Uri): Promise<string | undefined>;
