"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVaults = getVaults;
require("reflect-metadata");
const getWorkspaceConfig_1 = require("./getWorkspaceConfig");
/**
 * Get all the vaults from the specified workspace root
 * @param wsRoot
 * @returns
 */
async function getVaults(wsRoot) {
    const config = await (0, getWorkspaceConfig_1.getWorkspaceConfig)(wsRoot);
    return config.workspace.vaults;
}
//# sourceMappingURL=getVaults.js.map