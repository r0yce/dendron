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
const pods_core_1 = require("@dendronhq/pods-core");
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
const AirtableExportPodCommand_1 = require("../../../../commands/pods/AirtableExportPodCommand");
const ExtensionProvider_1 = require("../../../../ExtensionProvider");
const common_server_1 = require("@dendronhq/common-server");
const path_1 = __importDefault(require("path"));
const vsCodeUtils_1 = require("../../../../vsCodeUtils");
const common_all_1 = require("@dendronhq/common-all");
suite("AirtableExportCommand", function () {
    const setUpPod = async () => {
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const notePath = path_1.default.join((0, common_server_1.vault2Path)({ vault: vaults[0], wsRoot }), "root.md");
        const config = {
            podId: "dendron.task",
            exportScope: pods_core_1.PodExportScope.Note,
            apiKey: "fakeKey",
            baseId: "fakeBase",
            tableName: "fakeTable",
            sourceFieldMapping: {},
        };
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(notePath));
        return { config };
    };
    (0, mocha_1.describe)("GIVEN AirtableExportPodCommand is run with Note scope with podId dendron.task", () => {
        (0, testUtilsV3_1.describeSingleWS)("WHEN note is succesfully exported for the first time", {}, () => {
            test("THEN note frontmatter should be updated with airtable metadata", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new AirtableExportPodCommand_1.AirtableExportPodCommand(extension);
                const { config } = await setUpPod();
                const note = (0, testUtilsv2_1.getNoteFromTextEditor)();
                const payload = await cmd.enrichInputs(config);
                const airtableId = "airtable-proj.beta";
                const DendronId = note.id;
                const result = {
                    data: {
                        created: [
                            {
                                fields: {
                                    DendronId,
                                },
                                id: airtableId,
                            },
                        ],
                        updated: [],
                    },
                    error: null,
                };
                await cmd.onExportComplete({
                    exportReturnValue: result,
                    config: payload?.config,
                });
                const n = (0, testUtilsv2_1.getNoteFromTextEditor)();
                (0, testUtilsv2_1.expect)(n?.custom.pods.airtable["dendron.task"]).toEqual(airtableId);
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("WHEN note is already exported to a table before and is now exported to a new table", {}, () => {
            test("THEN new airtable id should be appended in the note frontmatter", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new AirtableExportPodCommand_1.AirtableExportPodCommand(extension);
                const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                const { config } = await setUpPod();
                const note = (0, testUtilsv2_1.getNoteFromTextEditor)();
                note.custom = {
                    pods: {
                        airtable: {
                            "dendron.test": "airtable-1",
                        },
                    },
                };
                note.vault = vaults[0];
                await engine.writeNote(note);
                const payload = await cmd.enrichInputs(config);
                const airtableId = "airtable-proj.beta";
                const DendronId = note.id;
                const result = {
                    data: {
                        created: [
                            {
                                fields: {
                                    DendronId,
                                },
                                id: airtableId,
                            },
                        ],
                        updated: [],
                    },
                    error: null,
                };
                await cmd.onExportComplete({
                    exportReturnValue: result,
                    config: payload?.config,
                });
                const n = (0, testUtilsv2_1.getNoteFromTextEditor)();
                (0, testUtilsv2_1.expect)(n?.custom.pods.airtable["dendron.task"]).toEqual(airtableId);
                (0, testUtilsv2_1.expect)(n?.custom.pods.airtable["dendron.test"]).toEqual("airtable-1");
            });
        });
        (0, testUtilsV3_1.describeSingleWS)("AND WHEN there is an error in response", {}, () => {
            test("THEN error must be thrown", async () => {
                const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                const cmd = new AirtableExportPodCommand_1.AirtableExportPodCommand(extension);
                const { config } = await setUpPod();
                const payload = await cmd.enrichInputs(config);
                const result = {
                    data: {
                        created: [],
                        updated: [],
                    },
                    error: new common_all_1.DendronError({
                        message: "Request failed with status code 422",
                    }),
                };
                const resp = await cmd.onExportComplete({
                    exportReturnValue: result,
                    config: payload?.config,
                });
                (0, testUtilsv2_1.expect)(resp).toEqual(`Finished Airtable Export. 0 records created; 0 records updated. Error encountered: ${common_all_1.ErrorFactory.safeStringify(result.error)}`);
            });
        });
    });
});
//# sourceMappingURL=AirtableExportPodCommand.test.js.map