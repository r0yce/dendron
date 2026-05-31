"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginVaultUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const ExtensionProvider_1 = require("./ExtensionProvider");
/**
 * Wrapper around common-all VaultUtils which provides defaults
 * using the the current workspace accessible from the plugin. */
class PluginVaultUtils {
    static getVaultByNotePath({ vaults, wsRoot, fsPath, }) {
        if (!wsRoot) {
            wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
        }
        if (!vaults) {
            vaults = ExtensionProvider_1.ExtensionProvider.getDWorkspace().vaults;
        }
        return common_all_1.VaultUtils.getVaultByFilePath({
            vaults,
            wsRoot,
            fsPath,
        });
    }
}
exports.PluginVaultUtils = PluginVaultUtils;
//# sourceMappingURL=pluginVaultUtils.js.map