"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DConfig = exports.LocalConfigScope = void 0;
const common_all_1 = require("@dendronhq/common-all");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const backup_1 = require("./backup");
const ConfigCompat_1 = require("./oneoff/ConfigCompat");
const files_1 = require("./files");
var LocalConfigScope;
(function (LocalConfigScope) {
    LocalConfigScope["WORKSPACE"] = "WORKSPACE";
    LocalConfigScope["GLOBAL"] = "GLOBAL";
})(LocalConfigScope || (exports.LocalConfigScope = LocalConfigScope = {}));
let _dendronConfig;
class DConfig {
    static createSync({ wsRoot, defaults, }) {
        const configPath = DConfig.configPath(wsRoot);
        const config = common_all_1.ConfigUtils.genLatestConfig(defaults);
        (0, files_1.writeYAML)(configPath, config);
        return config;
    }
    static configPath(configRoot) {
        return path_1.default.join(configRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE);
    }
    static configOverridePath(wsRoot, scope) {
        const configPath = scope === LocalConfigScope.GLOBAL ? os_1.default.homedir() : wsRoot;
        return path_1.default.join(configPath, common_all_1.CONSTANTS.DENDRON_LOCAL_CONFIG_FILE);
    }
    /**
     * Get without filling in defaults
     * @param wsRoot
     */
    static getRaw(wsRoot, overwriteDuplcate) {
        const configPath = DConfig.configPath(wsRoot);
        const config = (0, files_1.readYAML)(configPath, overwriteDuplcate ?? false);
        return config;
    }
    static getOrCreate(dendronRoot, defaults) {
        const configPath = DConfig.configPath(dendronRoot);
        // Need merge here to recursively merge nested configs
        let config = lodash_1.default.merge(common_all_1.ConfigUtils.genDefaultConfig(), defaults);
        if (!fs_extra_1.default.existsSync(configPath)) {
            (0, files_1.writeYAML)(configPath, config);
        }
        else {
            config = {
                ...config,
                ...(0, files_1.readYAML)(configPath),
            };
        }
        return config;
    }
    static getSiteIndex(sconfig) {
        const { siteIndex, siteHierarchies } = sconfig;
        return siteIndex || siteHierarchies[0] ?? "";
    }
    /**
     * fill in defaults
     */
    static cleanPublishingConfig(config) {
        const out = lodash_1.default.defaultsDeep(config, {
            copyAssets: true,
            enablePrettyRefs: true,
            siteFaviconPath: "favicon.ico",
            github: {
                enableEditLink: true,
                editLinkText: "Edit this page on Github",
                editBranch: "main",
                editViewMode: common_all_1.GithubEditViewModeEnum.edit,
            },
            writeStubs: true,
            seo: {
                description: "Personal Knowledge Space",
            },
        });
        const { siteRootDir, siteHierarchies } = out;
        let { siteIndex, siteUrl } = out;
        if (process.env["SITE_URL"]) {
            siteUrl = process.env["SITE_URL"];
        }
        if (!siteRootDir) {
            throw new common_all_1.DendronError({ message: "siteRootDir is undefined" });
        }
        if (!siteUrl && (0, common_all_1.getStage)() === "dev") {
            // this gets overridden in dev so doesn't matter
            siteUrl = "https://foo";
        }
        if (!siteUrl) {
            throw common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_CONFIG,
                message: "siteUrl is undefined. See https://dendron.so/notes/f2ed8639-a604-4a9d-b76c-41e205fb8713.html#siteurl for more details",
            });
        }
        if (lodash_1.default.size(siteHierarchies) < 1) {
            throw common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_CONFIG,
                message: `siteHiearchies must have at least one hierarchy`,
            });
        }
        siteIndex = this.getSiteIndex(config);
        return {
            ...out,
            siteIndex,
            siteUrl,
        };
    }
    static setCleanPublishingConfig(opts) {
        const { config, cleanConfig } = opts;
        common_all_1.ConfigUtils.setProp(config, "publishing", cleanConfig);
    }
    /**
     * See if a local config file is present
     */
    static searchLocalConfigSync(wsRoot) {
        const wsPath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_LOCAL_CONFIG_FILE);
        const globalPath = path_1.default.join(os_1.default.homedir(), common_all_1.CONSTANTS.DENDRON_LOCAL_CONFIG_FILE);
        let foundPath;
        if (fs_extra_1.default.existsSync(globalPath)) {
            foundPath = globalPath;
        }
        if (fs_extra_1.default.existsSync(wsPath)) {
            foundPath = wsPath;
        }
        if (foundPath) {
            // TODO: do validation in the future
            const data = (0, files_1.readYAML)(foundPath);
            return { data };
        }
        return {
            error: common_all_1.ErrorFactory.create404Error({
                url: common_all_1.CONSTANTS.DENDRON_LOCAL_CONFIG_FILE,
            }),
        };
    }
    /**
     * Read configuration
     * @param wsRoot
     * @param useCache: If true, read from cache instead of file system
     * @returns
     */
    static readConfigSync(wsRoot, useCache) {
        if (_dendronConfig && useCache) {
            return _dendronConfig;
        }
        const configPath = DConfig.configPath(wsRoot);
        const dendronConfigResult = (0, files_1.readString)(configPath)
            .andThen((input) => common_all_1.YamlUtils.fromStr(input, true))
            .andThen((unknownconfig) => {
            const cleanConfig = ConfigCompat_1.DConfigLegacy.configIsV4(unknownconfig)
                ? ConfigCompat_1.DConfigLegacy.v4ToV5(unknownconfig)
                : lodash_1.default.defaultsDeep(unknownconfig, common_all_1.ConfigUtils.genDefaultConfig());
            return common_all_1.ConfigUtils.parse(cleanConfig);
        })
            .map((dendronConfig) => {
            _dendronConfig = dendronConfig;
            return dendronConfig;
        });
        if (dendronConfigResult.isErr()) {
            throw dendronConfigResult.error;
        }
        return dendronConfigResult.value;
    }
    /**
     * Read config and merge with local config
     * @param wsRoot
     * @param useCache: If true, read from cache instead of file system
     * @returns
     */
    static readConfigAndApplyLocalOverrideSync(wsRoot, useCache) {
        const config = this.readConfigSync(wsRoot, useCache);
        const maybeLocalConfig = this.searchLocalConfigSync(wsRoot);
        let localConfigValidOrError = true;
        if (maybeLocalConfig.data) {
            const respValidate = this.validateLocalConfig({
                config: maybeLocalConfig.data,
            });
            if (respValidate.error) {
                localConfigValidOrError = respValidate.error;
            }
            if (!respValidate.error) {
                lodash_1.default.mergeWith(config, maybeLocalConfig.data, (objValue, srcValue) => {
                    // TODO: optimize, check for keys of known arrays instead
                    if (lodash_1.default.isArray(objValue)) {
                        return srcValue.concat(objValue);
                    }
                    return;
                });
            }
        }
        return {
            data: config,
            error: common_all_1.ErrorUtils.isDendronError(localConfigValidOrError)
                ? localConfigValidOrError
                : undefined,
        };
    }
    static writeConfig({ wsRoot, config, }) {
        _dendronConfig = config;
        const configPath = DConfig.configPath(wsRoot);
        return (0, files_1.writeYAMLAsync)(configPath, config);
    }
    static writeLocalConfig({ wsRoot, config, configScope, }) {
        const configPath = DConfig.configOverridePath(wsRoot, configScope);
        return (0, files_1.writeYAMLAsync)(configPath, config);
    }
    /**
     * Sanity check local config properties
     */
    static validateLocalConfig({ config, }) {
        if (config.workspace) {
            if (lodash_1.default.isEmpty(config.workspace) ||
                (config.workspace.vaults && !lodash_1.default.isArray(config.workspace.vaults))) {
                return {
                    error: new common_all_1.DendronError({
                        message: "workspace must not be empty and vaults must be an array if workspace is set",
                    }),
                };
            }
        }
        return { data: true };
    }
    /**
     * Create a backup of dendron.yml with an optional custom infix string.
     * e.g.) createBackup(wsRoot, "foo") will result in a backup file name
     * `dendron.yyyy.MM.dd.HHmmssS.foo.yml`
     * @param wsRoot workspace root
     * @param infix custom string used in the backup name
     * ^fd66z8uiuczz
     */
    static async createBackup(wsRoot, infix) {
        const backupService = new backup_1.BackupService({ wsRoot });
        try {
            const configPath = DConfig.configPath(wsRoot);
            const backupResp = await backupService.backup({
                key: backup_1.BackupKeyEnum.config,
                pathToBackup: configPath,
                timestamp: true,
                infix,
            });
            if (backupResp.error) {
                throw new common_all_1.DendronError({ ...backupResp.error });
            }
            return backupResp.data;
        }
        finally {
            backupService.dispose();
        }
    }
}
exports.DConfig = DConfig;
//# sourceMappingURL=DConfig.js.map