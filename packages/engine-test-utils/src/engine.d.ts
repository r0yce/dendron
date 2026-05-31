import { Server } from "@dendronhq/api-server";
import { DEngineClient, DVault, DWorkspace, DendronConfig, WorkspaceOpts, CleanDendronPublishingConfig } from "@dendronhq/common-all";
import { RunEngineTestFunctionOpts, RunEngineTestFunctionV4, SetupHookFunction, TestResult } from "@dendronhq/common-test-utils";
import { SinonStub } from "sinon";
export type ModConfigCb = (config: DendronConfig) => DendronConfig;
export type TestSetupWorkspaceOpts = {
    /**
     * Vaults to initialize engine with
     * Defaults to following if not set
     * [
     *    { fsPath: "vault1" },
     *    { fsPath: "vault2" },
     *    { fsPath: "vault3", name: "vaultThree" },
     *  ]
     */
    vaults?: DVault[];
    /**
     * Modify dendron config before initialization
     */
    modConfigCb?: ModConfigCb;
    git?: {
        initVaultWithRemote?: boolean;
        branchName?: string;
    };
};
export type AsyncCreateEngineFunction = (opts: WorkspaceOpts) => Promise<{
    engine: DEngineClient;
    port?: number;
    server?: Server;
}>;
/**
 * Create an {@link DendronEngine}
 */
export declare function createEngineFromEngine(opts: WorkspaceOpts): Promise<{
    engine: DEngineClient;
    port: undefined;
    server: undefined;
}>;
/**
 * Create an {@link DendronEngine}
 */
export declare function createEngineV3FromEngine(opts: WorkspaceOpts): Promise<{
    engine: DEngineClient;
    port: undefined;
    server: undefined;
}>;
export { DEngineClient, DVault, WorkspaceOpts };
/**
 * Create a server
 * @param opts
 * @returns
 */
export declare function createServer(opts: WorkspaceOpts & {
    port?: number;
}): Promise<{
    engine: import("@dendronhq/engine-server").DendronEngineClient;
    wsRoot: string;
    init: boolean;
    fast: boolean;
    vaults: string[];
    port: number;
    server: Server;
    serverSockets: Set<import("net").Socket>;
    noWritePort?: boolean;
}>;
/**
 * Create an {@link DendronEngineClient}
 */
export declare function createEngineFromServer(opts: WorkspaceOpts): Promise<any>;
export declare function createEngineByConnectingToDebugServer(opts: WorkspaceOpts): Promise<any>;
export declare function createPublishingConfig(opts: Partial<CleanDendronPublishingConfig> & Required<Pick<CleanDendronPublishingConfig, "siteRootDir" | "siteHierarchies">>): CleanDendronPublishingConfig;
/**
 *
 * @param opts.asRemote: add git repo
 * @param opts.wsRoot: override given wsRoot
 * @returns
 */
export declare function setupWS(opts: {
    vaults: DVault[];
    workspaces?: DWorkspace[];
    asRemote?: boolean;
    wsRoot?: string;
    modConfigCb?: ModConfigCb;
}): Promise<{
    wsRoot: string;
    vaults: DVault[];
}>;
export type RunEngineTestV5Opts = {
    preSetupHook?: SetupHookFunction;
    createEngine?: AsyncCreateEngineFunction;
    extra?: any;
    expect: any;
    workspaces?: DWorkspace[];
    setupOnly?: boolean;
    initGit?: boolean;
    initHooks?: boolean;
    addVSWorkspace?: boolean;
    /**
     * Path to preset wsRoot
     */
    wsRoot?: string;
} & TestSetupWorkspaceOpts;
export type RunEngineTestFunctionV5<T = any> = (opts: RunEngineTestFunctionOpts & {
    extra?: any;
    engineInitDuration: number;
    port?: number;
}) => Promise<TestResult[] | void | T>;
/**
 *
 * To create empty workspace, initilizae with `vaults = []`
 * See [[Run Engine Test|dendron://dendron.docs/pkg.engine-test-utils.ref.run-engine-test]]
 * @param func
 * @param opts.vaults: By default, initiate 3 vaults {vault1, vault2, (vault3, "vaultThree")}
 * @param opts.preSetupHook: By default, initiate empty
 * @param opts.wsRoot: Override the randomly generated test directory for the wsRoot
 * @returns
 */
export declare function runEngineTestV5(func: RunEngineTestFunctionV5, opts: RunEngineTestV5Opts): Promise<any>;
export declare function testWithEngine(prompt: string, func: RunEngineTestFunctionV4, opts?: Omit<RunEngineTestV5Opts, "expect"> & {
    only?: boolean;
}): Mocha.Test;
export declare class TestEngineUtils {
    static mockHomeDir(dir?: string): SinonStub;
    static vault1(vaults: DVault[]): DVault;
    static vault2(vaults: DVault[]): DVault;
    static vault3(vaults: DVault[]): DVault;
    /**
     * Sugar for creating a note in the first vault
     */
    static createNoteByFname({ fname, body, custom, vaults, wsRoot, }: {
        fname: string;
        body: string;
        custom?: any;
    } & WorkspaceOpts): Promise<import("@dendronhq/common-all").NoteProps>;
}
