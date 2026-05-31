import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { PodCLIOpts } from "./pod";
import { SetupEngineCLIOpts, SetupEngineResp } from "./utils";
export { CommandCLIOpts as ExportPodCLIOpts };
type CommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;
type CommandOpts = CommandCLIOpts & {
    podClass: any;
    config: any;
} & SetupEngineResp & CommandCommonProps;
type CommandOutput = CommandCommonProps;
export declare class ExportPodCLICommand extends CLICommand<CommandOpts, CommandOutput> {
    constructor();
    buildArgs(args: yargs.Argv<CommandCLIOpts>): void;
    enrichArgs(args: CommandCLIOpts): Promise<import("@dendronhq/common-all").RespV3<import("./pod").PodCommandOpts<any>>>;
    static getPods(): import("@dendronhq/pods-core").PodClassEntryV4[];
    execute(opts: CommandOpts): Promise<CommandOutput>;
}
