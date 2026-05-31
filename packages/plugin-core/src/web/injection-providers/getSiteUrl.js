"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteUrl = getSiteUrl;
const common_all_1 = require("@dendronhq/common-all");
const getWorkspaceConfig_1 = require("./getWorkspaceConfig");
/**
 * Get the siteUrl from publishing config
 * @param wsRoot
 * @returns siteUrl
 */
async function getSiteUrl(wsRoot) {
    const config = await (0, getWorkspaceConfig_1.getWorkspaceConfig)(wsRoot);
    return common_all_1.ConfigUtils.getPublishing(config).siteUrl || "";
}
//# sourceMappingURL=getSiteUrl.js.map