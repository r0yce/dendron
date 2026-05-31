import { Uri } from "vscode";
/**
 * Get the assetsPrefix from publishing config
 * @param wsRoot
 * @returns assetsPrefix
 */
export declare function getAssetsPrefix(wsRoot: Uri): Promise<string | undefined>;
