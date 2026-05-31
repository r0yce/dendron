"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = exports.WorkspaceConfig = exports.Extensions = exports.Snippets = void 0;
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
Object.defineProperty(exports, "Snippets", { enumerable: true, get: function () { return engine_server_1.Snippets; } });
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const ExtensionProvider_1 = require("./ExtensionProvider");
const logger_1 = require("./logger");
class Extensions extends engine_server_1.Extensions {
    /**
     * Get Dendron recommended extensions
     */
    static getDendronExtensionRecommendations() {
        return lodash_1.default.filter(Extensions.configEntries(), (ent) => {
            return lodash_1.default.isUndefined(ent.action);
        }).map((ent) => {
            return {
                id: ent.default,
                extension: vscode_1.extensions.getExtension(ent.default),
            };
        });
    }
}
exports.Extensions = Extensions;
class WorkspaceConfig extends engine_server_1.WorkspaceConfig {
    static async update(_wsRoot) {
        const ctx = "WorkspaceConfig:update";
        const src = ExtensionProvider_1.ExtensionProvider.getWorkspaceConfig();
        const changes = await Settings.upgrade(src, engine_server_1._SETTINGS);
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const vpath = (0, common_server_1.pathForVaultRoot)({ wsRoot, vault: vaults[0] });
        const vscodeDir = path_1.default.join(vpath, ".vscode");
        const snippetChanges = await engine_server_1.Snippets.upgradeOrCreate(vscodeDir);
        logger_1.Logger.info({ ctx, vscodeDir, snippetChanges });
        return {
            extensions: {},
            settings: changes,
            snippetChanges,
        };
    }
}
exports.WorkspaceConfig = WorkspaceConfig;
class Settings extends engine_server_1.Settings {
    /**
     * Upgrade config
     * @param config config to upgrade
     * @param target: config set to upgrade to
     */
    static async upgrade(src, target, opts) {
        const cleanOpts = lodash_1.default.defaults(opts, { force: false });
        const add = {};
        const errors = {};
        await Promise.all(lodash_1.default.map(lodash_1.default.omit(target, [
            "workbench.colorTheme",
            "[markdown]",
            constants_1.CONFIG.DEFAULT_JOURNAL_DATE_FORMAT.key,
            constants_1.CONFIG.DEFAULT_SCRATCH_DATE_FORMAT.key,
        ]), async (entry, key) => {
            const item = src.inspect(key);
            // if value for key is not defined anywhere, set it to the default
            if (lodash_1.default.every([
                item?.globalValue,
                item?.workspaceFolderValue,
                item?.workspaceValue,
            ], lodash_1.default.isUndefined) ||
                cleanOpts.force) {
                const value = entry.default;
                try {
                    src.update(key, value, vscode_1.ConfigurationTarget.Workspace);
                    add[key] = value;
                    return;
                }
                catch (err) {
                    errors[key] = err;
                }
            }
            return;
        }));
        return { add, errors };
    }
}
exports.Settings = Settings;
//# sourceMappingURL=settings.js.map