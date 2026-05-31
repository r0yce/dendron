"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteIndex = getSiteIndex;
const common_all_1 = require("@dendronhq/common-all");
const getWorkspaceConfig_1 = require("./getWorkspaceConfig");
/**
 * Get the siteIndex from publishing config
 * @param wsRoot
 * @returns siteIndex
 */
async function getSiteIndex(wsRoot) {
    const config = await (0, getWorkspaceConfig_1.getWorkspaceConfig)(wsRoot);
    return (common_all_1.ConfigUtils.getPublishing(config).siteIndex ||
        common_all_1.ConfigUtils.getPublishing(config).siteHierarchies[0]);
}
//# sourceMappingURL=getSiteIndex.js.map