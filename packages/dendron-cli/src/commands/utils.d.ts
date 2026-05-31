import { Server } from "@dendronhq/api-server";
import { DEngineClient, EngineConnectorTarget } from "@dendronhq/engine-server";
import { Socket } from "net";
import yargs from "yargs";
import { LaunchEngineServerCLIOpts } from "./launchEngineServer";
export type SetupEngineCLIOpts = {
    enginePort?: number;
    useLocalEngine?: boolean;
    attach?: boolean;
    target?: EngineConnectorTarget;
    newEngine?: boolean;
} & LaunchEngineServerCLIOpts;
export type SetupEngineResp = {
    wsRoot: string;
    engine: DEngineClient;
    port: number;
    server: Server;
    serverSockets?: Set<Socket>;
};
export type SetupEngineOpts = {
    wsRoot: string;
    engine: DEngineClient;
    port?: number;
    server: any;
};
/**
 * Setup an engine based on CLI args
 */
export declare function setupEngine(opts: SetupEngineCLIOpts): Promise<SetupEngineResp>;
/**
 * Add yargs based options to setup engine
 */
export declare function setupEngineArgs(args: yargs.Argv): void;
