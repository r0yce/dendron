import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
type CommandCLIOpts = {
    wsRoot: string;
    fromConfig?: boolean;
    dryRun?: boolean;
    action: Action;
    useGithubAccessToken?: boolean;
};
type CommandOpts = CommandCLIOpts & CommandCommonProps;
export declare enum Action {
    INIT = "init"
}
export declare class WorkspaceCLICommand extends CLICommand<CommandOpts> {
    constructor();
    buildArgs(args: yargs.Argv): void;
    enrichArgs(args: CommandCLIOpts): Promise<{
        data: {
            wsRoot: string;
            engine: import("@dendronhq/common-all").DEngineClient;
            port: number;
            server: import("@dendronhq/api-server").Server;
            serverSockets?: Set<import("net").Socket>;
            fromConfig?: boolean;
            dryRun?: boolean;
            action: Action;
            useGithubAccessToken?: boolean;
        };
    }>;
    execute(opts: CommandOpts): Promise<{}>;
}
export {};
