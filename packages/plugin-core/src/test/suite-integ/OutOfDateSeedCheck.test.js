"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const mocha_1 = require("mocha");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const sinon_1 = __importDefault(require("sinon"));
const Sync_1 = require("../../commands/Sync");
const common_all_1 = require("@dendronhq/common-all");
const TestSeedUtils_1 = require("../utils/TestSeedUtils");
suite("GIVEN out of date seed check", function () {
    (0, testUtilsV3_1.describeSingleWS)("WHEN there's a seed with an out-of-date path", {}, () => {
        const seedKey = "dendron.foo";
        let showMessage;
        (0, mocha_1.before)(async () => {
            const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const wsRoot = engine.wsRoot;
            // Create the seed and add it into the workspace
            const seedRoot = (0, common_server_1.tmpDir)().name;
            const testSeeds = await engine_test_utils_1.TestSeedUtils.createSeedRegistry({
                engine,
                wsRoot: seedRoot,
            });
            const seedService = new engine_server_1.SeedService({
                wsRoot,
                registryFile: testSeeds.registryFile,
            });
            showMessage = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "showMessage").resolves({
                title: Sync_1.UPDATE_SEED_CONFIG_PROMPT,
            });
            await TestSeedUtils_1.PluginTestSeedUtils.getFakedAddCommand(seedService).cmd.execute({
                seedId: "dendron.foo",
            });
            // Swap the seed registry stub with one where the seed path is modified
            const modifiedTestSeeds = await engine_test_utils_1.TestSeedUtils.createSeedRegistry({
                engine,
                wsRoot: seedRoot,
                modifySeed: (seed) => {
                    seed.root = common_all_1.FOLDERS.NOTES;
                    return seed;
                },
            });
            const modifiedSeedService = new engine_server_1.SeedService({
                wsRoot,
                registryFile: modifiedTestSeeds.registryFile,
            });
            sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "reloadWindow");
            await (0, Sync_1.detectOutOfDateSeeds)({ wsRoot, seedSvc: modifiedSeedService });
        });
        test("THEN Dendron prompts to update the seed config", () => {
            (0, testUtilsv2_1.expect)(showMessage.calledOnce).toBeTruthy();
        });
        test("THEN seed config is correctly updated", async () => {
            const wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
            const conf = common_server_1.DConfig.getRaw(wsRoot);
            const seed = common_all_1.ConfigUtils.getVaults(conf).find((vault) => vault.seed === seedKey);
            (0, testUtilsv2_1.expect)(seed?.fsPath).toEqual(common_all_1.FOLDERS.NOTES);
        });
    });
});
//# sourceMappingURL=OutOfDateSeedCheck.test.js.map