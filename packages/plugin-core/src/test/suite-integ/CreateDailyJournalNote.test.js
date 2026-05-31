"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_server_1 = require("@dendronhq/engine-server");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
const CreateDailyJournal_1 = require("../../commands/CreateDailyJournal");
const utils_1 = require("../../components/lookup/utils");
const constants_1 = require("../../constants");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const stubVaultPick = (vaults) => {
    const vault = lodash_1.default.find(vaults, { fsPath: vaults[2].fsPath });
    sinon_1.default.stub(utils_1.PickerUtilsV2, "promptVault").returns(Promise.resolve(vault));
    sinon_1.default
        .stub(utils_1.PickerUtilsV2, "getOrPromptVaultForNewNote")
        .returns(Promise.resolve(vault));
    return vault;
};
/**
 * These tests can timeout otherwise
 * eg. https://github.com/dendronhq/dendron/runs/6942599059?check_suite_focus=true
 */
const timeout = 5e3;
suite("Create Daily Journal Suite", function () {
    const TEMPLATE_BODY = "test daily template";
    (0, mocha_1.beforeEach)(() => {
        engine_server_1.MetadataService.instance().deleteMeta("firstDailyJournalTime");
        engine_server_1.MetadataService.instance().setInitialInstall(common_all_1.Time.DateTime.fromISO("2022-06-30").toSeconds());
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then daily journal with template applied.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            const metadataService = engine_server_1.MetadataService.instance();
            (0, testUtilsv2_1.expect)(metadataService.getMeta().firstDailyJournalTime).toBeFalsy();
            await cmd.run();
            (0, testUtilsv2_1.expect)(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("daily")).data;
            (0, testUtilsv2_1.expect)(dailySchema.fname === "dendron.daily").toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.size(dailySchema.schemas) === 5).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note and DAILY JOURNAL has already been run before", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then default template and schema is not created", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            const metadataService = engine_server_1.MetadataService.instance();
            metadataService.setFirstDailyJournalTime();
            (0, testUtilsv2_1.expect)(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();
            await cmd.run();
            (0, testUtilsv2_1.expect)(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is NOT applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeFalsy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is NOT created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("daily")).data;
            (0, testUtilsv2_1.expect)(dailySchema).toBeFalsy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note and first install is before 5/31/22", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then default template and schema is not created", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            const metadataService = engine_server_1.MetadataService.instance();
            metadataService.setInitialInstall(common_all_1.Time.DateTime.fromISO("2022-04-30").toSeconds());
            (0, testUtilsv2_1.expect)(metadataService.getMeta().firstDailyJournalTime).toBeFalsy();
            await cmd.run();
            (0, testUtilsv2_1.expect)(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is NOT applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeFalsy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is NOT created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("daily")).data;
            (0, testUtilsv2_1.expect)(dailySchema).toBeFalsy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note and dailyVault set", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", false);
            common_all_1.ConfigUtils.setJournalProps(config, "dailyVault", "vault2");
            return config;
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then daily journal is created in daily vault with template applied.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("daily")).data;
            (0, testUtilsv2_1.expect)(dailySchema.fname === "dendron.daily").toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.size(dailySchema.schemas) === 5).toBeTruthy();
            (0, testUtilsv2_1.expect)((await testUtilsV3_1.EditorUtils.getURIForActiveEditor()).fsPath.includes(engine.vaults[1].fsPath)).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note and dailyVault set with lookup Confirm", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", true);
            common_all_1.ConfigUtils.setJournalProps(config, "dailyVault", "vault1");
            return config;
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then daily journal is created in daily vault with template is applied.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("daily")).data;
            (0, testUtilsv2_1.expect)(dailySchema.fname === "dendron.daily").toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.size(dailySchema.schemas) === 5).toBeTruthy();
            (0, testUtilsv2_1.expect)((await testUtilsV3_1.EditorUtils.getURIForActiveEditor()).fsPath.includes(engine.vaults[0].fsPath)).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note and dailyVault not set with lookup Confirm", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", true);
            return config;
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then daily journal is created in daily vault with template applied.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            stubVaultPick(vaults);
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is created
            const dailySchema = (await engine.getSchema("daily")).data;
            (0, testUtilsv2_1.expect)(dailySchema.fname === "dendron.daily").toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.size(dailySchema.schemas) === 5).toBeTruthy();
            (0, testUtilsv2_1.expect)((await testUtilsV3_1.EditorUtils.getURIForActiveEditor()).fsPath.includes(engine.vaults[2].fsPath)).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note and dailyDomain set", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".bar",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setJournalProps(config, "dailyDomain", "bar");
            return config;
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then daily journal is created with right domain and with template applied.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("bar.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("bar")).data;
            (0, testUtilsv2_1.expect)(dailySchema.fname === "dendron.bar").toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.size(dailySchema.schemas) === 5).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note and deprecated config", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daisy",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
        wsSettingsOverride: {
            settings: {
                [constants_1.CONFIG.DEFAULT_JOURNAL_DATE_FORMAT.key]: "'q'q",
                [constants_1.CONFIG.DEFAULT_JOURNAL_ADD_BEHAVIOR.key]: "childOfCurrent",
                [constants_1.CONFIG.DAILY_JOURNAL_DOMAIN.key]: "daisy",
                [constants_1.CONFIG.DEFAULT_JOURNAL_NAME.key]: "journey",
            },
        },
        modConfigCb: (config) => {
            common_all_1.ConfigUtils.setJournalProps(config, "dateFormat", "dd");
            common_all_1.ConfigUtils.setJournalProps(config, "dailyDomain", "daisy");
            common_all_1.ConfigUtils.setJournalProps(config, "name", "journey");
            return config;
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed, then deprecated config is ignored.", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is applied
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, "0");
            (0, testUtilsv2_1.expect)(activeNote.fname).toEqual(`daisy.journey.${dd}`);
            // TODO: Enable when/if we support applying templates to journals with configured dateFormat
            //expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("daisy")).data;
            (0, testUtilsv2_1.expect)(dailySchema.fname === "dendron.daisy").toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.size(dailySchema.schemas) === 5).toBeTruthy();
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a basic workspace with a daily journal template note", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
        timeout,
        preActivateHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: CreateDailyJournal_1.CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
                wsRoot,
                vault: vaults[0],
                body: TEMPLATE_BODY,
            });
        },
    }, () => {
        test("WHEN CreateDailyJournalCommand is executed multiple times, then template and schema are not generated again", async () => {
            const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
            const cmd = new CreateDailyJournal_1.CreateDailyJournalCommand(ext);
            await cmd.run();
            const activeNote = (0, testUtilsv2_1.getNoteFromTextEditor)();
            // Verify template body is applied
            (0, testUtilsv2_1.expect)(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
            (0, testUtilsv2_1.expect)(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();
            // Verify trait is applied
            const traits = activeNote.traitIds;
            (0, testUtilsv2_1.expect)(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();
            // Verify schema is created
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const dailySchema = (await engine.getSchema("daily")).data;
            (0, testUtilsv2_1.expect)(dailySchema.fname === "dendron.daily").toBeTruthy();
            (0, testUtilsv2_1.expect)(lodash_1.default.size(dailySchema.schemas) === 5).toBeTruthy();
            const numNotesBefore = (await engine.findNotesMeta({ excludeStub: true })).length;
            const numSchemasBefore = lodash_1.default.size((await engine.querySchema("*")).data);
            await cmd.run();
            (0, testUtilsv2_1.expect)(numNotesBefore).toEqual((await engine.findNotesMeta({ excludeStub: true })).length);
            (0, testUtilsv2_1.expect)(numSchemasBefore).toEqual(lodash_1.default.size((await engine.querySchema("*")).data));
        });
    });
});
//# sourceMappingURL=CreateDailyJournalNote.test.js.map