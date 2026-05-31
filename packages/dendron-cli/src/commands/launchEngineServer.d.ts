import { DendronEngineClient } from "@dendronhq/engine-server";
import { Socket } from "net";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
type CommandOutput = {
    port: number;
    server: any;
} & CommandCommonProps;
type CommandOpts = Required<Omit<CommandCLIOpts, keyof CommandCLIOnlyOpts>> & {
    server: any;
    serverSockets?: Set<Socket>;
} & CommandCommonProps;
type CommandCLIOnlyOpts = {
    /**
     *
     * Whether Dendron should write the port to the * {@link file | https://wiki.dendron.so/notes/446723ba-c310-4302-a651-df14ce6e002b.html#dendron-port-file }
     */
    noWritePort?: boolean;
};
type CommandCLIOpts = {
    port?: number;
    init?: boolean;
    wsRoot: string;
    /**
     * Fast boot mode for engine. Don't index
     */
    fast?: boolean;
} & CommandCLIOnlyOpts;
export { CommandCLIOpts as LaunchEngineServerCLIOpts };
export declare class LaunchEngineServerCommand extends CLICommand<CommandOpts, CommandOutput> {
    constructor();
    buildArgs(args: yargs.Argv<CommandCLIOpts>): void;
    enrichArgs(args: CommandCLIOpts): Promise<{
        data: {
            engine: DendronEngineClient;
            wsRoot: string;
            init: boolean;
            fast: boolean;
            vaults: string[];
            port: number;
            server: import("@dendronhq/api-server").Server;
            serverSockets: Set<Socket>;
            /**
             *
             * Whether Dendron should write the port to the * {@link file | https://wiki.dendron.so/notes/446723ba-c310-4302-a651-df14ce6e002b.html#dendron-port-file }
             */
            noWritePort?: boolean;
        };
    }>;
    execute(opts: CommandOpts): Promise<{
        port: number;
        server: any;
    }>;
}
