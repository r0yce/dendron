"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnablePrettlyLinks = getEnablePrettlyLinks;
const common_all_1 = require("@dendronhq/common-all");
const getWorkspaceConfig_1 = require("./getWorkspaceConfig");
/**
 * Get the enablePrettlyLinks from publishing config
 * @param wsRoot
 * @returns value of enablePrettlyLinks from publishing config
 */
async function getEnablePrettlyLinks(wsRoot) {
    const config = await (0, getWorkspaceConfig_1.getWorkspaceConfig)(wsRoot);
    return common_all_1.ConfigUtils.getEnablePrettlyLinks(config) || true;
}
//# sourceMappingURL=getEnablePrettlyLinks.js.map