import { DVault, URI } from "@dendronhq/common-all";
/**
 * Check if path is in workspace
 * @returns
 */
export declare function isPathInWorkspace({ wsRoot, vaults, fsPath, }: {
    wsRoot: URI;
    fsPath: URI;
    vaults: DVault[];
}): boolean;
