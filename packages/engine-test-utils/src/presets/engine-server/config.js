"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_CONFIG_PRESETS = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const path_1 = __importDefault(require("path"));
function genDefaultConfig() {
    return common_all_1.ConfigUtils.genDefaultConfig();
}
const WRITE = {
    NEW_CONFIG: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot }) => {
        const config = genDefaultConfig();
        common_all_1.ConfigUtils.setPublishProp(config, "copyAssets", false);
        await common_server_1.DConfig.writeConfig({ wsRoot, config });
        const cpath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE);
        const configOnFile = (0, common_server_1.readYAML)(cpath);
        return [
            {
                actual: configOnFile,
                expected: config,
            },
        ];
    }),
};
const GET = {
    DEFAULT_CONFIG: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot }) => {
        const cpath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE);
        (0, common_server_1.writeYAML)(cpath, genDefaultConfig());
        const config = common_server_1.DConfig.readConfigSync(wsRoot);
        return [
            {
                actual: config,
                expected: genDefaultConfig(),
            },
        ];
    }),
};
exports.ENGINE_CONFIG_PRESETS = {
    WRITE,
    GET,
};
//# sourceMappingURL=config.js.map