"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const mocha_1 = require("mocha");
const os_1 = __importDefault(require("os"));
const perf_hooks_1 = require("perf_hooks");
const MoveNoteCommand_1 = require("../../commands/MoveNoteCommand");
const NoteLookupCommand_1 = require("../../commands/NoteLookupCommand");
const RefactorHierarchyV2_1 = require("../../commands/RefactorHierarchyV2");
const ReloadIndex_1 = require("../../commands/ReloadIndex");
const RenameNoteCommand_1 = require("../../commands/RenameNoteCommand");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
let perflogs = {};
suite("Performance testing", function () {
    (0, mocha_1.describe)("10000+ notes performance testing", () => {
        [false, true].forEach((enableEngineV3) => {
            (0, testUtilsV3_1.describeSingleWS)(`WHEN enableEngineV3 is ${enableEngineV3}`, {
                timeout: 1e6,
                preSetupHook: async ({ wsRoot }) => {
                    const git = new engine_server_1.Git({
                        localUrl: wsRoot,
                        remoteUrl: "https://github.com/dendronhq/10000-markdown-files.git",
                    });
                    await git.clone();
                },
                modConfigCb: (config) => {
                    const newVault = {
                        fsPath: "10000-markdown-files",
                        selfContained: true,
                    };
                    const vaults = common_all_1.ConfigUtils.getVaults(config);
                    vaults.push(newVault);
                    config.workspace.vaults = vaults;
                    config.dev.enableEngineV3 = enableEngineV3;
                    return config;
                },
                perflogs,
            }, () => {
                (0, mocha_1.after)(async () => {
                    console.log("******************************************");
                    Object.keys(perflogs).forEach((log) => {
                        console.log(log, "------------->", perflogs[log], "\n");
                    });
                    if (process.env.AIRTABLE_API_KEY) {
                        const headers = {
                            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
                            "Content-Type": "application/json",
                        };
                        const data = {
                            records: [
                                {
                                    fields: {
                                        date: common_all_1.Time.now().toLocaleString(),
                                        commitHash: process.env.GITHUB_SHA,
                                        githubRef: process.env.GITHUB_REF,
                                        testParameters: `enableEngineV3: ${enableEngineV3}`,
                                        os: os_1.default.platform(),
                                        ...perflogs,
                                    },
                                },
                            ],
                        };
                        await common_all_1.axios.post(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/PerformanceData`, data, { headers });
                    }
                    perflogs = {};
                });
                test("engine init duration", async () => {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    const start = perf_hooks_1.performance.now();
                    await engine.init();
                    const end = perf_hooks_1.performance.now();
                    const engineInitDuration = end - start;
                    perflogs.engineInitDuration = engineInitDuration;
                });
                test("THEN lookup returns correct results", async () => {
                    const cmd = new NoteLookupCommand_1.NoteLookupCommand();
                    const fname = "absorbed.distinguished.service.order";
                    const start = perf_hooks_1.performance.now();
                    const out = await cmd.run({
                        noConfirm: true,
                        initialValue: "service.order",
                    });
                    const end = perf_hooks_1.performance.now();
                    const quickPick = out?.quickpick;
                    const items = quickPick?.items.some((item) => item.fname === fname);
                    perflogs.lookupDuration = end - start;
                    cmd.cleanUp();
                    (0, testUtilsv2_1.expect)(items).toBeTruthy();
                });
                test("Reload Index", async () => {
                    const start = perf_hooks_1.performance.now();
                    await new ReloadIndex_1.ReloadIndexCommand().run();
                    const end = perf_hooks_1.performance.now();
                    perflogs.reloadIndexDuration = end - start;
                });
                test("write note", async () => {
                    const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const newNote = await common_test_utils_1.NoteTestUtilsV4.createNote({
                        fname: "write-note",
                        vault: vaults[0],
                        wsRoot,
                    });
                    const start = perf_hooks_1.performance.now();
                    await engine.writeNote(newNote);
                    const end = perf_hooks_1.performance.now();
                    perflogs.writeNoteDuration = end - start;
                    const notes = await engine.findNotesMeta({ fname: "write-note" });
                    (0, testUtilsv2_1.expect)(notes.length).toEqual(1);
                });
                test("update note", async () => {
                    const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const fname = "abiogenetic.nutlet";
                    const noteToUpdate = (await engine.findNotes({ fname }))[0];
                    noteToUpdate.title = "Update Note";
                    const start = perf_hooks_1.performance.now();
                    await engine.writeNote(noteToUpdate);
                    const end = perf_hooks_1.performance.now();
                    perflogs.updateNoteDuration = end - start;
                    const updatedNote = (await engine.findNotesMeta({ fname }))[0];
                    (0, testUtilsv2_1.expect)(updatedNote.title).toEqual("Update Note");
                });
                //Note Links: https://github.dev/dendronhq/10000-markdown-files/note-with-links.md
                test("render note with 20 links", async () => {
                    const { engine, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const fname = "note-with-links";
                    const noteToRender = (await engine.findNotes({ fname, vault: vaults[1] }))[0];
                    const start = perf_hooks_1.performance.now();
                    const resp = await engine.renderNote(noteToRender);
                    const end = perf_hooks_1.performance.now();
                    perflogs.renderNoteWith20LinksDuration = end - start;
                    (0, testUtilsv2_1.expect)(resp.error).toEqual(undefined);
                    (0, testUtilsv2_1.expect)(resp.data).toNotEqual(undefined);
                });
                //Above note with 0 links: https://github.dev/dendronhq/10000-markdown-files/abiogenetic.nutlet.md
                test("render note with 0 links", async () => {
                    const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const fname = "abiogenetic.nutlet";
                    const noteToRender = (await engine.findNotes({ fname }))[0];
                    const start = perf_hooks_1.performance.now();
                    const resp = await engine.renderNote(noteToRender);
                    const end = perf_hooks_1.performance.now();
                    perflogs.renderNoteDuration = end - start;
                    (0, testUtilsv2_1.expect)(resp.error).toEqual(undefined);
                    (0, testUtilsv2_1.expect)(resp.data).toNotEqual(undefined);
                });
                //https://github.dev/dendronhq/10000-markdown-files/a.cappella.magnetic.recorder.md
                test("render note with nested noteRefs", async () => {
                    const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const fname = "a.cappella.magnetic.recorder";
                    const noteToRender = (await engine.findNotes({ fname }))[0];
                    const start = perf_hooks_1.performance.now();
                    const resp = await engine.renderNote(noteToRender);
                    const end = perf_hooks_1.performance.now();
                    perflogs.renderNoteWithNestedRefs = end - start;
                    (0, testUtilsv2_1.expect)(resp.error).toEqual(undefined);
                    (0, testUtilsv2_1.expect)(resp.data).toNotEqual(undefined);
                });
                //https://github.dev/dendronhq/10000-markdown-files/rich-formatting.md
                test("render note with rich formatting", async () => {
                    const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const fname = "rich-formatting";
                    const noteToRender = (await engine.findNotes({ fname }))[0];
                    const start = perf_hooks_1.performance.now();
                    const resp = await engine.renderNote(noteToRender);
                    const end = perf_hooks_1.performance.now();
                    perflogs.renderNoteWithRichFormatting = end - start;
                    (0, testUtilsv2_1.expect)(resp.error).toEqual(undefined);
                    (0, testUtilsv2_1.expect)(resp.data).toNotEqual(undefined);
                });
                test("Move note to another vault", async () => {
                    const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const vault1 = vaults[0];
                    const vault2 = vaults[1];
                    const fname = "above-mentioned.cerise";
                    const note1 = (await engine.findNotes({
                        fname,
                        vault: vault2,
                    }))[0];
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    await extension.wsUtils.openNote(note1);
                    const cmd = new MoveNoteCommand_1.MoveNoteCommand(extension);
                    const start = perf_hooks_1.performance.now();
                    await cmd.execute({
                        moves: [
                            {
                                oldLoc: {
                                    fname,
                                    vaultName: common_all_1.VaultUtils.getName(vault2),
                                },
                                newLoc: {
                                    fname,
                                    vaultName: common_all_1.VaultUtils.getName(vault1),
                                },
                            },
                        ],
                    });
                    const end = perf_hooks_1.performance.now();
                    perflogs.moveNoteAcrossVaultDuration = end - start;
                    const notes = await engine.findNotesMeta({ fname });
                    (0, testUtilsv2_1.expect)(notes.length).toEqual(1);
                    (0, testUtilsv2_1.expect)(notes[0].vault).toEqual(vault1);
                });
                test("Refactor hierarchy", async () => {
                    const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const cmd = new RefactorHierarchyV2_1.RefactorHierarchyCommandV2();
                    const fname = "aberrant.suspiciousness";
                    const note = (await engine.findNotes({
                        fname,
                        vault: vaults[1],
                    }))[0];
                    const scope = {
                        selectedItems: [
                            {
                                ...note,
                                label: fname,
                            },
                        ],
                        onAcceptHookResp: [],
                    };
                    const start = perf_hooks_1.performance.now();
                    await cmd.execute({
                        scope,
                        match: fname,
                        replace: "refactor",
                        noConfirm: true,
                    });
                    const end = perf_hooks_1.performance.now();
                    perflogs.refactorHierarchy = end - start;
                    const notes = await engine.findNotesMeta({ fname });
                    (0, testUtilsv2_1.expect)(notes.length).toEqual(0);
                });
                test("Rename Note", async () => {
                    const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
                    const vault = vaults[1];
                    const fname = "abkhazian.opcw";
                    const newFname = "renamed-note";
                    const note1 = (await engine.findNotes({
                        fname,
                        vault,
                    }))[0];
                    const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
                    await extension.wsUtils.openNote(note1);
                    const cmd = new RenameNoteCommand_1.RenameNoteCommand(extension);
                    const vaultName = common_all_1.VaultUtils.getName(vault);
                    const start = perf_hooks_1.performance.now();
                    await cmd.execute({
                        moves: [
                            {
                                oldLoc: {
                                    fname,
                                    vaultName,
                                },
                                newLoc: {
                                    fname: newFname,
                                    vaultName,
                                },
                            },
                        ],
                    });
                    const end = perf_hooks_1.performance.now();
                    perflogs.renameNoteDuration = end - start;
                    const note = (await engine.findNotesMeta({ fname: newFname }))[0];
                    (0, testUtilsv2_1.expect)(note).toNotEqual(undefined);
                    (0, testUtilsv2_1.expect)(note.vault).toEqual(vault);
                });
            });
        });
    });
});
//# sourceMappingURL=PerfTesting.test.js.map