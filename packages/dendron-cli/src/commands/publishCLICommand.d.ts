import { DendronError, Stage } from "@dendronhq/common-all";
import { BuildOverrides, PublishTarget } from "@dendronhq/pods-core";
import yargs from "yargs";
import { CLICommand } from "./base";
import { SetupEngineCLIOpts } from "./utils";
import { Ora } from "ora";
type CommandCLIOpts = {
    cmd: PublishCommands;
    wsRoot: string;
    dest?: string;
    error?: DendronError;
    /**
     * Should build sitemap
     */
    sitemap?: boolean;
} & CommandCLIOnlyOpts & Pick<SetupEngineCLIOpts, "attach">;
type CommandCLIOnlyOpts = {
    overrides?: string;
};
export declare enum PublishCommands {
    /**
     * Initiliaze the nextjs-template from Dendron in the dendron workspace
     */
    INIT = "init",
    /**
     * Create metadata needed to builid dendron nextjs template
     */
    BUILD = "build",
    /**
     * Builds the website
     */
    DEV = "dev",
    /**
     * Export website
     */
    EXPORT = "export"
}
type CommandOpts = Omit<CommandCLIOpts, "overrides"> & Partial<ExportCmdOpts>;
type CommandOutput = Partial<{
    error: DendronError;
    data: any;
}>;
type BuildCmdOpts = Omit<CommandCLIOpts, keyof CommandCLIOnlyOpts> & {
    /**
     * Use existing engine instead of spawning a new one
     */
    attach?: boolean;
    /**
     * Override site config with custom values
     */
    overrides?: BuildOverrides;
};
type DevCmdOpts = BuildCmdOpts & {
    noBuild?: boolean;
};
type ExportCmdOpts = DevCmdOpts & {
    target?: PublishTarget;
    yes?: boolean;
};
export { CommandOpts as PublishCLICommandOpts };
export { CommandCLIOpts as PublishCLICommandCLIOpts };
/**
 * To use when working on dendron
 */
export declare class PublishCLICommand extends CLICommand<CommandOpts, CommandOutput> {
    constructor();
    buildArgs(args: yargs.Argv): void;
    enrichArgs(args: CommandCLIOpts): Promise<{
        error: DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
        data?: never;
    } | {
        data: {
            overrides: BuildOverrides;
            wsRoot: string;
            error?: DendronError;
            dest?: string;
            cmd: PublishCommands;
            attach?: boolean;
            sitemap?: boolean;
        };
        error?: never;
    }>;
    execute(opts: CommandOpts): Promise<{
        error: any;
    }>;
    _buildNextData({ wsRoot, stage, dest, attach, overrides, }: {
        stage: Stage;
    } & Pick<CommandOpts, "attach" | "dest" | "wsRoot" | "overrides">): Promise<{
        error: import("@dendronhq/common-all").IDendronError;
        data?: never;
    } | {
        data: import("./base").CommandCommonProps;
        error?: never;
    }>;
    _handlePublishTarget(target: PublishTarget, opts: ExportCmdOpts): Promise<void>;
    init(opts: {
        wsRoot: string;
        spinner: Ora;
    }): Promise<{
        error: null;
    }>;
    _isInitialized(opts: {
        wsRoot: string;
        spinner: Ora;
    }): Promise<boolean>;
    _nextPathExists(opts: {
        nextPath: string;
        spinner: Ora;
    }): Promise<boolean>;
    _updateNextTemplate(opts: {
        nextPath: string;
        spinner: Ora;
    }): Promise<void>;
    _removeNextPath(opts: {
        nextPath: string;
        spinner: Ora;
    }): Promise<void>;
    _initialize(opts: {
        nextPath: string;
        spinner: Ora;
    }): Promise<void>;
    _cloneTemplate(opts: {
        nextPath: string;
        spinner: Ora;
    }): Promise<void>;
    _installDependencies(opts: {
        nextPath: string;
        spinner: Ora;
    }): Promise<void>;
    build({ wsRoot, dest, attach, overrides, sitemap }: BuildCmdOpts): Promise<{
        error: import("@dendronhq/common-all").IDendronError;
    } | {
        error: null;
    }>;
    dev(opts: DevCmdOpts): Promise<{
        error: null;
    }>;
    export(opts: ExportCmdOpts): Promise<void>;
}
