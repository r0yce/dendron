import { DendronError } from "@dendronhq/common-all";
import yargs from "yargs";
import { ExtensionType, PublishEndpoint, SemverVersion } from "../utils/build";
import { CLICommand, CommandCommonProps } from "./base";
type CommandCLIOpts = {
    cmd: DevCommands;
};
export declare enum DevCommands {
    GENERATE_JSON_SCHEMA_FROM_CONFIG = "generate_json_schema_from_config",
    BUILD = "build",
    CREATE_TEST_VAULT = "create_test_vault",
    BUMP_VERSION = "bump_version",
    PUBLISH = "publish",
    SYNC_ASSETS = "sync_assets",
    SYNC_TUTORIAL = "sync_tutorial",
    PREP_PLUGIN = "prep_plugin",
    PACKAGE_PLUGIN = "package_plugin",
    INSTALL_PLUGIN = "install_plugin",
    ENABLE_TELEMETRY = "enable_telemetry",
    DISABLE_TELEMETRY = "disable_telemetry",
    SHOW_TELEMETRY = "show_telemetry",
    SHOW_MIGRATIONS = "show_migrations",
    RUN_MIGRATION = "run_migration"
}
type CommandOpts = CommandCLIOpts & CommandCommonProps & Partial<BuildCmdOpts> & Partial<RunMigrationOpts> & Partial<CreateTestVaultOpts>;
type CommandOutput = Partial<{
    error: DendronError;
    data: any;
}>;
type BuildCmdOpts = {
    publishEndpoint: PublishEndpoint;
    fast?: boolean;
    extensionType: ExtensionType;
    extensionTarget?: string;
    skipSentry?: boolean;
} & BumpVersionOpts & PrepPluginOpts;
type CreateTestVaultOpts = {
    wsRoot: string;
    /**
     * Location of json data
     */
    jsonData: string;
} & CommandCLIOpts;
type BumpVersionOpts = {
    upgradeType: SemverVersion;
} & CommandCLIOpts;
type PrepPluginOpts = {
    extensionType: ExtensionType;
} & CommandCLIOpts;
type RunMigrationOpts = {
    migrationVersion: string;
    wsRoot: string;
} & CommandCLIOpts;
type JsonDataForCreateTestVault = {
    numNotes: number;
    numVaults: number;
    ratios: {
        tag: number;
        user: number;
        reg: number;
    };
};
export { CommandOpts as DevCLICommandOpts };
/**
 * To use when working on dendron
 */
export declare class DevCLICommand extends CLICommand<CommandOpts, CommandOutput> {
    constructor();
    private setEndpoint;
    buildArgs(args: yargs.Argv): void;
    enrichArgs(args: CommandCLIOpts): Promise<{
        data: {
            cmd: DevCommands;
        };
    }>;
    createTestVault({ wsRoot, payload, }: {
        wsRoot: string;
        payload: JsonDataForCreateTestVault;
    }): Promise<{
        server: import("@dendronhq/api-server").Server;
    }>;
    generateJSONSchemaFromConfig(): Promise<void>;
    execute(opts: CommandOpts): Promise<{
        error: any;
    }>;
    bumpVersion(opts: BumpVersionOpts): Promise<void>;
    build(opts: BuildCmdOpts): Promise<void>;
    /**
     * Takes assets from different monorepo packages and copies them over to the plugin
     * @param param0
     * @returns
     */
    syncAssets({ fast }: {
        fast?: boolean;
    }): Promise<{
        staticPath: string;
    }>;
    syncTutorial(): void;
    validateBuildArgs(opts: CommandOpts): opts is BuildCmdOpts;
    validateBumpVersionArgs(opts: CommandOpts): opts is BumpVersionOpts;
    validateCreateTestVaultArgs(opts: CommandOpts): opts is CreateTestVaultOpts;
    validatePrepPluginArgs(opts: CommandOpts): opts is PrepPluginOpts;
    validateRunMigrationArgs(opts: CommandOpts): opts is RunMigrationOpts;
    enableTelemetry(): void;
    disableTelemetry(): void;
    showMigrations(): void;
    runMigration(opts: CommandOpts): Promise<void>;
}
