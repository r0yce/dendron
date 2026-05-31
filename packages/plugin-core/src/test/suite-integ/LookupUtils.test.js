"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const engine_server_1 = require("@dendronhq/engine-server");
const utils_1 = require("../../components/lookup/utils");
const logger_1 = require("../../logger");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const sinon_1 = __importDefault(require("sinon"));
const lodash_1 = __importDefault(require("lodash"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const NoteLookupProviderUtils_1 = require("../../components/lookup/NoteLookupProviderUtils");
function setupNotesForTest({ wsRoot, vaults, vault1, vault2, vault3, }) {
    if (vault1) {
        (0, common_all_1.asyncLoopOneAtATime)(vault1, async (str) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                wsRoot,
                fname: str,
                body: "",
                genRandomId: true,
            });
        });
    }
    if (vault2) {
        (0, common_all_1.asyncLoopOneAtATime)(vault2, async (str) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault2(vaults),
                wsRoot,
                fname: str,
                body: "",
                genRandomId: true,
            });
        });
    }
    if (vault3) {
        (0, common_all_1.asyncLoopOneAtATime)(vault3, async (str) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                vault: engine_test_utils_1.TestEngineUtils.vault3(vaults),
                wsRoot,
                fname: str,
                body: "",
                genRandomId: true,
            });
        });
    }
}
/**
 * Tests the Vault Recommendation For New Notes Functionality in Utils
 */
suite("Lookup Utils Test", function runSuite() {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    (0, mocha_1.describe)("single", () => {
        test("no hierarchy matches; context only", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    setupNotesForTest({ wsRoot, vaults, vault1: ["alpha"] });
                },
                onInit: async ({ engine, vaults }) => {
                    const vaultCtx = vaults[0];
                    const recs = await utils_1.PickerUtilsV2.getVaultRecommendations({
                        vault: vaultCtx,
                        vaults,
                        engine,
                        fname: "hello",
                    });
                    (0, testUtilsv2_1.expect)(recs.length === 3);
                    (0, testUtilsv2_1.expect)(recs[0].vault.fsPath).toEqual(vaultCtx.fsPath);
                    (0, testUtilsv2_1.expect)(recs[0].detail).toEqual(utils_1.CONTEXT_DETAIL);
                    done();
                },
            });
        });
        test("single hierarchy match and same context", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    setupNotesForTest({ wsRoot, vaults, vault1: ["alpha"] });
                },
                onInit: async ({ engine, vaults }) => {
                    const vaultCtx = vaults[0];
                    const recs = await utils_1.PickerUtilsV2.getVaultRecommendations({
                        vault: vaultCtx,
                        vaults,
                        engine,
                        fname: "alpha.one",
                    });
                    (0, testUtilsv2_1.expect)(recs.length === 1);
                    (0, testUtilsv2_1.expect)(recs[0].vault.fsPath).toEqual(vaultCtx.fsPath);
                    (0, testUtilsv2_1.expect)(recs[0].detail).toEqual(utils_1.FULL_MATCH_DETAIL);
                    done();
                },
            });
        });
        test("single hierarchy match and different context", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    setupNotesForTest({ wsRoot, vaults, vault1: ["alpha"] });
                },
                onInit: async ({ engine, vaults }) => {
                    const vaultCtx = vaults[1];
                    const recs = await utils_1.PickerUtilsV2.getVaultRecommendations({
                        vault: vaultCtx,
                        vaults,
                        engine,
                        fname: "alpha.one",
                    });
                    (0, testUtilsv2_1.expect)(recs.length === 3);
                    (0, testUtilsv2_1.expect)(recs[0].vault.fsPath).toEqual(vaults[0].fsPath);
                    (0, testUtilsv2_1.expect)(recs[0].detail).toEqual(utils_1.HIERARCHY_MATCH_DETAIL);
                    (0, testUtilsv2_1.expect)(recs[1].vault.fsPath).toEqual(vaultCtx.fsPath);
                    (0, testUtilsv2_1.expect)(recs[1].detail).toEqual(utils_1.CONTEXT_DETAIL);
                    done();
                },
            });
        });
        test("multiple hierarchy matches with matching context", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    setupNotesForTest({
                        wsRoot,
                        vaults,
                        vault1: ["alpha"],
                        vault2: ["alpha"],
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const vaultCtx = vaults[0];
                    const recs = await utils_1.PickerUtilsV2.getVaultRecommendations({
                        vault: vaultCtx,
                        vaults,
                        engine,
                        fname: "alpha.one",
                    });
                    (0, testUtilsv2_1.expect)(recs.length).toEqual(3);
                    (0, testUtilsv2_1.expect)(recs[0].vault.fsPath).toEqual(vaultCtx.fsPath);
                    (0, testUtilsv2_1.expect)(recs[0].detail).toEqual(utils_1.FULL_MATCH_DETAIL);
                    (0, testUtilsv2_1.expect)(recs[0].label).toEqual(common_all_1.VaultUtils.getName(vaultCtx));
                    (0, testUtilsv2_1.expect)(recs[1].vault.fsPath).toEqual(vaults[1].fsPath);
                    (0, testUtilsv2_1.expect)(recs[1].detail).toEqual(utils_1.HIERARCHY_MATCH_DETAIL);
                    (0, testUtilsv2_1.expect)(recs[1].label).toEqual(common_all_1.VaultUtils.getName(vaults[1]));
                    (0, testUtilsv2_1.expect)(recs[2].vault.fsPath).toEqual(vaults[2].fsPath);
                    (0, testUtilsv2_1.expect)(recs[2].detail).toBeFalsy();
                    done();
                },
            });
        });
        test("multiple hierarchy matches with different context", (done) => {
            (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                ctx,
                preSetupHook: async ({ wsRoot, vaults }) => {
                    setupNotesForTest({
                        wsRoot,
                        vaults,
                        vault1: ["alpha"],
                        vault2: ["alpha"],
                    });
                },
                onInit: async ({ engine, vaults }) => {
                    const vaultCtx = vaults[2];
                    const recs = await utils_1.PickerUtilsV2.getVaultRecommendations({
                        vault: vaultCtx,
                        vaults,
                        engine,
                        fname: "alpha.one",
                    });
                    (0, testUtilsv2_1.expect)(recs.length === 3);
                    (0, testUtilsv2_1.expect)(recs[0].vault.fsPath).toEqual(vaults[0].fsPath);
                    (0, testUtilsv2_1.expect)(recs[0].detail).toEqual(utils_1.HIERARCHY_MATCH_DETAIL);
                    (0, testUtilsv2_1.expect)(recs[1].vault.fsPath).toEqual(vaults[1].fsPath);
                    (0, testUtilsv2_1.expect)(recs[1].detail).toEqual(utils_1.HIERARCHY_MATCH_DETAIL);
                    (0, testUtilsv2_1.expect)(recs[2].vault.fsPath).toEqual(vaultCtx.fsPath);
                    (0, testUtilsv2_1.expect)(recs[2].detail).toEqual(utils_1.CONTEXT_DETAIL);
                    done();
                },
            });
        });
    });
    (0, mocha_1.describe)("getVaultRecommendations", () => {
        (0, mocha_1.describe)("GIVEN vaults with same fsPath", () => {
            test("THEN correctly outputs all vaults", (done) => {
                (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
                    ctx,
                    preSetupHook: async ({ wsRoot, vaults }) => {
                        engine_test_utils_1.ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
                    },
                    onInit: async ({ engine, vaults }) => {
                        sinon_1.default.stub(engine, "vaults").value([
                            ...engine.vaults,
                            {
                                fsPath: "vault3",
                                name: "anotherVaultThree",
                            },
                        ]);
                        const out = await utils_1.PickerUtilsV2.getVaultRecommendations({
                            vault: vaults[1],
                            vaults,
                            engine,
                            fname: "foo",
                        });
                        const vaultsWithSameFSPath = out.filter((item) => {
                            return item.vault.fsPath === "vault3";
                        });
                        (0, testUtilsv2_1.expect)(vaultsWithSameFSPath.length).toEqual(2);
                        sinon_1.default.restore();
                        done();
                    },
                });
            });
        });
    });
});
function createTestLookupController(lookupCreateOpts) {
    return ExtensionProvider_1.ExtensionProvider.getExtension().lookupControllerFactory.create(lookupCreateOpts);
}
suite("NoteLookupProviderUtils", function () {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {});
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a subscription to provider id foo", {
        ctx,
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        let lookupCreateOpts;
        let provider;
        let showOpts;
        this.beforeEach(() => {
            lookupCreateOpts = {
                nodeType: "note",
            };
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            provider = extension.noteLookupProviderFactory.create("foo", {
                allowNewNote: true,
            });
            showOpts = {
                title: "foo",
                placeholder: "foo",
                provider,
                initialValue: "foo",
            };
            sinon_1.default.stub(utils_1.PickerUtilsV2, "hasNextPicker").returns(false);
        });
        this.afterEach(() => {
            sinon_1.default.restore();
        });
        (0, mocha_1.describe)("WHEN event.done", () => {
            test("THEN returns bare event if onDone callback isn't specified", async () => {
                const controller = createTestLookupController(lookupCreateOpts);
                controller.show({
                    ...showOpts,
                    nonInteractive: true,
                });
                const result = await NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                    id: "foo",
                    controller,
                    logger: logger_1.Logger,
                });
                (0, testUtilsv2_1.expect)(result.source).toEqual("lookupProvider");
                (0, testUtilsv2_1.expect)(result.action).toEqual("done");
                controller.onHide();
            });
            test("THEN returns onDone callback output if onDone is specificed", async () => {
                const controller = createTestLookupController(lookupCreateOpts);
                controller.show({
                    ...showOpts,
                    nonInteractive: true,
                });
                const result = await NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                    id: "foo",
                    controller,
                    logger: logger_1.Logger,
                    onDone: () => {
                        return { foo: "custom onDone" };
                    },
                });
                (0, testUtilsv2_1.expect)(result.foo).toEqual("custom onDone");
                controller.onHide();
            });
        });
        (0, mocha_1.describe)("WHEN event.error", async () => {
            const dummyHook = async () => {
                return {
                    error: new common_all_1.DendronError({ message: "foo error" }),
                };
            };
            test("THEN returns undefined in onError is not specified", async () => {
                const controller = createTestLookupController(lookupCreateOpts);
                provider.registerOnAcceptHook(dummyHook);
                controller.show({
                    ...showOpts,
                    nonInteractive: true,
                });
                const result = await NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                    id: "foo",
                    controller,
                    logger: logger_1.Logger,
                });
                (0, testUtilsv2_1.expect)(lodash_1.default.isUndefined(result)).toBeTruthy();
                controller.onHide();
            });
            test("THEN returns onError callback output if onError is specified", async () => {
                const controller = createTestLookupController(lookupCreateOpts);
                provider.registerOnAcceptHook(dummyHook);
                controller.show({
                    ...showOpts,
                    nonInteractive: true,
                });
                const result = await NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                    id: "foo",
                    controller,
                    logger: logger_1.Logger,
                    onError: () => {
                        return { foo: "custom onError" };
                    },
                });
                (0, testUtilsv2_1.expect)(result.foo).toEqual("custom onError");
                controller.onHide();
            });
        });
        (0, mocha_1.describe)("WHEN event.changeState", () => {
            test("THEN onChangeState callback output is returned if onChangeState is provided", (done) => {
                const controller = createTestLookupController(lookupCreateOpts);
                controller.show({
                    ...showOpts,
                    nonInteractive: false,
                });
                const result = NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                    id: "foo",
                    controller,
                    logger: logger_1.Logger,
                    onChangeState: () => {
                        return { foo: "custom onChangeState" };
                    },
                });
                setTimeout(async () => {
                    engine_server_1.HistoryService.instance().add({
                        source: "lookupProvider",
                        action: "changeState",
                        id: "foo",
                        data: { action: "hide" },
                    });
                    (0, testUtilsv2_1.expect)((await result).foo).toEqual("custom onChangeState");
                    controller.onHide();
                    done();
                }, 1000);
            });
            (0, mocha_1.describe)("AND action.hide", () => {
                test("THEN onHide callback output is returned if onHide is provided", (done) => {
                    const controller = createTestLookupController(lookupCreateOpts);
                    controller.show({
                        ...showOpts,
                        nonInteractive: false,
                    });
                    const result = NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                        id: "foo",
                        controller,
                        logger: logger_1.Logger,
                        onHide: () => {
                            return { foo: "custom onHide" };
                        },
                    });
                    setTimeout(async () => {
                        controller.quickPick.hide();
                        (0, testUtilsv2_1.expect)((await result).foo).toEqual("custom onHide");
                        controller.onHide();
                        done();
                    }, 1000);
                });
            });
        });
    });
});
//# sourceMappingURL=LookupUtils.test.js.map