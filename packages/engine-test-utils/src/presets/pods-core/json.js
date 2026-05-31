"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../engine-server/utils");
const createJSONEntries = (jsonEntries, opts) => {
    const importDir = opts?.customRoot || (0, common_server_1.tmpDir)().name;
    const importSrc = path_1.default.join(importDir, "import.json");
    fs_extra_1.default.writeJSONSync(importSrc, jsonEntries);
    return importSrc;
};
const assertInNote = ({ vault, wsRoot, fname, match, nomatch, }) => {
    const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
    const importedNote = fs_extra_1.default.readFileSync(path_1.default.join(vpath, fname + ".md"), {
        encoding: "utf8",
    });
    return common_test_utils_1.AssertUtils.assertInString({ body: importedNote, match, nomatch });
};
const getImportPod = (extra) => {
    return extra.pod;
};
const IMPORT = {
    BASIC: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const { pod } = extra;
        const vault = vaults[0];
        const importSrc = createJSONEntries([
            {
                fname: "foo",
                body: "foo body 2",
            },
            {
                fname: "bar",
                body: "bar body",
            },
        ]);
        const config = {
            src: importSrc,
            concatenate: false,
            vaultName: common_all_1.VaultUtils.getName(vault),
        };
        await pod.execute({
            config,
            vaults,
            wsRoot,
            engine,
        });
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const importedNote = fs_extra_1.default.readFileSync(path_1.default.join(vpath, "foo.md"), {
            encoding: "utf8",
        });
        return [
            {
                actual: await common_test_utils_1.FileTestUtils.assertInVault({
                    vault,
                    wsRoot,
                    match: ["foo.md", "bar.md"],
                }),
                expected: true,
            },
            {
                actual: await common_test_utils_1.AssertUtils.assertInString({
                    body: importedNote,
                    match: ["foo body 2"],
                }),
                expected: true,
            },
        ];
    }),
    BASIC_W_STUBS: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const pod = getImportPod(extra);
        const vault = vaults[0];
        const importSrc = createJSONEntries([
            {
                fname: "baz.one",
            },
        ]);
        const config = {
            src: importSrc,
            concatenate: false,
            vaultName: common_all_1.VaultUtils.getName(vault),
        };
        await pod.execute({
            config,
            vaults,
            wsRoot,
            engine,
        });
        const note = (await engine.findNotes({
            fname: "baz",
            vault,
        }))[0];
        return [
            {
                actual: await common_test_utils_1.FileTestUtils.assertInVault({
                    vault,
                    wsRoot,
                    match: ["baz.one.md"],
                    nomatch: ["baz.md"],
                }),
                expected: true,
            },
            {
                actual: note?.stub,
                expected: true,
            },
        ];
    }),
    BASIC_W_REL_PATH: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const pod = getImportPod(extra);
        const vault = vaults[0];
        const importSrc = createJSONEntries([
            {
                fname: "foo",
            },
        ], { customRoot: wsRoot });
        const basename = path_1.default.basename(importSrc);
        const config = {
            src: `./${basename}`,
            concatenate: false,
            vaultName: common_all_1.VaultUtils.getName(vault),
        };
        await pod.execute({
            config,
            vaults,
            wsRoot,
            engine,
        });
        return [
            {
                actual: await common_test_utils_1.FileTestUtils.assertInVault({
                    vault,
                    wsRoot,
                    match: ["foo.md"],
                }),
                expected: true,
            },
        ];
    }),
    CONCATENATE: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const pod = getImportPod(extra);
        const vault = vaults[0];
        const importSrc = createJSONEntries([
            {
                fname: "foo",
                body: "foo body",
            },
            {
                fname: "bar",
                body: "bar body",
            },
        ]);
        const config = {
            src: importSrc,
            concatenate: true,
            destName: "results",
            vaultName: common_all_1.VaultUtils.getName(vault),
        };
        await pod.execute({
            config,
            vaults,
            wsRoot,
            engine,
        });
        return [
            {
                actual: await common_test_utils_1.FileTestUtils.assertInVault({
                    vault,
                    wsRoot,
                    match: ["results.md"],
                }),
                expected: true,
            },
            {
                actual: await assertInNote({
                    wsRoot,
                    vault,
                    fname: "results",
                    match: ["foo body", "bar body"],
                }),
                expected: true,
            },
        ];
    }),
    CONCATENATE_W_NO_DEST: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const pod = getImportPod(extra);
        const importSrc = createJSONEntries([
            {
                fname: "foo",
                body: "foo body",
            },
            {
                fname: "bar",
                body: "bar body",
            },
        ]);
        const vault = vaults[0];
        const config = {
            src: importSrc,
            vaultName: common_all_1.VaultUtils.getName(vault),
            concatenate: true,
        };
        try {
            await pod.execute({
                config,
                vaults,
                wsRoot,
                engine,
            });
        }
        catch (err) {
            return [];
        }
        throw new Error("bad test");
    }),
};
const genTestResultsForExportBasic = async (opts) => {
    const destPath = opts.extra.destPath;
    const importedNote = fs_extra_1.default.readFileSync(path_1.default.join(destPath), {
        encoding: "utf8",
    });
    return [
        {
            actual: await common_test_utils_1.AssertUtils.assertInString({
                body: importedNote,
                match: ["foo body", "bar body"],
            }),
            expected: true,
        },
        {
            actual: await common_test_utils_1.AssertUtils.assertInString({
                body: importedNote,
                match: ["foo body"],
            }),
            expected: true,
        },
    ];
};
const setupTestForExportBasic = async (opts) => {
    const { extra } = opts;
    const { pod } = extra;
    const destDir = (0, common_server_1.tmpDir)().name;
    const destPath = path_1.default.join(destDir, "export.json");
    const config = { dest: destPath };
    await pod.execute({
        ...opts,
        config,
    });
    return { destPath };
};
const EXPORT = {
    BASIC: new common_test_utils_1.TestPresetEntryV4(async function (opts) {
        const { destPath } = await this.setupTest(opts);
        return this.genTestResults({ ...opts, extra: { destPath } });
    }, {
        preSetupHook: utils_1.setupBasic,
        genTestResults: genTestResultsForExportBasic,
        setupTest: setupTestForExportBasic,
    }),
};
const JSON_TEST_PRESET = {
    EXPORT,
    IMPORT,
};
exports.default = JSON_TEST_PRESET;
//# sourceMappingURL=json.js.map