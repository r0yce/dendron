import { DVault, VaultRemoteSource } from "@dendronhq/common-all";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { SetupEngineResp } from "./utils";
type CommandCLIOpts = {
    wsRoot: string;
    vault?: string;
    enginePort?: number;
    vaultPath: string;
    noAddToConfig?: boolean;
    cmd: VaultCommands;
    remoteUrl?: string;
    type?: VaultRemoteSource;
};
type CommandOpts = CommandCLIOpts & SetupEngineResp & CommandCommonProps;
export declare enum VaultCommands {
    CREATE = "create",
    CONVERT = "convert"
}
export { CommandOpts as VaultCLICommandOpts };
export declare class VaultCLICommand extends CLICommand<CommandOpts> {
    constructor();
    buildArgs(args: yargs.Argv): void;
    enrichArgs(args: CommandCLIOpts): Promise<{
        data: {
            wsRoot: string;
            engine: import("@dendronhq/engine-server").DEngineClient;
            port: number;
            server: import("@dendronhq/api-server").Server;
            serverSockets?: Set<import("net").Socket>;
            vault?: string;
            enginePort?: number;
            vaultPath: string;
            noAddToConfig?: boolean;
            cmd: VaultCommands;
            remoteUrl?: string;
            type?: VaultRemoteSource;
        };
    }>;
    execute(opts: CommandOpts): Promise<{
        vault: DVault;
        error: undefined;
    }>;
}
