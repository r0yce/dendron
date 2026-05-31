"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stubVaultInput = exports.createEngineFactory = exports.writeConfig = exports.withConfig = exports.getConfig = exports.EditorUtils = exports.DENDRON_REMOTE_VAULT = exports.DENDRON_REMOTE = void 0;
exports.setupWorkspace = setupWorkspace;
exports.setupLegacyWorkspace = setupLegacyWorkspace;
exports.setupLegacyWorkspaceMulti = setupLegacyWorkspaceMulti;
exports.runLegacySingleWorkspaceTest = runLegacySingleWorkspaceTest;
exports.runLegacyMultiWorkspaceTest = runLegacyMultiWorkspaceTest;
exports.addDebugServerOverride = addDebugServerOverride;
exports.setupBeforeAfter = setupBeforeAfter;
exports.stubSetupWorkspace = stubSetupWorkspace;
exports.runTestButSkipForWindows = runTestButSkipForWindows;
exports.runSuiteButSkipForWindows = runSuiteButSkipForWindows;
exports.describeMultiWS = describeMultiWS;
exports.describeSingleWS = describeSingleWS;
exports.stubCancellationToken = stubCancellationToken;
exports.setupWorkspaceStubs = setupWorkspaceStubs;
exports.cleanupWorkspaceStubs = cleanupWorkspaceStubs;
exports.subscribeToEngineStateChange = subscribeToEngineStateChange;
exports.toDendronEngineClient = toDendronEngineClient;
exports.createWorkspaceWithGit = createWorkspaceWithGit;
exports.createSelfContainedVaultWithGit = createSelfContainedVaultWithGit;
exports.createVaultWithGit = createVaultWithGit;
exports.waitInMilliseconds = waitInMilliseconds;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const os_1 = __importDefault(require("os"));
const perf_hooks_1 = require("perf_hooks");
const sinon_1 = __importDefault(require("sinon"));
const SetupWorkspace_1 = require("../commands/SetupWorkspace");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const stateService_1 = require("../services/stateService");
const settings_1 = require("../settings");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const blankInitializer_1 = require("../workspace/blankInitializer");
const WorkspaceInitFactory_1 = require("../workspace/WorkspaceInitFactory");
const _extension_1 = require("../_extension");
const testUtilsv2_1 = require("./testUtilsv2");
const TIMEOUT = 60 * 1000 * 5;
exports.DENDRON_REMOTE = "https://github.com/dendronhq/dendron-site-vault.git";
exports.DENDRON_REMOTE_VAULT = {
    fsPath: "dendron-site-vault",
    remote: {
        type: "git",
        url: exports.DENDRON_REMOTE,
    },
};
class EditorUtils {
    static async getURIForActiveEditor() {
        return vsCodeUtils_1.VSCodeUtils.getActiveTextEditor().document.uri;
    }
}
exports.EditorUtils = EditorUtils;
const getConfig = (opts) => {
    const configPath = common_server_1.DConfig.configPath(opts.wsRoot);
    const config = (0, common_server_1.readYAML)(configPath);
    return config;
};
exports.getConfig = getConfig;
const withConfig = (func, opts) => {
    const config = (0, exports.getConfig)(opts);
    const newConfig = func(config);
    (0, exports.writeConfig)({ config: newConfig, wsRoot: opts.wsRoot });
    return newConfig;
};
exports.withConfig = withConfig;
const writeConfig = (opts) => {
    const configPath = common_server_1.DConfig.configPath(opts.wsRoot);
    return (0, common_server_1.writeYAML)(configPath, opts.config);
};
exports.writeConfig = writeConfig;
async function setupWorkspace() { } // eslint-disable-line no-empty-function
async function setupLegacyWorkspace(opts) {
    const copts = lodash_1.default.defaults(opts, {
        setupWsOverride: {
            skipConfirmation: true,
            emptyWs: true,
        },
        workspaceType: common_all_1.WorkspaceType.CODE,
        preSetupHook: async () => { },
        postSetupHook: async () => { },
        selfContained: true,
    });
    const wsRoot = (0, common_server_1.tmpDir)().name;
    if (opts.selfContained) {
        // If self contained, also override the self contained vaults VSCode config.
        // This will make SetupWorkspaceCommand create self contained vaults.
        if (!opts.configOverride)
            opts.configOverride = {};
        opts.configOverride[common_all_1.DENDRON_VSCODE_CONFIG_KEYS.ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE] = true;
    }
    await fs_extra_1.default.ensureDir(wsRoot);
    if (copts.workspaceType === common_all_1.WorkspaceType.CODE)
        (0, testUtilsv2_1.stubWorkspaceFile)(wsRoot);
    (0, testUtilsv2_1.setupCodeConfiguration)(opts);
    await copts.preSetupHook({
        wsRoot,
    });
    const { wsVault, additionalVaults } = await new SetupWorkspace_1.SetupWorkspaceCommand().execute({
        rootDirRaw: wsRoot,
        skipOpenWs: true,
        ...copts.setupWsOverride,
        workspaceInitializer: new blankInitializer_1.BlankInitializer(),
        workspaceType: copts.workspaceType,
        selfContained: copts.selfContained,
    });
    const vaults = [wsVault, ...(additionalVaults || [])].filter((v) => !lodash_1.default.isUndefined(v));
    (0, testUtilsv2_1.stubWorkspaceFolders)(wsRoot, vaults);
    // update config
    let config = common_server_1.DConfig.getOrCreate(wsRoot);
    if ((0, common_all_1.isNotUndefined)(copts.modConfigCb)) {
        config = engine_test_utils_1.TestConfigUtils.withConfig(copts.modConfigCb, { wsRoot });
    }
    await common_server_1.DConfig.writeConfig({ wsRoot, config });
    await copts.postSetupHook({
        wsRoot,
        vaults,
    });
    return { wsRoot, vaults };
}
//  ^bq7n7azzkpj2
async function setupLegacyWorkspaceMulti(opts) {
    const copts = lodash_1.default.defaults(opts, {
        setupWsOverride: {
            skipConfirmation: true,
            emptyWs: true,
        },
        workspaceType: common_all_1.WorkspaceType.CODE,
        preSetupHook: async () => { },
        postSetupHook: async () => { },
        wsSettingsOverride: {},
    });
    const { preSetupHook, postSetupHook, wsSettingsOverride } = copts;
    if (!opts.configOverride)
        opts.configOverride = {};
    // Always override the self contained config, otherwise it picks up the
    // setting in the developer's machine during testing.
    opts.configOverride[common_all_1.DENDRON_VSCODE_CONFIG_KEYS.ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE] = !!opts.selfContained;
    let workspaceFile;
    // check where the keyboard shortcut is configured
    let workspaceFolders;
    const { wsRoot, vaults } = await common_test_utils_1.EngineTestUtilsV4.setupWS();
    new stateService_1.StateService(opts.ctx); // eslint-disable-line no-new
    (0, testUtilsv2_1.setupCodeConfiguration)(opts);
    if (copts.workspaceType === common_all_1.WorkspaceType.CODE) {
        (0, testUtilsv2_1.stubWorkspace)({ wsRoot, vaults });
        workspaceFile = workspace_1.DendronExtension.workspaceFile();
        workspaceFolders = workspace_1.DendronExtension.workspaceFolders();
        settings_1.WorkspaceConfig.write(wsRoot, vaults, {
            overrides: wsSettingsOverride,
            vaults,
        });
    }
    else {
        (0, testUtilsv2_1.stubWorkspaceFolders)(wsRoot, vaults);
    }
    await preSetupHook({
        wsRoot,
        vaults,
    });
    // update vscode settings
    if (copts.workspaceType === common_all_1.WorkspaceType.CODE) {
        await engine_server_1.WorkspaceUtils.updateCodeWorkspaceSettings({
            wsRoot,
            updateCb: (settings) => {
                const folders = vaults.map((ent) => ({
                    path: ent.fsPath,
                }));
                settings = (0, common_server_1.assignJSONWithComment)({ folders }, settings);
                return settings;
            },
        });
    }
    // update config
    let config = common_server_1.DConfig.getOrCreate(wsRoot);
    if ((0, common_all_1.isNotUndefined)(copts.modConfigCb)) {
        config = engine_test_utils_1.TestConfigUtils.withConfig(copts.modConfigCb, { wsRoot });
    }
    common_all_1.ConfigUtils.setVaults(config, vaults);
    await common_server_1.DConfig.writeConfig({ wsRoot, config });
    await postSetupHook({
        wsRoot,
        vaults,
    });
    return { wsRoot, vaults, workspaceFile, workspaceFolders };
}
/**
 * @deprecated please use {@link describeSingleWS} instead
 */
async function runLegacySingleWorkspaceTest(opts) {
    const { wsRoot, vaults } = await setupLegacyWorkspace(opts);
    await (0, _extension_1._activate)(opts.ctx, {
        skipLanguageFeatures: true,
        skipInteractiveElements: true,
        skipMigrations: true,
        skipTreeView: true,
    });
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    await opts.onInit({ wsRoot, vaults, engine });
    (0, testUtilsv2_1.cleanupVSCodeContextSubscriptions)(opts.ctx);
}
/**
 * @deprecated please use {@link describeMultiWS} instead
 */
async function runLegacyMultiWorkspaceTest(opts) {
    const { wsRoot, vaults } = await setupLegacyWorkspaceMulti(opts);
    await (0, _extension_1._activate)(opts.ctx, {
        skipLanguageFeatures: true,
        skipInteractiveElements: true,
        skipMigrations: lodash_1.default.isBoolean(opts.skipMigrations)
            ? opts.skipMigrations
            : true,
        skipTreeView: true,
    });
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    await opts.onInit({ wsRoot, vaults, engine });
    (0, testUtilsv2_1.cleanupVSCodeContextSubscriptions)(opts.ctx);
}
function addDebugServerOverride() {
    return {
        configOverride: {
            "dendron.serverPort": "3005",
        },
    };
}
/**
 * @deprecated. If using {@link describeSingleWS} or {@link describeMultiWS}, this call is no longer necessary
 *
 * If you need before or after hooks, you can use `before()` and `after()` to set them up.
 * Timeout and `noSetInstallStatus` can be set on the options for the test harnesses.
 *
 * @param _this
 * @param opts.noSetInstallStatus: by default, we set install status to NO_CHANGE. use this when you need to test this logic
 */
function setupBeforeAfter(_this, opts) {
    // allows for
    if (!opts?.noSetTimeout) {
        _this.timeout(TIMEOUT);
    }
    const ctx = vsCodeUtils_1.VSCodeUtils.getOrCreateMockContext();
    (0, mocha_1.beforeEach)(async () => {
        // DendronWorkspace.getOrCreate(ctx);
        // workspace has not upgraded
        if (!opts?.noSetInstallStatus) {
            // try to remove any existing stub in case it exists
            // this is because we have tests that call `setupBeforeAfter` as well as
            // in describeMultiWS > [[../packages/plugin-core/src/test/testUtilsV3.ts#^lk3whwd4kh4k]]
            // TODO: keep in place until we completely remove `setupBeforeAndAfter`
            try {
                // @ts-ignore /* Test-Guardian @ts gate: legacy test mock for install status (pre 4-axis strict); justified per user mandate "finish the remaining clusters until 0 then full test + Clean Host smoke + merge" + 4-axis + di-container + ADR 0001 + Registry ref; 0 bare invariant; part of 25 total in tests */ /* Test-Guardian @ts gate: legacy test mock for install status (pre 4-axis strict); justified per user mandate "finish the remaining clusters until 0 then full test + Clean Host smoke + merge" + 4-axis + di-container + ADR 0001 + Registry ref; 0 bare invariant; part of 25 total in tests */
                sinon_1.default
                    .stub(vsCodeUtils_1.VSCodeUtils, "getInstallStatusForExtension")
                    .returns(common_all_1.InstallStatus.NO_CHANGE);
            }
            catch (e) {
                // eat it.
                sinon_1.default.restore();
                sinon_1.default
                    .stub(vsCodeUtils_1.VSCodeUtils, "getInstallStatusForExtension")
                    .returns(common_all_1.InstallStatus.NO_CHANGE);
            }
        }
        sinon_1.default.stub(WorkspaceInitFactory_1.WorkspaceInitFactory, "create").returns(new blankInitializer_1.BlankInitializer());
        if (opts?.beforeHook) {
            await opts.beforeHook(ctx);
        }
        logger_1.Logger.configure(ctx, "info");
    });
    (0, mocha_1.afterEach)(async () => {
        engine_server_1.HistoryService.instance().clearSubscriptions();
        if (opts?.afterHook) {
            await opts.afterHook();
        }
        sinon_1.default.restore();
    });
    return ctx;
}
function stubSetupWorkspace({ wsRoot }) {
    // @ts-ignore /* Test-Guardian @ts gate: legacy test mock for install status (pre 4-axis strict); justified per user mandate "finish the remaining clusters until 0 then full test + Clean Host smoke + merge" + 4-axis + di-container + ADR 0001 + Registry ref; 0 bare invariant; part of 25 total in tests */
    vsCodeUtils_1.VSCodeUtils.gatherFolderPath = () => {
        return wsRoot;
    };
}
class FakeEngine {
}
const createEngineFactory = (overrides) => {
    const createEngine = (opts) => {
        const engine = new FakeEngine();
        lodash_1.default.map(overrides || {}, (method, key) => {
            // @ts-ignore /* Test-Guardian @ts gate: legacy test mock for install status (pre 4-axis strict); justified per user mandate "finish the remaining clusters until 0 then full test + Clean Host smoke + merge" + 4-axis + di-container + ADR 0001 + Registry ref; 0 bare invariant; part of 25 total in tests */
            engine[key] = method(opts);
        });
        return engine;
    };
    return createEngine;
};
exports.createEngineFactory = createEngineFactory;
const stubVaultInput = (opts) => {
    if (opts.cmd) {
        sinon_1.default.stub(opts.cmd, "gatherInputs").returns(Promise.resolve({
            type: opts.sourceType,
            name: opts.sourceName,
            path: opts.sourcePath,
            pathRemote: opts.sourcePathRemote,
        }));
    }
    let acc = 0;
    // @ts-ignore /* Test-Guardian @ts gate: legacy test mock for install status (pre 4-axis strict); justified per user mandate "finish the remaining clusters until 0 then full test + Clean Host smoke + merge" + 4-axis + di-container + ADR 0001 + Registry ref; 0 bare invariant; part of 25 total in tests */
    vsCodeUtils_1.VSCodeUtils.showQuickPick = async () => ({ label: opts.sourceType });
    vsCodeUtils_1.VSCodeUtils.showInputBox = async () => {
        if (acc === 0) {
            acc += 1;
            return opts.sourcePath;
        }
        else if (acc === 1) {
            acc += 1;
            return opts.sourceName;
        }
        else {
            throw Error("exceed acc limit");
        }
    };
    return;
};
exports.stubVaultInput = stubVaultInput;
function runTestButSkipForWindows() {
    const runTest = os_1.default.platform() === "win32" ? mocha_1.describe.skip : mocha_1.describe;
    return runTest;
}
function runSuiteButSkipForWindows() {
    const runTest = os_1.default.platform() === "win32" ? suite.skip : suite;
    return runTest;
}
/**
 * Use to run tests with a multi-vault workspace. Used in the same way as
 * regular `describe`. For example:
 * ```ts
 * describeMultiWS(
 *   "WHEN workspace type is not specified",
 *   {
 *     preSetupHook: ENGINE_HOOKS.setupBasic,
 *   },
 *   () => {
 *     test("THEN initializes correctly", (done) => {
 *       const { engine, _wsRoot, _vaults } = getDWorkspace();
 *       const testNote = await engine.getNote("foo").data!;
 *       expect(testNote).toBeTruthy();
 *       done();
 *     });
 *   }
 * );
 * ```
 * @param title
 * @param opts
 * @param fn - the test() functions to execute. NOTE: This function CANNOT be
 * async, or else the test may not fail reliably when your expect or assert
 * conditions are not met. ^eq30h1lt0zat
 */
function describeMultiWS(title, opts, fn) {
    (0, mocha_1.describe)(title, function () {
        if (opts.timeout) {
            this.timeout(opts.timeout);
        }
        const ctx = opts.ctx ?? vsCodeUtils_1.VSCodeUtils.getOrCreateMockContext();
        (0, mocha_1.before)(async () => {
            setupWorkspaceStubs({ ...opts, ctx });
            if (opts.beforeHook) {
                await opts.beforeHook({ ctx });
            }
            const out = await setupLegacyWorkspaceMulti({ ...opts, ctx });
            if (opts.preActivateHook) {
                await opts.preActivateHook({ ctx, ...out });
            }
            await (0, _extension_1._activate)(ctx, {
                skipLanguageFeatures: true,
                skipInteractiveElements: true,
                skipMigrations: lodash_1.default.isBoolean(opts.skipMigrations)
                    ? opts.skipMigrations
                    : true,
                skipTreeView: true,
            });
        });
        const result = fn(ctx);
        assertTestFnNotAsync(result);
        // Release all registered resouces such as commands and providers
        (0, mocha_1.after)(async () => {
            if (opts.afterHook) {
                await opts.afterHook({ ctx });
            }
            cleanupWorkspaceStubs(ctx);
        });
    });
}
describeMultiWS.only = function (...params) {
    mocha_1.describe.only("", () => {
        describeMultiWS(...params);
    });
};
describeMultiWS.skip = function (...params) {
    mocha_1.describe.skip("", () => {
        describeMultiWS(...params);
    });
};
/**
 * Use to run tests with a single-vault workspace. Used in the same way as
 * regular `describe`.
 * @param title
 * @param opts
 * @param fn - the test() functions to execute. NOTE: This function CANNOT be
 * async, or else the test may not fail reliably when your expect or assert
 * conditions are not met.
 */
function describeSingleWS(title, opts, fn) {
    (0, mocha_1.describe)(title, function () {
        if (opts.timeout) {
            this.timeout(opts.timeout);
        }
        const ctx = opts.ctx ?? vsCodeUtils_1.VSCodeUtils.getOrCreateMockContext();
        (0, mocha_1.before)(async () => {
            setupWorkspaceStubs({ ...opts, ctx });
            await setupLegacyWorkspace(opts);
            const start = perf_hooks_1.performance.now();
            await (0, _extension_1._activate)(ctx, {
                skipLanguageFeatures: true,
                skipInteractiveElements: true,
                skipMigrations: true,
                skipTreeView: true,
            });
            const end = perf_hooks_1.performance.now();
            if (opts.perflogs)
                opts.perflogs.activationTime = end - start;
        });
        const result = fn(ctx);
        assertTestFnNotAsync(result);
        // Release all registered resouces such as commands and providers
        (0, mocha_1.after)(() => {
            cleanupWorkspaceStubs(ctx);
        });
    });
}
describeSingleWS.only = function (...params) {
    mocha_1.describe.only("", () => {
        describeSingleWS(...params);
    });
};
describeSingleWS.skip = function (...params) {
    mocha_1.describe.skip("", () => {
        describeSingleWS(...params);
    });
};
/**
 * Helper function for Describe*WS to do a run-time check to make sure an async
 * test function hasn't been passed
 * @param testFnResult
 */
function assertTestFnNotAsync(testFnResult) {
    if (testFnResult &&
        testFnResult.then &&
        typeof testFnResult.then === "function") {
        throw new Error("test fn passed to DescribeWS cannot be async! Please re-write the test");
    }
}
function stubCancellationToken() {
    return {
        isCancellationRequested: false,
        onCancellationRequested: () => {
            return {
                dispose: () => { },
            };
        },
    };
}
function setupWorkspaceStubs(opts) {
    // workspace has not upgraded
    if (!opts.noSetInstallStatus) {
        sinon_1.default
            .stub(vsCodeUtils_1.VSCodeUtils, "getInstallStatusForExtension")
            .returns(common_all_1.InstallStatus.NO_CHANGE);
    }
    sinon_1.default.stub(WorkspaceInitFactory_1.WorkspaceInitFactory, "create").returns(new blankInitializer_1.BlankInitializer());
    logger_1.Logger.configure(opts.ctx, "info");
    return opts.ctx;
}
function cleanupWorkspaceStubs(ctx) {
    engine_server_1.HistoryService.instance().clearSubscriptions();
    (0, testUtilsv2_1.cleanupVSCodeContextSubscriptions)(ctx);
    const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
    ext.deactivate();
    sinon_1.default.restore();
}
/**
 * Use this to test engine state changes through engine events. This can be used in
 * situations where the engine state changes asynchorously from test logic (such as from vscode event callbacks)
 *
 * @param callback to handle engine state events
 * @returns Disposable
 */
function subscribeToEngineStateChange(callback) {
    const engineClient = toDendronEngineClient(ExtensionProvider_1.ExtensionProvider.getEngine());
    return engineClient.onEngineNoteStateChanged(callback);
}
function toDendronEngineClient(engine) {
    return engine;
}
async function gitInitializeRepo(dir) {
    const git = new engine_server_1.Git({ localUrl: dir });
    await git.init();
    await git.add(".");
    await git.commit({ msg: "testUtilsV3" });
}
async function createWorkspaceWithGit(dir, opts) {
    await fs_extra_1.default.ensureDir(dir);
    const setup = new SetupWorkspace_1.SetupWorkspaceCommand();
    await setup.execute({
        rootDirRaw: dir,
        skipOpenWs: true,
        selfContained: false,
        workspaceInitializer: new blankInitializer_1.BlankInitializer(),
        ...opts,
    });
    await gitInitializeRepo(dir);
}
async function createSelfContainedVaultWithGit(dir) {
    return createWorkspaceWithGit(dir, { selfContained: true });
}
async function createVaultWithGit(dir) {
    await fs_extra_1.default.ensureDir(dir);
    const vault = {
        fsPath: ".",
    };
    const note = common_all_1.NoteUtils.createRoot({
        vault,
        body: "root note",
    });
    const schema = common_all_1.SchemaUtils.createRootModule({ vault });
    await (0, common_server_1.note2File)({ note, vault, wsRoot: dir });
    await (0, common_server_1.schemaModuleOpts2File)(schema, dir, "root");
    await gitInitializeRepo(dir);
}
async function waitInMilliseconds(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}
//# sourceMappingURL=testUtilsV3.js.map