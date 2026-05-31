"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const CopyNoteURL_1 = require("../../commands/CopyNoteURL");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const WSUtils_1 = require("../../WSUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const ROOT_URL = "https://dendron.so";
const ASSET_PREFIX = "aprefix";
function setupConfig(config) {
    config = common_all_1.ConfigUtils.genDefaultConfig();
    config.publishing.siteUrl = ROOT_URL;
    return config;
}
suite("GIVEN CopyNoteUrlV2", function () {
    const modConfigCb = setupConfig;
    (0, mocha_1.describe)("AND WHEN has selection", () => {
        (0, testUtilsV3_1.describeMultiWS)("WHEN selection with block anchor", {
            modConfigCb,
            timeout: 4e3,
            postSetupHook: async (opts) => {
                const { vaults, wsRoot } = opts;
                const vault = vaults[0];
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.create({
                    wsRoot,
                    vault,
                });
            },
        }, () => {
            (0, mocha_1.test)("THEN create link with block anchor", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const fname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_BLOCK_ANCHOR_TARGET.fname;
                const editor = await WSUtils_1.WSUtils.openNoteByPath({ vault, fname });
                editor.selection = new vscode.Selection(10, 0, 10, 5);
                const link = await new CopyNoteURL_1.CopyNoteURLCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).execute();
                const url = [ROOT_URL, "notes", `${fname}#^block-id`].join("/");
                (0, testUtilsv2_1.expect)(link).toEqual(url);
            });
        });
        (0, testUtilsV3_1.describeMultiWS)("WHEN selection with header anchor", {
            modConfigCb,
            timeout: 4e3,
            postSetupHook: async (opts) => {
                const { vaults, wsRoot } = opts;
                const vault = vaults[0];
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
                await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
                    wsRoot,
                    vault,
                });
            },
        }, () => {
            (0, mocha_1.test)("THEN create link with header anchor", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const fname = common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.fname;
                const editor = await WSUtils_1.WSUtils.openNoteByPath({ vault, fname });
                editor.selection = new vscode.Selection(7, 0, 7, 12);
                const link = await new CopyNoteURL_1.CopyNoteURLCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).run();
                const url = [ROOT_URL, "notes", `${fname}#h1`].join("/");
                (0, testUtilsv2_1.expect)(link).toEqual(url);
            });
        });
    });
    (0, mocha_1.describe)("AND WHEN regular copy", () => {
        (0, testUtilsV3_1.describeMultiWS)("", {
            modConfigCb,
            timeout: 4e3,
            postSetupHook: async (opts) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
            },
        }, () => {
            (0, mocha_1.test)("THEN create regular link", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const fname = "foo";
                await WSUtils_1.WSUtils.openNoteByPath({ vault, fname });
                const link = await new CopyNoteURL_1.CopyNoteURLCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).execute();
                const url = lodash_1.default.join([ROOT_URL, "notes", `${fname}`], "/");
                (0, testUtilsv2_1.expect)(link).toEqual(url);
            });
        });
    });
    (0, mocha_1.describe)("AND WHEN asset prefix set", () => {
        (0, testUtilsV3_1.describeMultiWS)("", {
            timeout: 4e3,
            modConfigCb: (config) => {
                config = setupConfig(config);
                config.publishing.assetsPrefix = "/" + ASSET_PREFIX;
                return config;
            },
            postSetupHook: async (opts) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic(opts);
            },
        }, () => {
            (0, mocha_1.test)("THEN create link with prefix", async () => {
                const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const vault = vaults[0];
                const fname = "foo";
                await WSUtils_1.WSUtils.openNoteByPath({ vault, fname });
                const link = await new CopyNoteURL_1.CopyNoteURLCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).execute();
                const url = lodash_1.default.join([ROOT_URL, ASSET_PREFIX, "notes", `${fname}`], "/");
                (0, testUtilsv2_1.expect)(link).toEqual(url);
            });
        });
    });
});
//# sourceMappingURL=CopyNoteUrl.test.js.map