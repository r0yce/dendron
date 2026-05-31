"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSeedUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const dendron_cli_1 = require("@dendronhq/dendron-cli");
const engine_server_1 = require("@dendronhq/engine-server");
const path_1 = __importDefault(require("path"));
const git_1 = require("./git");
class TestSeedUtils {
    static defaultSeedId = () => {
        return "dendron.foo";
    };
    static async addSeed2WS({ wsRoot, engine, modifySeed, }) {
        const { registryFile } = await this.createSeedRegistry({
            engine,
            wsRoot,
            modifySeed,
        });
        const id = this.defaultSeedId();
        const seedService = new engine_server_1.SeedService({ wsRoot, registryFile });
        await seedService.addSeed({ id });
    }
    static async createSeedRegistry(opts) {
        let config = await this.createSeed(opts);
        const id = engine_server_1.SeedUtils.getSeedId(config);
        const root = (0, common_server_1.tmpDir)().name;
        const registryFile = path_1.default.join(root, "reg.yml");
        if (opts.modifySeed) {
            config = opts.modifySeed(config);
        }
        const seedDict = { [id]: config };
        (0, common_server_1.writeYAML)(registryFile, seedDict);
        return { registryFile, seedDict };
    }
    static async createSeed(opts) {
        const cli = new dendron_cli_1.SeedCLICommand();
        const cmd = common_all_1.SeedCommands.INIT;
        const id = this.defaultSeedId();
        const seed = {
            id: "dendron.foo",
            description: "",
            license: "",
            name: "foo",
            publisher: "dendron",
            repository: {
                type: "git",
                url: `file://${opts.wsRoot}`,
            },
            root: "vault",
        };
        await cli.execute({
            cmd,
            id,
            server: {},
            config: seed,
            mode: engine_server_1.SeedInitMode.CREATE_WORKSPACE,
            ...opts,
        });
        try {
            await git_1.GitTestUtils.addRepoToWorkspace(opts.wsRoot);
            // eslint-disable-next-line no-empty
        }
        catch (err) { }
        return seed;
    }
}
exports.TestSeedUtils = TestSeedUtils;
//# sourceMappingURL=seed.js.map