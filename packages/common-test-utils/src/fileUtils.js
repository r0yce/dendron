"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTestUtils = void 0;
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
common_server_1.tmp.setGracefulCleanup();
class FileTestUtils {
    /**
     * Compare files in root with expected
     * @param root
     * @param expected
     * @param opts
     * @return [actualFiles, expectedFiles]
     */
    static cmpFiles = (root, expected, opts) => {
        const cleanOpts = lodash_1.default.defaults(opts, { add: [], remove: [], ignore: [] });
        const dirEnts = fs_extra_1.default
            .readdirSync(root)
            .filter((ent) => !lodash_1.default.includes(cleanOpts.ignore, ent));
        return [
            dirEnts.sort(),
            expected
                .concat(cleanOpts.add)
                .filter((ent) => {
                return !lodash_1.default.includes(cleanOpts?.remove, ent);
            })
                .sort(),
        ];
    };
    /**
     *
     * @param root
     * @param expected
     * @param opts
     * @returns true if expected and root are equal
     */
    static cmpFilesV2 = (root, expected, opts) => {
        const cleanOpts = lodash_1.default.defaults(opts, { add: [], remove: [], ignore: [] });
        const dirEnts = fs_extra_1.default
            .readdirSync(root)
            .filter((ent) => !lodash_1.default.includes(cleanOpts.ignore, ent));
        const allExpected = expected.concat(cleanOpts.add).filter((ent) => {
            return !lodash_1.default.includes(cleanOpts?.remove, ent);
        });
        const out = lodash_1.default.intersection(allExpected, dirEnts).length === allExpected.length;
        if (!out) {
            console.log({ dirEnts, allExpected });
        }
        return out;
    };
    static assertInFile = ({ fpath, match, nomatch, }) => {
        const body = fs_extra_1.default.readFileSync(fpath, { encoding: "utf8" });
        return utils_1.AssertUtils.assertInString({ body, match, nomatch });
    };
    static assertTimesInFile = ({ fpath, match, fewerThan, moreThan, }) => {
        const body = fs_extra_1.default.readFileSync(fpath, { encoding: "utf8" });
        return utils_1.AssertUtils.assertTimesInString({
            body,
            match,
            fewerThan,
            moreThan,
        });
    };
    static assertInVault = ({ vault, wsRoot, match, nomatch, }) => {
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const body = fs_extra_1.default.readdirSync(vpath).join("\n");
        return utils_1.AssertUtils.assertInString({ body, match, nomatch });
    };
    static async createFiles(root, files) {
        return Promise.all(lodash_1.default.map(files, async (ent) => {
            const fpath = path_1.default.join(root, ent.path);
            await fs_extra_1.default.ensureFile(fpath);
            if (ent.body) {
                fs_extra_1.default.writeFileSync(fpath, ent.body, { encoding: "utf8" });
            }
        }));
    }
    static getPkgRoot(base, fname) {
        fname = fname || "package.json";
        let acc = 10;
        const lvls = [];
        while (acc > 0) {
            const tryPath = path_1.default.join(base, ...lvls, fname);
            if (fs_extra_1.default.existsSync(tryPath)) {
                return path_1.default.dirname(tryPath);
            }
            acc -= 1;
            lvls.push("..");
        }
        throw Error(`no root found from ${base}`);
    }
    static tmpDir() {
        const dirPath = common_server_1.tmp.dirSync();
        return dirPath;
    }
}
exports.FileTestUtils = FileTestUtils;
//# sourceMappingURL=fileUtils.js.map