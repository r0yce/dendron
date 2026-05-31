import { CleanDendronPublishingConfig, DeepPartial, DendronPublishingConfig, RespV3, RespWithOptError, DendronConfig } from "@dendronhq/common-all";
export declare enum LocalConfigScope {
    WORKSPACE = "WORKSPACE",
    GLOBAL = "GLOBAL"
}
export declare class DConfig {
    static createSync({ wsRoot, defaults, }: {
        wsRoot: string;
        defaults?: DeepPartial<DendronConfig>;
    }): DendronConfig;
    static configPath(configRoot: string): string;
    static configOverridePath(wsRoot: string, scope: LocalConfigScope): string;
    /**
     * Get without filling in defaults
     * @param wsRoot
     */
    static getRaw(wsRoot: string, overwriteDuplcate?: boolean): Partial<DendronConfig>;
    static getOrCreate(dendronRoot: string, defaults?: DeepPartial<DendronConfig>): DendronConfig;
    static getSiteIndex(sconfig: DendronPublishingConfig): string;
    /**
     * fill in defaults
     */
    static cleanPublishingConfig(config: DendronPublishingConfig): CleanDendronPublishingConfig;
    static setCleanPublishingConfig(opts: {
        config: DendronConfig;
        cleanConfig: DendronPublishingConfig;
    }): void;
    /**
     * See if a local config file is present
     */
    static searchLocalConfigSync(wsRoot: string): RespV3<DendronConfig>;
    /**
     * Read configuration
     * @param wsRoot
     * @param useCache: If true, read from cache instead of file system
     * @returns
     */
    static readConfigSync(wsRoot: string, useCache?: boolean): DendronConfig;
    /**
     * Read config and merge with local config
     * @param wsRoot
     * @param useCache: If true, read from cache instead of file system
     * @returns
     */
    static readConfigAndApplyLocalOverrideSync(wsRoot: string, useCache?: boolean): RespWithOptError<DendronConfig>;
    static writeConfig({ wsRoot, config, }: {
        wsRoot: string;
        config: DendronConfig;
    }): Promise<void>;
    static writeLocalConfig({ wsRoot, config, configScope, }: {
        wsRoot: string;
        config: DeepPartial<DendronConfig>;
        configScope: LocalConfigScope;
    }): Promise<void>;
    /**
     * Sanity check local config properties
     */
    static validateLocalConfig({ config, }: {
        config: DeepPartial<DendronConfig>;
    }): RespV3<boolean>;
    /**
     * Create a backup of dendron.yml with an optional custom infix string.
     * e.g.) createBackup(wsRoot, "foo") will result in a backup file name
     * `dendron.yyyy.MM.dd.HHmmssS.foo.yml`
     * @param wsRoot workspace root
     * @param infix custom string used in the backup name
     * ^fd66z8uiuczz
     */
    static createBackup(wsRoot: string, infix?: string): Promise<string>;
}
