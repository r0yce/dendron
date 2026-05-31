import { Uri } from "vscode";
/**
 * Get the enablePrettlyLinks from publishing config
 * @param wsRoot
 * @returns value of enablePrettlyLinks from publishing config
 */
export declare function getEnablePrettlyLinks(wsRoot: Uri): Promise<boolean | undefined>;
