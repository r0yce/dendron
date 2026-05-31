"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_INFO_PRESETS = void 0;
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const NOTES = {
    BASIC: new common_test_utils_1.TestPresetEntryV4(async ({ engine }) => {
        const info = await engine.info();
        if (info.error) {
            throw Error();
        }
        return [
            {
                actual: lodash_1.default.isEmpty(info.data.version),
                expected: false,
            },
        ];
    }, {
        preSetupHook: async ({ vaults, wsRoot }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_SIMPLE.create({ wsRoot, vault: vaults[0] });
        },
    }),
};
exports.ENGINE_INFO_PRESETS = {
    NOTES,
};
//# sourceMappingURL=info.js.map