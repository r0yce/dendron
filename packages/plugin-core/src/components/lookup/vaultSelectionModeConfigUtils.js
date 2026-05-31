"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultSelectionModeConfigUtils = void 0;
const types_1 = require("./types");
const common_all_1 = require("@dendronhq/common-all");
const ExtensionProvider_1 = require("../../ExtensionProvider");
/**
 * Class responsible for proxying interaction with vault
 * selection mode configuration.
 * */
class VaultSelectionModeConfigUtils {
    static getVaultSelectionMode() {
        if (common_all_1.ConfigUtils.getCommands(ExtensionProvider_1.ExtensionProvider.getDWorkspace().config).lookup
            .note.confirmVaultOnCreate) {
            return this.toVaultSelectionMode(this.configVaultSelectionMode());
        }
        else {
            return types_1.VaultSelectionMode.smart;
        }
    }
    static configVaultSelectionMode() {
        const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const lookupConfig = common_all_1.ConfigUtils.getCommands(ws.config).lookup;
        const noteLookupConfig = lookupConfig.note;
        const configMode = noteLookupConfig.vaultSelectionModeOnCreate;
        return configMode;
    }
    static shouldAlwaysPromptVaultSelection() {
        return this.configVaultSelectionMode() === "alwaysPrompt";
    }
    static toVaultSelectionMode(configMode) {
        switch (configMode) {
            case "smart":
                return types_1.VaultSelectionMode.smart;
            case "alwaysPrompt":
                return types_1.VaultSelectionMode.alwaysPrompt;
            default:
                return types_1.VaultSelectionMode.smart;
        }
    }
}
exports.VaultSelectionModeConfigUtils = VaultSelectionModeConfigUtils;
//# sourceMappingURL=vaultSelectionModeConfigUtils.js.map