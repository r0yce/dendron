"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CreateSchemaFromHierarchyCommand_1 = require("../../commands/CreateSchemaFromHierarchyCommand");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const sinon_1 = __importDefault(require("sinon"));
const mocha_1 = require("mocha");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const TEST_HIERARCHY_LVL = new CreateSchemaFromHierarchyCommand_1.HierarchyLevel(1, [
    "languages",
    "python",
    "data",
]);
const noteFactory = new common_test_utils_1.TestNoteFactory({
    vault: { fsPath: "/tmp/ws/v1" },
    noWrite: true,
    wsRoot: "/tmp/ws",
});
async function createSchemaCandidates(fnames) {
    const candidates = [];
    for (const fname of fnames) {
        // eslint-disable-next-line no-await-in-loop
        const note = await noteFactory.createForFName(fname);
        candidates.push({
            note,
            label: `label for fname:'${note.fname}'`,
            detail: `detail for fname:'${note.fname}'`,
        });
    }
    return candidates;
}
async function createTestSchemaCandidatesDefault() {
    const fnames = [
        "languages.python.data",
        "languages.python.data.integer",
        "languages.python.data.string",
        "languages.python.machine-learning",
        "languages.python.machine-learning.pandas",
    ];
    return createSchemaCandidates(fnames);
}
function buildCmd() {
    return new CreateSchemaFromHierarchyCommand_1.CreateSchemaFromHierarchyCommand();
}
suite("CreateSchemaFromHierarchyCommand tests", () => {
    const ctx = (0, testUtilsV3_1.setupBeforeAfter)(this, {
        noSetTimeout: true,
    });
    function runTestWithInlineSchemaSetup(func) {
        (0, testUtilsV3_1.runLegacyMultiWorkspaceTest)({
            ctx,
            preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupInlineSchema,
            onInit: func,
        });
    }
    (0, mocha_1.describe)(`HierarchyLevel tests:`, () => {
        (0, mocha_1.describe)(`GIVEN 'languages.python.*' hierarchy level`, () => {
            let level;
            (0, mocha_1.beforeEach)(() => {
                level = new CreateSchemaFromHierarchyCommand_1.HierarchyLevel(2, ["languages", "python", "data"]);
            });
            (0, mocha_1.describe)(`isCandidateNote tests`, () => {
                [
                    { in: "languages", out: false },
                    { in: "languages.python", out: false },
                    { in: "languages.python.data", out: true },
                    { in: "languages.python.data.integer", out: true },
                    { in: "languages.python.machine-learning", out: true },
                ].forEach((input) => (0, mocha_1.it)(`WHEN testing '${input.in}' note THEN ${input.out ? "do match" : "do NOT match"}.`, () => {
                    (0, testUtilsv2_1.expect)(level.isCandidateNote(input.in)).toEqual(input.out);
                }));
            });
        });
        (0, mocha_1.describe)(`GIVEN 'languages.*.data' hierarchy level`, () => {
            let level;
            (0, mocha_1.beforeEach)(() => {
                level = new CreateSchemaFromHierarchyCommand_1.HierarchyLevel(1, ["languages", "python", "data"]);
            });
            (0, mocha_1.it)(`THEN have expected label`, () => {
                (0, testUtilsv2_1.expect)(level.label).toEqual("languages.*.data (python)");
            });
            (0, mocha_1.it)(`THEN have expected top id`, () => {
                (0, testUtilsv2_1.expect)(level.topId()).toEqual("languages");
            });
            (0, mocha_1.it)(`THEN produce expected default schema name`, () => {
                (0, testUtilsv2_1.expect)(level.getDefaultSchemaName()).toEqual("languages");
            });
            (0, mocha_1.describe)(`tokenize tests`, () => {
                [
                    {
                        in: "languages.python.data",
                        out: ["languages", "*", "data"],
                    },
                    {
                        in: "languages.python.data.integer",
                        out: ["languages", "*", "data", "integer"],
                    },
                    {
                        in: "languages.python.machine-learning",
                        out: ["languages", "*", "machine-learning"],
                    },
                ].forEach((input) => (0, mocha_1.it)(`WHEN fname is '${input.in}' THEN tokenize to '${JSON.stringify(input.out)}'.`, () => {
                    (0, testUtilsv2_1.expect)(level.tokenize(input.in)).toEqual(input.out);
                }));
            });
            (0, mocha_1.describe)(`isCandidateNote tests`, () => {
                [
                    { in: "languages", out: false },
                    { in: "languages.python", out: true },
                    { in: "languages.python.data", out: true },
                    { in: "languages.python.data.integer", out: true },
                    { in: "languages.python.machine-learning", out: true },
                ].forEach((input) => (0, mocha_1.it)(`WHEN testing '${input.in}' note THEN ${input.out ? "do match" : "do NOT match"}.`, () => {
                    (0, testUtilsv2_1.expect)(level.isCandidateNote(input.in)).toEqual(input.out);
                }));
            });
        });
    });
    (0, mocha_1.describe)(`SchemaCreator tests: `, () => {
        let schemaCandidates;
        (0, mocha_1.beforeEach)(async () => {
            schemaCandidates = await createTestSchemaCandidatesDefault();
        });
        (0, mocha_1.it)(`WHEN valid schema candidates THEN generate schema`, () => {
            const actual = CreateSchemaFromHierarchyCommand_1.SchemaCreator.makeSchemaBody({
                candidates: schemaCandidates,
                hierarchyLevel: new CreateSchemaFromHierarchyCommand_1.HierarchyLevel(1, ["languages", "python", "data"]),
            });
            const expected = `version: 1
imports: []
schemas:
  - id: languages
    title: languages
    parent: root
    children:
      - pattern: '*'
        children:
          - pattern: data
            children:
              - pattern: integer
              - pattern: string
          - pattern: machine-learning
            children:
              - pattern: pandas\n`;
            (0, testUtilsv2_1.expect)(expected).toEqual(actual);
        });
    });
    (0, mocha_1.describe)(`CreateSchemaFromHierarchyCommand`, () => {
        (0, mocha_1.describe)(`sanityCheck tests:`, () => {
            (0, mocha_1.it)(`WHEN no active text editor THEN give error`, async () => {
                sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "getActiveTextEditor").returns(undefined);
                const cmd = new CreateSchemaFromHierarchyCommand_1.CreateSchemaFromHierarchyCommand();
                const actual = await cmd.sanityCheck();
                (0, testUtilsv2_1.expect)(actual?.includes("No note document open")).toBeTruthy();
            });
        });
        (0, mocha_1.describe)(`formatSchemaCandidates tests:`, () => {
            (0, mocha_1.describe)(`WHEN formatting valid input idx=1 ['h1.h2.h3a', 'h1.h2.h3b']`, () => {
                let schemaCandidates;
                (0, mocha_1.beforeEach)(async () => {
                    const cmd = new CreateSchemaFromHierarchyCommand_1.CreateSchemaFromHierarchyCommand();
                    const notes = await noteFactory.createForFNames([
                        "h1.h2.h3a",
                        "h1.h2.h3b",
                    ]);
                    schemaCandidates = cmd.formatSchemaCandidates(notes, new CreateSchemaFromHierarchyCommand_1.HierarchyLevel(1, ["h1", "h2", "h3a"]));
                });
                (0, mocha_1.it)(`THEN include 'h1.*.h3a' label`, () => {
                    (0, testUtilsv2_1.expect)(schemaCandidates.some((cand) => cand.label === "h1.*.h3a")).toBeTruthy();
                });
            });
        });
        (0, mocha_1.describe)(`addAnalyticsPayload tests`, () => {
            (0, mocha_1.it)(`WHEN successfully created THEN format success`, () => {
                const actual = buildCmd().addAnalyticsPayload({ isHappy: true }, { successfullyCreated: true });
                (0, testUtilsv2_1.expect)(actual).toEqual({ successfullyCreated: true });
            });
            (0, mocha_1.it)(`WHEN input was not happy THEN format the stop reason`, () => {
                const actual = buildCmd().addAnalyticsPayload({
                    isHappy: false,
                    stopReason: CreateSchemaFromHierarchyCommand_1.StopReason.DID_NOT_PICK_SCHEMA_FILE_NAME,
                });
                (0, testUtilsv2_1.expect)(actual).toEqual({
                    successfullyCreated: false,
                    stopReason: CreateSchemaFromHierarchyCommand_1.StopReason.DID_NOT_PICK_SCHEMA_FILE_NAME,
                });
            });
            (0, mocha_1.it)("WHEN stop reason is not present but create is not happy THEN format create not happy", () => {
                const actual = buildCmd().addAnalyticsPayload({ isHappy: false });
                (0, testUtilsv2_1.expect)(actual).toEqual({
                    successfullyCreated: false,
                });
            });
        });
    });
    (0, mocha_1.describe)(`UserQueries tests`, () => {
        let ONE_SCHEMA_CAND;
        let TWO_SCHEMA_CAND;
        (0, mocha_1.beforeEach)(async () => {
            ONE_SCHEMA_CAND = await createSchemaCandidates(["1"]);
            TWO_SCHEMA_CAND = await createSchemaCandidates(["1", "2"]);
        });
        (0, mocha_1.describe)(`haveUserPickSchemaFileName tests:`, () => {
            (0, mocha_1.it)(`WHEN user picked non existent name THEN prompt use the name`, (done) => {
                runTestWithInlineSchemaSetup(async ({ vaults }) => {
                    const vault = vaults[0];
                    sinon_1.default
                        .stub(vsCodeUtils_1.VSCodeUtils, "showInputBox")
                        .onFirstCall()
                        .returns(Promise.resolve("happy"));
                    const actual = await CreateSchemaFromHierarchyCommand_1.UserQueries.promptUserForSchemaFileName(new CreateSchemaFromHierarchyCommand_1.HierarchyLevel(1, ["languages", "python", "data"]), vault);
                    (0, testUtilsv2_1.expect)(actual).toEqual("happy");
                    done();
                });
            });
            (0, mocha_1.it)(`WHEN user picked pre existing name THEN prompt again`, (done) => {
                runTestWithInlineSchemaSetup(async ({ vaults }) => {
                    const vault = vaults[0];
                    sinon_1.default
                        .stub(vsCodeUtils_1.VSCodeUtils, "showInputBox")
                        .onFirstCall()
                        // 'inlined' already exists.
                        .returns(Promise.resolve("inlined"))
                        .returns(Promise.resolve("happy"));
                    const actual = await CreateSchemaFromHierarchyCommand_1.UserQueries.promptUserForSchemaFileName(TEST_HIERARCHY_LVL, vault);
                    (0, testUtilsv2_1.expect)(actual).toEqual("happy");
                    done();
                });
            });
        });
        (0, mocha_1.describe)(`haveUserSelectHierarchyLevel tests:`, () => {
            (0, mocha_1.beforeEach)(() => {
                sinon_1.default
                    .stub(vsCodeUtils_1.VSCodeUtils, "showQuickPick")
                    .returns(Promise.resolve(TEST_HIERARCHY_LVL));
            });
            (0, mocha_1.it)(`WHEN happy input THEN return user picked hierarchy level`, (done) => {
                runTestWithInlineSchemaSetup(async () => {
                    const actual = await CreateSchemaFromHierarchyCommand_1.UserQueries.promptUserToSelectHierarchyLevel("/tmp/languages.python.data.md");
                    (0, testUtilsv2_1.expect)(actual.hierarchyLevel).toEqual(TEST_HIERARCHY_LVL);
                    done();
                });
            });
            // TODO: This test needs to be fixed
            mocha_1.it.skip(`WHEN hierarchy depth of current file is too small THEN undefined`, (done) => {
                runTestWithInlineSchemaSetup(async () => {
                    const actual = await CreateSchemaFromHierarchyCommand_1.UserQueries.promptUserToSelectHierarchyLevel("/tmp/languages.data.md");
                    (0, testUtilsv2_1.expect)(actual.hierarchyLevel).toEqual(undefined);
                    done();
                });
            });
            // TODO: This test needs to be fixed
            mocha_1.it.skip(`WHEN top id is already used by existing schema THEN undefined`, (done) => {
                runTestWithInlineSchemaSetup(async () => {
                    const actual = await CreateSchemaFromHierarchyCommand_1.UserQueries.promptUserToSelectHierarchyLevel("/tmp/daily.python.data.md");
                    (0, testUtilsv2_1.expect)(actual.hierarchyLevel).toEqual(undefined);
                    done();
                });
            });
        });
        (0, mocha_1.describe)(`hasSelected tests:`, () => {
            (0, mocha_1.it)(`WHEN curr is greater than prev THEN true`, () => {
                (0, testUtilsv2_1.expect)(CreateSchemaFromHierarchyCommand_1.UserQueries.hasSelected(ONE_SCHEMA_CAND, TWO_SCHEMA_CAND)).toEqual(true);
            });
            (0, mocha_1.it)(`WHEN curr is equal to prev THEN false`, () => {
                (0, testUtilsv2_1.expect)(CreateSchemaFromHierarchyCommand_1.UserQueries.hasSelected(ONE_SCHEMA_CAND, ONE_SCHEMA_CAND)).toEqual(false);
            });
            (0, mocha_1.it)(`WHEN curr is less than prev THEN false`, () => {
                (0, testUtilsv2_1.expect)(CreateSchemaFromHierarchyCommand_1.UserQueries.hasSelected(TWO_SCHEMA_CAND, ONE_SCHEMA_CAND)).toEqual(false);
            });
        });
        (0, mocha_1.describe)(`hasUnselected tests:`, () => {
            (0, mocha_1.it)("WHEN curr is greater thhan prev THEN false", () => {
                (0, testUtilsv2_1.expect)(CreateSchemaFromHierarchyCommand_1.UserQueries.hasUnselected(ONE_SCHEMA_CAND, TWO_SCHEMA_CAND)).toEqual(false);
            });
            (0, mocha_1.it)(`WHEN curr is equal to prev THEN false`, () => {
                (0, testUtilsv2_1.expect)(CreateSchemaFromHierarchyCommand_1.UserQueries.hasUnselected(ONE_SCHEMA_CAND, ONE_SCHEMA_CAND)).toEqual(false);
            });
            (0, mocha_1.it)(`WHEN curr is less than prev THEN true`, () => {
                (0, testUtilsv2_1.expect)(CreateSchemaFromHierarchyCommand_1.UserQueries.hasUnselected(TWO_SCHEMA_CAND, ONE_SCHEMA_CAND)).toEqual(true);
            });
        });
        (0, mocha_1.describe)(`findUncheckedItem tests:`, () => {
            (0, mocha_1.it)(`WHEN unchecked THEN get the candidate`, () => {
                const actual = CreateSchemaFromHierarchyCommand_1.UserQueries.findUncheckedItem(TWO_SCHEMA_CAND, ONE_SCHEMA_CAND);
                (0, testUtilsv2_1.expect)(actual.note.fname).toEqual("2");
            });
        });
        (0, mocha_1.describe)(`findCheckedItems tests:`, () => {
            (0, mocha_1.it)(`WHEN checked THEN get the candidate`, () => {
                const actual = CreateSchemaFromHierarchyCommand_1.UserQueries.findCheckedItem(ONE_SCHEMA_CAND, TWO_SCHEMA_CAND);
                (0, testUtilsv2_1.expect)(actual.note.fname).toEqual("2");
            });
        });
        (0, mocha_1.describe)(`determineAfterSelect tests:`, () => {
            (0, mocha_1.describe)(`WHEN a child of non selected hierarchy is checked`, () => {
                let actual;
                (0, mocha_1.beforeEach)(async () => {
                    const all = await createSchemaCandidates([
                        "h1.h2",
                        "h1.h2.h3a",
                        "h1.h2.h3b",
                        "h1.h2.h3c",
                        "h1.h2.h3c.h4",
                        "otherHierarchy.h2",
                    ]);
                    const prev = await createSchemaCandidates(["otherHierarchy.h2"]);
                    const curr = await createSchemaCandidates([
                        "otherHierarchy.h2",
                        "h1.h2.h3c.h4",
                    ]);
                    actual = CreateSchemaFromHierarchyCommand_1.UserQueries.determineAfterSelect(prev, curr, all);
                });
                (0, mocha_1.it)(`THEN make sure length is as expected`, () => {
                    (0, testUtilsv2_1.expect)(actual.length).toEqual(4);
                });
                (0, mocha_1.it)("THEN retain the checked items", () => {
                    (0, testUtilsv2_1.expect)(actual.some((c) => c.note.fname === "otherHierarchy.h2")).toBeTruthy();
                    (0, testUtilsv2_1.expect)(actual.some((c) => c.note.fname === "h1.h2.h3c")).toBeTruthy();
                });
                (0, mocha_1.it)(`THEN select parent of item`, () => {
                    (0, testUtilsv2_1.expect)(actual.some((c) => c.note.fname === "h1.h2.h3c")).toBeTruthy();
                });
                (0, mocha_1.it)(`THEN select grand-parent (ancestor) of item`, () => {
                    (0, testUtilsv2_1.expect)(actual.some((c) => c.note.fname === "h1.h2")).toBeTruthy();
                });
            });
        });
        (0, mocha_1.describe)(`determineAfterUnselect tests:`, () => {
            (0, mocha_1.describe)(`WHEN ancestor is unchecked`, () => {
                let actual;
                (0, mocha_1.beforeEach)(async () => {
                    const prev = await createSchemaCandidates([
                        "h1.h2",
                        "h1.h2.h3a",
                        "h1.h2.h3c.h4",
                        "otherHierarchy.h2",
                    ]);
                    const curr = await createSchemaCandidates([
                        "h1.h2.h3a",
                        "h1.h2.h3c.h4",
                        "otherHierarchy.h2",
                    ]);
                    actual = CreateSchemaFromHierarchyCommand_1.UserQueries.determineAfterUnselect(prev, curr);
                });
                (0, mocha_1.it)(`THEN keep another hierarchy as is`, () => {
                    (0, testUtilsv2_1.expect)(actual.some((c) => c.note.fname === "otherHierarchy.h2")).toBeTruthy();
                });
                (0, mocha_1.it)(`THEN unselect all the descendents`, () => {
                    (0, testUtilsv2_1.expect)(actual.length).toEqual(1);
                });
            });
        });
    });
});
//# sourceMappingURL=CreateSchemaFromHierarchyCommand.test.js.map