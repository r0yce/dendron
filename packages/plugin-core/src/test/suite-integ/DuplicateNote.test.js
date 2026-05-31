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
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsV3_1 = require("../testUtilsV3");
const common_server_1 = require("@dendronhq/common-server");
const testUtilsv2_1 = require("../testUtilsv2");
const utils_1 = require("../../components/doctor/utils");
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
suite("Duplicate note detection", function () {
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a duplicate note", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN duplicate note is detected", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
            const barPath = path_1.default.join(wsRoot, vaultPath, "bar.md");
            const dupeNotePath = path_1.default.join(wsRoot, vaultPath, "bar-dupe.md");
            const dupeNoteUri = vscode.Uri.file(dupeNotePath);
            const barContent = fs_extra_1.default.readFileSync(barPath, { encoding: "utf-8" });
            fs_extra_1.default.writeFileSync(dupeNotePath, barContent, { encoding: "utf-8" });
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(dupeNoteUri);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            const document = editor?.document;
            const resp = await utils_1.DoctorUtils.findDuplicateNoteFromDocument(document);
            (0, testUtilsv2_1.expect)(resp !== undefined).toBeTruthy();
            if (resp === undefined) {
                throw Error;
            }
            const { note, duplicate } = resp;
            if (duplicate === undefined) {
                throw Error;
            }
            (0, testUtilsv2_1.expect)(note.id).toEqual(duplicate.id);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a unique note", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN duplicate is not detected", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
            const barPath = path_1.default.join(wsRoot, vaultPath, "bar.md");
            const barUri = vscode.Uri.file(barPath);
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(barUri);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            const document = editor?.document;
            const resp = await utils_1.DoctorUtils.findDuplicateNoteFromDocument(document);
            (0, testUtilsv2_1.expect)(resp !== undefined).toBeTruthy();
            if (resp === undefined) {
                throw Error;
            }
            const { duplicate } = resp;
            (0, testUtilsv2_1.expect)(duplicate).toEqual(undefined);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN an open file that is outside of workspace", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN do nothing", async () => {
            const outside = (0, common_server_1.tmpDir)().name;
            const outsideDummyPath = path_1.default.join(outside, "dummy.log");
            fs_extra_1.default.writeFileSync(outsideDummyPath, "dummy", { encoding: "utf-8" });
            const outsideDummyUri = vscode.Uri.file(outsideDummyPath);
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(outsideDummyUri);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            const document = editor?.document;
            const resp = await utils_1.DoctorUtils.findDuplicateNoteFromDocument(document);
            (0, testUtilsv2_1.expect)(resp).toEqual(undefined);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN an open file that is in the workspace but doesn't have frontmatter", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        test("THEN do nothing", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
            const noFMFilePath = path_1.default.join(wsRoot, vaultPath, "no-fm.md");
            const noFMFileUri = vscode.Uri.file(noFMFilePath);
            const noFMContent = "no frontmatter";
            fs_extra_1.default.writeFileSync(noFMFilePath, noFMContent, { encoding: "utf-8" });
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(noFMFileUri);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            const document = editor?.document;
            const resp = await utils_1.DoctorUtils.findDuplicateNoteFromDocument(document);
            (0, testUtilsv2_1.expect)(resp?.duplicate).toEqual(undefined);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN an open file that has been deleted", {
        postSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupEmpty,
    }, () => {
        test("THEN do nothing", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            await common_test_utils_1.NoteTestUtilsV4.createNoteWithEngine({
                fname: "deleted",
                vault: vaults[0],
                wsRoot,
                body: "note will be deleted",
                engine,
            });
            const vaultPath = common_all_1.VaultUtils.getRelPath(vaults[0]);
            const deletedFilePath = path_1.default.join(wsRoot, vaultPath, "deleted.md");
            const deletedFileUri = vscode.Uri.file(deletedFilePath);
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(deletedFileUri);
            fs_extra_1.default.unlinkSync(deletedFilePath);
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(deletedFileUri);
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            const document = editor?.document;
            const resp = await utils_1.DoctorUtils.findDuplicateNoteFromDocument(document);
            (0, testUtilsv2_1.expect)(resp).toEqual(undefined);
        });
    });
});
//# sourceMappingURL=DuplicateNote.test.js.map