import { NoteProps, RespV3, URI } from "@dendronhq/common-all";
import yargs from "yargs";
import { SetupEngineCLIOpts, SetupEngineResp } from "./utils";
export type PodCLIOpts = {
    podConfig?: URI;
    inlineConfig?: string[];
    configValues?: {
        [key: string]: any;
    };
    vault?: string;
    fname?: string;
    hierarchy?: string;
    podId?: string;
};
export type PodCommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;
export type PodCommandOpts<T = any> = PodCLIOpts & {
    config: T;
    payload: NoteProps[];
} & SetupEngineResp & SetupEngineCLIOpts;
export declare function setupPodArgs(args: yargs.Argv): void;
export declare function enrichPodArgs(args: PodCommandCLIOpts): Promise<RespV3<PodCommandOpts>>;
