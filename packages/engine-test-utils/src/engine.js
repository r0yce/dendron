"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEngineUtils = void 0;
exports.createEngineFromEngine = createEngineFromEngine;
exports.createEngineV3FromEngine = createEngineV3FromEngine;
exports.createServer = createServer;
exports.createEngineFromServer = createEngineFromServer;
exports.createEngineByConnectingToDebugServer = createEngineByConnectingToDebugServer;
exports.createPublishingConfig = createPublishingConfig;
exports.setupWS = setupWS;
exports.runEngineTestV5 = runEngineTestV5;
exports.testWithEngine = testWithEngine;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const dendron_cli_1 = require("@dendronhq/dendron-cli");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const presets_1 = require("./presets");
const utils_1 = require("./utils");
/**
 * Create an {@link DendronEngine}
 */
async function createEngineFromEngine(opts) {
    return {
        engine: (0, engine_server_1.createEngine)(opts),
        port: undefined,
        server: undefined,
    };
}
/**
 * Create an {@link DendronEngine}
 */
async function createEngineV3FromEngine(opts) {
    return {
        engine: (0, engine_server_1.createEngineV3)(opts),
        port: undefined,
        server: undefined,
    };
}
/**
 * Create a server
 * @param opts
 * @returns
 */
async function createServer(opts) {
    return (await new dendron_cli_1.LaunchEngineServerCommand().enrichArgs({
        wsRoot: opts.wsRoot,
        port: opts.port,
    })).data;
}
/**
 * Create an {@link DendronEngineClient}
 */
async function createEngineFromServer(opts) {
    const { engine, port, server } = await createServer(opts);
    return { engine, port, server };
}
async function createEngineByConnectingToDebugServer(opts) {
    // debug port used by launch:engine-server:debug
    const port = 3005;
    const { engine, server } = await createServer({ ...opts, port });
    return { engine, port, server };
}
function createPublishingConfig(opts) {
    const defaultPublishingConfig = (0, common_all_1.genDefaultPublishingConfig)();
    const copts = {
        ...defaultPublishingConfig,
        ...opts,
        siteUrl: "https://localhost:8080",
    };
    return {
        ...copts,
        siteIndex: common_server_1.DConfig.getSiteIndex(copts),
    };
}
/**
 *
 * @param opts.asRemote: add git repo
 * @param opts.wsRoot: override given wsRoot
 * @returns
 */
async function setupWS(opts) {
    const wsRoot = opts.wsRoot || (0, common_server_1.tmpDir)().name;
    const ws = new engine_server_1.WorkspaceService({ wsRoot });
    ws.createConfig();
    // create dendron.code-workspace
    engine_server_1.WorkspaceConfig.write(wsRoot, opts.vaults);
    let config = ws.config;
    let vaults = await Promise.all(opts.vaults.map(async (vault) => {
        await ws.createVault({ vault, config, updateConfig: false });
        return vault;
    }));
    const vaultsConfig = common_all_1.ConfigUtils.getVaults(config);
    const sortedVaultsConfig = lodash_1.default.sortBy(vaultsConfig, "fsPath");
    common_all_1.ConfigUtils.setVaults(config, sortedVaultsConfig);
    const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
    if (publishingConfig.duplicateNoteBehavior) {
        const sortedPayload = publishingConfig.duplicateNoteBehavior.payload.sort();
        const updatedDuplicateNoteBehavior = publishingConfig.duplicateNoteBehavior;
        updatedDuplicateNoteBehavior.payload = sortedPayload;
        common_all_1.ConfigUtils.setDuplicateNoteBehavior(config, updatedDuplicateNoteBehavior);
    }
    if (opts.modConfigCb)
        config = opts.modConfigCb(config);
    await ws.setConfig(config);
    if (opts.workspaces) {
        const vaultsFromWs = await lodash_1.default.reduce(opts.workspaces, async (resp, ent) => {
            await resp;
            await engine_server_1.WorkspaceService.createWorkspace({
                wsRoot: path_1.default.join(wsRoot, ent.name),
                additionalVaults: ent.vaults,
            });
            return ws.addWorkspace({ workspace: ent });
        }, Promise.resolve({ vaults: [] }));
        vaults = vaults.concat(vaultsFromWs.vaults);
    }
    if (opts.asRemote) {
        await utils_1.GitTestUtils.createRepoWithReadme(wsRoot);
    }
    return { wsRoot, vaults };
}
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
async function runEngineTestV5(func, opts) {
    const { preSetupHook, extra, vaults: vaultsInit, createEngine, initGit, workspaces, addVSWorkspace, git, } = lodash_1.default.defaults(opts, {
        preSetupHook: async () => { },
        postSetupHook: async () => { },
        createEngine: createEngineV3FromEngine,
        extra: {},
        // third vault has diff name
        vaults: [
            { fsPath: "vault1" },
            { fsPath: "vault2" },
            { fsPath: "vault3", name: "vaultThree" },
        ],
        addVSWorkspace: false,
    });
    let homeDirStub;
    let server;
    try {
        // --- begin ws setup
        // make sure tests don't overwrite local homedir contents
        homeDirStub = TestEngineUtils.mockHomeDir();
        const { wsRoot, vaults } = await setupWS({
            vaults: vaultsInit,
            workspaces,
            wsRoot: opts.wsRoot,
            modConfigCb: opts.modConfigCb,
        });
        if ((opts.initHooks, vaults)) {
            fs_extra_1.default.ensureDirSync(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_HOOKS_BASE));
        }
        if (addVSWorkspace) {
            fs_extra_1.default.writeJSONSync(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_WS_NAME), {
                folders: vaults.map((ent) => ({
                    path: ent.fsPath,
                    name: ent.name,
                })),
                settings: {},
                extensions: {},
            }, { spaces: 4 });
        }
        // --- begin engine setup
        await preSetupHook({ wsRoot, vaults });
        const resp = await createEngine({ wsRoot, vaults });
        const engine = resp.engine;
        server = resp.server;
        const start = process.hrtime();
        const initResp = await engine.init();
        const engineInitDuration = (0, common_server_1.getDurationMilliseconds)(start);
        const testOpts = {
            wsRoot,
            vaults,
            engine,
            initResp,
            port: resp.port,
            extra,
            config: engine,
            engineInitDuration,
        };
        if (initGit) {
            await utils_1.GitTestUtils.createRepoForWorkspace(wsRoot);
            await Promise.all(vaults.map((vault) => {
                return utils_1.GitTestUtils.createRepoWithReadme((0, common_server_1.vault2Path)({ vault, wsRoot }), { remote: git?.initVaultWithRemote, branchName: git?.branchName });
            }));
        }
        if (opts.setupOnly) {
            return testOpts;
        }
        const results = (await func(testOpts)) || [];
        await (0, common_test_utils_1.runJestHarnessV2)(results, expect);
        return { opts: testOpts, resp: undefined, wsRoot };
    }
    finally {
        // restore sinon so other tests can keep running
        if (homeDirStub) {
            homeDirStub.restore();
        }
        if (server) {
            server.close();
        }
    }
}
function testWithEngine(prompt, func, opts) {
    if (opts?.only) {
        return test.only(prompt, async () => {
            await runEngineTestV5(func, {
                preSetupHook: presets_1.ENGINE_HOOKS.setupBasic,
                ...opts,
                expect,
            });
        });
    }
    else {
        return test(prompt, async () => {
            await runEngineTestV5(func, {
                preSetupHook: presets_1.ENGINE_HOOKS.setupBasic,
                ...opts,
                expect,
            });
        });
    }
}
class TestEngineUtils {
    static mockHomeDir(dir) {
        if (lodash_1.default.isUndefined(dir))
            dir = (0, common_server_1.tmpDir)().name;
        return sinon_1.default.stub(os_1.default, "homedir").returns(dir);
    }
    static vault1(vaults) {
        return lodash_1.default.find(vaults, { fsPath: "vault1" });
    }
    static vault2(vaults) {
        return lodash_1.default.find(vaults, { fsPath: "vault2" });
    }
    static vault3(vaults) {
        return lodash_1.default.find(vaults, { fsPath: "vault3" });
    }
    /**
     * Sugar for creating a note in the first vault
     */
    static createNoteByFname({ fname, body = "", custom, vaults, wsRoot, }) {
        const vault = vaults[0];
        return common_test_utils_1.NoteTestUtilsV4.createNote({ wsRoot, vault, fname, body, custom });
    }
}
exports.TestEngineUtils = TestEngineUtils;
//# sourceMappingURL=engine.js.map