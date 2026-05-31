"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPathInWorkspace = isPathInWorkspace;
const common_all_1 = require("@dendronhq/common-all");
//TODO: Move file to common
/**
 * Check if path is in workspace
 * @returns
 */
function isPathInWorkspace({ wsRoot, vaults, fsPath, }) {
    return (common_all_1.VaultUtilsV2.getVaultByFilePath({ wsRoot, vaults, fsPath }) !== undefined);
}
//# sourceMappingURL=isPathInWorkspace.js.map