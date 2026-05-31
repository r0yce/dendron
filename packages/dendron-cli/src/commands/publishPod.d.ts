import { RespV3 } from "@dendronhq/common-all";
import { PublishPodConfig } from "@dendronhq/pods-core";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { PodCLIOpts } from "./pod";
import { SetupEngineCLIOpts, SetupEngineResp } from "./utils";
type CommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;
type CommandOpts = CommandCLIOpts & {
    podClass: any;
    config: PublishPodConfig;
} & SetupEngineResp & CommandCommonProps;
type CommandOutput = CommandCommonProps;
export declare class PublishPodCLICommand extends CLICommand<CommandOpts, CommandOutput> {
    constructor();
    buildArgs(args: yargs.Argv<CommandCLIOpts>): void;
    enrichArgs(args: CommandCLIOpts): Promise<RespV3<CommandOpts>>;
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
export {};
