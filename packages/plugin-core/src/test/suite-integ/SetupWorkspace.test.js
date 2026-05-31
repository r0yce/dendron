"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const luxon_1 = require("luxon");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const SetupWorkspace_1 = require("../../commands/SetupWorkspace");
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const stateService_1 = require("../../services/stateService");
const analytics_1 = require("../../utils/analytics");
const StartupPrompts_1 = require("../../utils/StartupPrompts");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const workspace_1 = require("../../workspace");
const blankInitializer_1 = require("../../workspace/blankInitializer");
const templateInitializer_1 = require("../../workspace/templateInitializer");
const _extension_1 = require("../../_extension");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const utils_1 = require("../utils");
function lapsedMessageTest({ done, firstInstall, firstWsInitialize, lapsedUserMsgSendTime, shouldDisplayMessage, workspaceActivated = false, }) {
    const svc = engine_server_1.MetadataService.instance();
    svc.setMeta("firstInstall", firstInstall);
    svc.setMeta("firstWsInitialize", firstWsInitialize);
    svc.setMeta("lapsedUserMsgSendTime", lapsedUserMsgSendTime);
    svc.setMeta("dendronWorkspaceActivated", workspaceActivated);
    (0, testUtilsv2_1.expect)(StartupPrompts_1.StartupPrompts.shouldDisplayLapsedUserMsg()).toEqual(shouldDisplayMessage);
    done();
}
suite("GIVEN SetupWorkspace Command", function () {
    let homeDirStub;
    let userConfigDirStub;
    let wsFoldersStub;
    this.timeout(6 * 1000);
    let ctx;
    (0, mocha_1.beforeEach)(async () => {
        ctx = vsCodeUtils_1.VSCodeUtils.getOrCreateMockContext();
        // Required for StateService Singleton Init at the moment.
        // eslint-disable-next-line no-new
        new stateService_1.StateService({
            globalState: ctx.globalState,
            workspaceState: ctx.workspaceState,
        });
        await (0, testUtilsv2_1.resetCodeWorkspace)();
        homeDirStub = engine_test_utils_1.TestEngineUtils.mockHomeDir();
        userConfigDirStub = utils_1.VSCodeTestUtils.mockUserConfigDir();
        wsFoldersStub = utils_1.VSCodeTestUtils.stubWSFolders(undefined);
    });
    (0, mocha_1.afterEach)(() => {
        homeDirStub.restore();
        userConfigDirStub.restore();
        wsFoldersStub.restore();
    });
    (0, mocha_1.describe)("WHEN initializing a CODE workspace", function () {
        this.timeout(6 * 1000);
        (0, mocha_1.describe)("AND workspace has not been set up yet", () => {
            test("THEN Dendon does not activate", async () => {
                const resp = await (0, _extension_1._activate)(ctx, { skipInteractiveElements: true });
                (0, testUtilsv2_1.expect)(resp).toBeFalsy();
                const dendronState = engine_server_1.MetadataService.instance().getMeta();
                (0, testUtilsv2_1.expect)((0, common_all_1.isNotUndefined)(dendronState.firstInstall)).toBeTruthy();
                (0, testUtilsv2_1.expect)((0, common_all_1.isNotUndefined)(dendronState.firstWsInitialize)).toBeFalsy();
            });
        });
        (0, mocha_1.describe)("AND a new workspace is being created", () => {
            test("THEN Dendron creates the workspace correctly", async () => {
                const wsRoot = (0, common_server_1.tmpDir)().name;
                engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.normal);
                const active = await (0, _extension_1._activate)(ctx);
                // Not active yet, because there is no workspace
                (0, testUtilsv2_1.expect)(active).toBeFalsy();
                (0, testUtilsV3_1.stubSetupWorkspace)({
                    wsRoot,
                });
                const cmd = new SetupWorkspace_1.SetupWorkspaceCommand();
                await cmd.execute({
                    rootDirRaw: wsRoot,
                    skipOpenWs: true,
                    skipConfirmation: true,
                    workspaceInitializer: new blankInitializer_1.BlankInitializer(),
                    selfContained: false,
                });
                const resp = await (0, common_server_1.readYAMLAsync)(path_1.default.join(wsRoot, "dendron.yml"));
                (0, testUtilsv2_1.expect)(resp).toEqual(utils_1.WorkspaceTestUtils.generateDefaultConfig({
                    vaults: [{ fsPath: "vault" }],
                    duplicateNoteBehavior: {
                        action: "useVault",
                        payload: ["vault"],
                    },
                }));
                const dendronState = engine_server_1.MetadataService.instance().getMeta();
                (0, testUtilsv2_1.expect)((0, common_all_1.isNotUndefined)(dendronState.firstInstall)).toBeTruthy();
                (0, testUtilsv2_1.expect)((0, common_all_1.isNotUndefined)(dendronState.firstWsInitialize)).toBeTruthy();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.readdir(path_1.default.join(wsRoot, constants_1.DEFAULT_LEGACY_VAULT_NAME))).toEqual((0, testUtilsv2_1.genEmptyWSFiles)());
            });
        });
        (0, mocha_1.describe)("AND a new workspace is being created with a template initializer", () => {
            test("setup with template initializer", async () => {
                const wsRoot = (0, common_server_1.tmpDir)().name;
                engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.normal);
                const out = await (0, _extension_1._activate)(ctx);
                // Not active yet, because there is no workspace
                (0, testUtilsv2_1.expect)(out).toBeFalsy();
                (0, testUtilsV3_1.stubSetupWorkspace)({
                    wsRoot,
                });
                const cmd = new SetupWorkspace_1.SetupWorkspaceCommand();
                await cmd.execute({
                    rootDirRaw: wsRoot,
                    skipOpenWs: true,
                    skipConfirmation: true,
                    workspaceInitializer: new templateInitializer_1.TemplateInitializer(),
                    selfContained: false,
                });
                const resp = await (0, common_server_1.readYAMLAsync)(path_1.default.join(wsRoot, "dendron.yml"));
                (0, testUtilsv2_1.expect)(resp).toContain({
                    workspace: {
                        vaults: [
                            {
                                fsPath: "templates",
                                name: "dendron.templates",
                                seed: "dendron.templates",
                            },
                            {
                                fsPath: "vault",
                            },
                        ],
                        seeds: {
                            "dendron.templates": {},
                        },
                    },
                });
                const dendronState = engine_server_1.MetadataService.instance().getMeta();
                (0, testUtilsv2_1.expect)((0, common_all_1.isNotUndefined)(dendronState.firstInstall)).toBeTruthy();
                (0, testUtilsv2_1.expect)((0, common_all_1.isNotUndefined)(dendronState.firstWsInitialize)).toBeTruthy();
                (0, testUtilsv2_1.expect)(await fs_extra_1.default.readdir(path_1.default.join(wsRoot, constants_1.DEFAULT_LEGACY_VAULT_NAME))).toEqual((0, testUtilsv2_1.genEmptyWSFiles)());
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN a workspace exists", {
            preSetupHook: async () => {
                workspace_1.DendronExtension.version = () => "0.0.1";
            },
            selfContained: false,
        }, () => {
            test("THEN Dendron initializes", async () => {
                const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                // check for meta
                const fpath = (0, engine_server_1.getWSMetaFilePath)({ wsRoot });
                const meta = (0, engine_server_1.openWSMetaFile)({ fpath });
                (0, testUtilsv2_1.expect)(meta.version).toEqual("0.0.1");
                (0, testUtilsv2_1.expect)(meta.activationTime < common_all_1.Time.now().toMillis()).toBeTruthy();
                const notes = await engine.findNotesMeta({ excludeStub: true });
                (0, testUtilsv2_1.expect)(notes.length).toEqual(1);
                const vault = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]));
                const settings = fs_extra_1.default.readJSONSync(path_1.default.join(wsRoot, "dendron.code-workspace"));
                (0, testUtilsv2_1.expect)(settings).toEqual((0, testUtilsv2_1.genDefaultSettings)());
                (0, testUtilsv2_1.expect)(fs_extra_1.default.readdirSync(vault)).toEqual([common_all_1.CONSTANTS.DENDRON_CACHE_FILE].concat((0, testUtilsv2_1.genEmptyWSFiles)()));
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN a workspace exists, but it is missing the root.schema.yml", {
            postSetupHook: async ({ vaults, wsRoot }) => {
                const vault = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]));
                fs_extra_1.default.removeSync(path_1.default.join(vault, "root.schema.yml"));
            },
            selfContained: false,
        }, () => {
            // Question mark because I'm not sure what this test is actually testing for.
            test("THEN it still initializes?", async () => {
                const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]));
                (0, testUtilsv2_1.expect)(fs_extra_1.default.readdirSync(vault)).toEqual([common_all_1.CONSTANTS.DENDRON_CACHE_FILE].concat((0, testUtilsv2_1.genEmptyWSFiles)()));
            });
        });
        (0, mocha_1.describe)("test conditions for displaying lapsed user message", () => {
            test("Workspace Not Initialized; Message Never Sent; > 1 Day ago", (done) => {
                lapsedMessageTest({
                    done,
                    firstInstall: common_all_1.Time.now()
                        .minus(luxon_1.Duration.fromObject({ hours: 28 }))
                        .toSeconds(),
                    shouldDisplayMessage: true,
                });
            });
            test("Workspace Not Initialized; Message Never Sent; < 1 Day ago", (done) => {
                lapsedMessageTest({
                    done,
                    firstInstall: common_all_1.Time.now()
                        .minus(luxon_1.Duration.fromObject({ hours: 23 }))
                        .toSeconds(),
                    shouldDisplayMessage: false,
                });
            });
            test("Workspace Not Initialized; Message Sent < 1 week ago", (done) => {
                lapsedMessageTest({
                    done,
                    firstInstall: 1,
                    lapsedUserMsgSendTime: common_all_1.Time.now().toSeconds(),
                    shouldDisplayMessage: false,
                });
            });
            test("Workspace Not Initialized; Message Sent > 1 week ago", (done) => {
                lapsedMessageTest({
                    done,
                    firstInstall: 1,
                    lapsedUserMsgSendTime: 1,
                    shouldDisplayMessage: true,
                });
            });
            test("Workspace Already Initialized", (done) => {
                lapsedMessageTest({
                    done,
                    firstInstall: 1,
                    firstWsInitialize: 1,
                    shouldDisplayMessage: false,
                });
            });
        });
        (0, mocha_1.describe)("firstWeekSinceInstall", () => {
            (0, mocha_1.describe)("GIVEN first week", () => {
                test("THEN isFirstWeek is true", (done) => {
                    const svc = engine_server_1.MetadataService.instance();
                    svc.setInitialInstall();
                    const actual = analytics_1.AnalyticsUtils.isFirstWeek();
                    (0, testUtilsv2_1.expect)(actual).toBeTruthy();
                    done();
                });
            });
            (0, mocha_1.describe)("GIVEN not first week", () => {
                test("THEN isFirstWeek is false", (done) => {
                    const svc = engine_server_1.MetadataService.instance();
                    const ONE_WEEK = 604800;
                    const NOW = common_all_1.Time.now().toSeconds();
                    const TWO_WEEKS_BEFORE = NOW - 2 * ONE_WEEK;
                    svc.setMeta("firstInstall", TWO_WEEKS_BEFORE);
                    const actual = analytics_1.AnalyticsUtils.isFirstWeek();
                    (0, testUtilsv2_1.expect)(actual).toBeFalsy();
                    done();
                });
            });
        });
    });
    (0, mocha_1.describe)("WHEN initializing a NATIVE workspace", function () {
        this.timeout(6 * 1000);
        test("not active, initial create ws", async () => {
            const wsRoot = (0, common_server_1.tmpDir)().name;
            engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.normal);
            const out = await (0, _extension_1._activate)(ctx);
            // Shouldn't have activated because there is no workspace yet
            (0, testUtilsv2_1.expect)(out).toBeFalsy();
            (0, testUtilsV3_1.stubSetupWorkspace)({
                wsRoot,
            });
            const cmd = new SetupWorkspace_1.SetupWorkspaceCommand();
            await cmd.execute({
                workspaceType: common_all_1.WorkspaceType.NATIVE,
                rootDirRaw: wsRoot,
                skipOpenWs: true,
                skipConfirmation: true,
                workspaceInitializer: new blankInitializer_1.BlankInitializer(),
                selfContained: false,
            });
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))).toBeTruthy();
            (0, testUtilsv2_1.expect)(await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_WS_NAME))).toBeFalsy();
        });
    });
    (0, mocha_1.describe)("WHEN initializing a self contained vault as a workspace", () => {
        test("THEN Dendron correctly creates a workspace", async () => {
            const wsRoot = (0, common_server_1.tmpDir)().name;
            engine_server_1.MetadataService.instance().setActivationContext(engine_server_1.WorkspaceActivationContext.normal);
            const out = await (0, _extension_1._activate)(ctx);
            // Shouldn't have activated because there is no workspace yet
            (0, testUtilsv2_1.expect)(out).toBeFalsy();
            (0, testUtilsV3_1.stubSetupWorkspace)({
                wsRoot,
            });
            const cmd = new SetupWorkspace_1.SetupWorkspaceCommand();
            await cmd.execute({
                workspaceType: common_all_1.WorkspaceType.CODE,
                rootDirRaw: wsRoot,
                skipOpenWs: true,
                skipConfirmation: true,
                workspaceInitializer: new blankInitializer_1.BlankInitializer(),
                selfContained: true,
            });
            const firstFile = await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE));
            (0, testUtilsv2_1.expect)(firstFile).toBeTruthy();
            const secondFile = await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_WS_NAME));
            (0, testUtilsv2_1.expect)(secondFile).toBeTruthy();
        });
    });
});
//# sourceMappingURL=SetupWorkspace.test.js.map