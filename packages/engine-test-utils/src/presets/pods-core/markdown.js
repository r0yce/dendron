"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_server_1 = require("@dendronhq/common-server");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const IMPORT = {
    ROOT_WITH_MULT_FOLDERS: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const { pod } = extra;
        const importSrc = (0, common_server_1.tmpDir)().name;
        await common_test_utils_1.FileTestUtils.createFiles(importSrc, [
            { path: "foo.jpg" },
            { path: "project/p2/n1.md" },
            { path: "project/p1/n1.md" },
            { path: "project/p1/n2.md" },
            { path: "project/p1/.DS_STORE_TEST" },
            { path: "project/p1/n3.pdf" },
            { path: "project/p1/n1.pdf" },
            { path: "project/p1/n1.pdf" },
            { path: "project/p.3/n1.md" },
        ]);
        await pod.execute({
            config: {
                src: importSrc,
                concatenate: false,
            },
            engine,
            vaults,
            wsRoot,
        });
        const vpath = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
        let [actualFiles, expectedFiles] = common_test_utils_1.FileTestUtils.cmpFiles(vpath, [
            "assets",
            "project.p1.md",
            "project.p1.n1.md",
            "project.p1.n2.md",
            "project.p2.n1.md",
            "project.p-3.n1.md",
            "root.schema.yml",
            "root.md",
        ]);
        const body = fs_extra_1.default.readFileSync(path_1.default.join(vpath, "project.p1.md"), {
            encoding: "utf8",
        });
        const out = await common_test_utils_1.AssertUtils.assertInString({
            body,
            match: ["n1.pdf", "n3.pdf"],
            nomatch: [],
        });
        return [
            // right files are returned
            {
                expected: expectedFiles,
                actual: actualFiles,
            },
            // pdfs are attached inline
            { expected: out, actual: true },
            // there should be 3 assets
            {
                expected: 3,
                actual: fs_extra_1.default.readdirSync(path_1.default.join(vpath, "assets")).length,
            },
        ];
    }),
    SPECIAL_CHARS: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const { pod } = extra;
        const importSrc = (0, common_server_1.tmpDir)().name;
        await common_test_utils_1.FileTestUtils.createFiles(importSrc, [
            // spaces
            { path: "project/p2/n 1.md" },
            // symbols
            { path: "project/p1/n~1.md" },
            { path: "project/p 1/n2.md" },
            { path: "project/p1/.DS_STORE_TEST" },
            { path: "project/p1/n3.pdf" },
            { path: "project/p1/n1.pdf" },
            { path: "project/p1/n1.pdf" },
            { path: "project/p.3/n1.md" },
        ]);
        await pod.execute({
            config: {
                src: importSrc,
                concatenate: false,
            },
            engine,
            vaults,
            wsRoot,
        });
        const vpath = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
        let [actualFiles, expectedFiles] = common_test_utils_1.FileTestUtils.cmpFiles(vpath, [
            "assets",
            "project.p1.md",
            "project.p1.n~1.md",
            "project.p-1.n2.md",
            "project.p2.n-1.md",
            "project.p-3.n1.md",
            "root.schema.yml",
            "root.md",
        ]);
        return [
            {
                expected: expectedFiles,
                actual: actualFiles,
            },
        ];
    }),
    CONVERT_LINKS: new common_test_utils_1.TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
        const { pod } = extra;
        const importSrc = (0, common_server_1.tmpDir)().name;
        const filePath = path_1.default.join(importSrc, "project/p2/n1.md");
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(filePath));
        fs_extra_1.default.writeFileSync(filePath, "[[project/p1/n1]]");
        await pod.execute({
            config: {
                src: importSrc,
                concatenate: false,
            },
            engine,
            vaults,
            wsRoot,
        });
        const vpath = (0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot });
        const body = fs_extra_1.default.readFileSync(path_1.default.join(vpath, "project.p2.n1.md"), {
            encoding: "utf8",
        });
        return [
            {
                expected: true,
                actual: await common_test_utils_1.AssertUtils.assertInString({
                    body,
                    match: ["[[project.p1.n1]]"],
                    nomatch: [],
                }),
            },
        ];
    }),
};
const EXPORT = {};
const MARKDOWN_TEST_PRESET = {
    EXPORT,
    IMPORT,
};
exports.default = MARKDOWN_TEST_PRESET;
//# sourceMappingURL=markdown.js.map