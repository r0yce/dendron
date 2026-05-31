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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkString = checkString;
exports.checkDir = checkDir;
exports.checkNotInDir = checkNotInDir;
exports.checkFile = checkFile;
exports.checkNotInString = checkNotInString;
exports.checkFileNoExpect = checkFileNoExpect;
exports.checkVaults = checkVaults;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
__exportStar(require("./git"), exports);
__exportStar(require("./seed"), exports);
__exportStar(require("./unified"), exports);
async function checkString(body, ...match) {
    return expect(await common_test_utils_1.AssertUtils.assertInString({
        body,
        match,
    })).toBeTruthy();
}
async function checkDir({ fpath, snapshot }, ...match) {
    const body = fs_extra_1.default.readdirSync(fpath).join(" ");
    if (snapshot) {
        expect(body).toMatchSnapshot();
    }
    return checkString(body, ...match);
}
async function checkNotInDir({ fpath, snapshot }, ...match) {
    const body = fs_extra_1.default.readdirSync(fpath).join(" ");
    if (snapshot) {
        expect(body).toMatchSnapshot();
    }
    return checkNotInString(body, ...match);
}
async function checkFile({ fpath, snapshot, nomatch, }, ...match) {
    const body = fs_extra_1.default.readFileSync(fpath, { encoding: "utf8" });
    if (snapshot) {
        expect(body).toMatchSnapshot();
    }
    await checkString(body, ...match);
    return !nomatch || (await checkNotInString(body, ...nomatch));
}
async function checkNotInString(body, ...nomatch) {
    expect(await common_test_utils_1.AssertUtils.assertInString({
        body,
        nomatch,
    })).toBeTruthy();
}
/** The regular version of this only works in engine tests. If the test has to run in the plugin too, use this version. Make sure to check the return value! */
async function checkFileNoExpect({ fpath, nomatch, match, }) {
    const body = await fs_extra_1.default.readFile(fpath, { encoding: "utf8" });
    return common_test_utils_1.AssertUtils.assertInString({ body, match, nomatch });
}
const getWorkspaceFolders = (wsRoot) => {
    const wsPath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_WS_NAME);
    const settings = fs_extra_1.default.readJSONSync(wsPath);
    return lodash_1.default.toArray(settings.folders);
};
async function checkVaults(opts, expect) {
    const { wsRoot, vaults } = opts;
    const configPath = common_server_1.DConfig.configPath(opts.wsRoot);
    const config = (0, common_server_1.readYAML)(configPath);
    const vaultsConfig = common_all_1.ConfigUtils.getVaults(config);
    expect(lodash_1.default.sortBy(vaultsConfig, ["fsPath", "workspace"])).toEqual(lodash_1.default.sortBy(vaults, ["fsPath", "workspace"]));
    if ((await engine_server_1.WorkspaceUtils.getWorkspaceTypeFromDir(wsRoot)) ===
        common_all_1.WorkspaceType.CODE) {
        const wsFolders = getWorkspaceFolders(wsRoot);
        expect(wsFolders).toEqual(vaults.map((ent) => {
            const out = {
                path: (0, common_all_1.normalizeUnixPath)(common_all_1.VaultUtils.getRelPath(ent)),
            };
            if (ent.name) {
                out.name = ent.name;
            }
            return out;
        }));
    }
}
//# sourceMappingURL=index.js.map