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
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const ReloadIndex_1 = require("../../commands/ReloadIndex");
const BacklinksTreeDataProvider_1 = __importDefault(require("../../features/BacklinksTreeDataProvider"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const Backlink_1 = require("../../features/Backlink");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const testUtilsv2_1 = require("../testUtilsv2");
const testUtilsV3_1 = require("../testUtilsV3");
const MockEngineEvents_1 = require("./MockEngineEvents");
const common_server_1 = require("@dendronhq/common-server");
/** Asking for root children (asking for children without an input) from backlinks tree
 *  data provider will us the backlinks. */
const getRootChildrenBacklinks = async (sortOrder) => {
    const mockEvents = new MockEngineEvents_1.MockEngineEvents();
    const backlinksTreeDataProvider = new BacklinksTreeDataProvider_1.default(mockEvents, ExtensionProvider_1.ExtensionProvider.getDWorkspace().config);
    if (sortOrder) {
        backlinksTreeDataProvider.sortOrder = sortOrder;
    }
    const parents = await backlinksTreeDataProvider.getChildren();
    const parentsWithChildren = [];
    if (parents !== undefined) {
        for (const parent of parents) {
            parentsWithChildren.push({
                ...parent,
                // eslint-disable-next-line no-await-in-loop
                children: await backlinksTreeDataProvider.getChildren(parent),
            });
        }
    }
    return {
        out: parentsWithChildren,
        provider: backlinksTreeDataProvider,
    };
};
async function getRootChildrenBacklinksAsPlainObject(sortOrder) {
    const value = await getRootChildrenBacklinks(sortOrder);
    const cleanedOutVal = {
        ...value,
        out: cleanOutParentPointersFromList(value.out),
    };
    return (0, common_test_utils_1.toPlainObject)(cleanedOutVal);
}
/** Refer to {@link cleanOutParentPointers} */
function cleanOutParentPointersFromList(backlinks) {
    return backlinks.map((backlink) => {
        return cleanOutParentPointers(backlink);
    });
}
/** Return a copy of backlink with parent pointers cleaned out.
 *
 *  Need to remove parent references to avoid circular serialization error when trying
 *  to serialize the backlinks within our tests (our existing tests serialize
 *  the backlinks for their assertion checks). */
function cleanOutParentPointers(backlink) {
    const copy = { ...backlink };
    if (copy.children) {
        copy.children = cleanOutParentPointersFromList(copy.children);
    }
    copy.parentBacklink = undefined;
    copy.singleRef = undefined;
    if (copy.refs) {
        copy.refs = copy.refs.map((ref) => {
            const refCopy = { ...ref };
            refCopy.parentBacklink = undefined;
            return refCopy;
        });
    }
    return copy;
}
function backlinksToPlainObject(backlinks) {
    return (0, common_test_utils_1.toPlainObject)(cleanOutParentPointersFromList(backlinks));
}
function assertAreEqual(actual, expected) {
    if (actual instanceof Backlink_1.Backlink) {
        actual = cleanOutParentPointers(actual);
    }
    else {
        throw new Error(`Actual type was '${typeof actual}'. Must be Backlink type for this assert.`);
    }
    expected = cleanOutParentPointers(expected);
    const plainActual = (0, common_test_utils_1.toPlainObject)(actual);
    const plainExpected = (0, common_test_utils_1.toPlainObject)(expected);
    (0, testUtilsv2_1.expect)(plainActual).toEqual(plainExpected);
}
suite("BacklinksTreeDataProvider", function () {
    // Set test timeout to 3 seconds
    this.timeout(3000);
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a single vault workspace with two notes (target, link)", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
        },
    }, () => {
        (0, mocha_1.test)("THEN BacklinksTreeDataProvider calculates correct number of backlinks", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
            const { out } = await getRootChildrenBacklinksAsPlainObject();
            const expectedPath = vscode.Uri.file(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "beta.md")).path;
            (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
            (0, testUtilsv2_1.expect)(out.length).toEqual(1);
        });
        (0, mocha_1.test)("THEN validate get parent works", async () => {
            const { out: backlinks, provider } = await getRootChildrenBacklinks();
            const parentBacklink = backlinks[0];
            // Our utility method will add the children into out backlink structure.
            // The provider will give just the backlink hence we will remove the
            // children from the structure that will be used to assert equality.
            const { children, ...parentBacklinkForAssert } = parentBacklink;
            // Validate children added by the test setup are able to getParent()
            (0, testUtilsv2_1.expect)(parentBacklink.children).toBeTruthy();
            parentBacklink.children?.forEach((child) => {
                const foundParent = provider.getParent(child);
                assertAreEqual(foundParent, parentBacklinkForAssert);
            });
            // Validate backlinks created out of refs can getParent()
            (0, testUtilsv2_1.expect)(parentBacklink.refs).toBeTruthy();
        });
        (0, mocha_1.test)("THEN calculating backlinks from cache returns same number of backlinks", async () => {
            // re-initialize engine from cache
            await new ReloadIndex_1.ReloadIndexCommand().run();
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
            const { out } = await getRootChildrenBacklinksAsPlainObject();
            const expectedPath = vscode.Uri.file(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(vaults[0]), "beta.md")).path;
            (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
            (0, testUtilsv2_1.expect)(out.length).toEqual(1);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN there is one note with the candidate word", {
        // NOTE: this test often times out
        timeout: 10e3,
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
        },
        modConfigCb: (config) => {
            config.dev = {
                enableLinkCandidates: true,
            };
            return config;
        },
    }, () => {
        (0, mocha_1.test)("THEN finds the backlink candidate for that note", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const isLinkCandidateEnabled = engine_test_utils_1.TestConfigUtils.getConfig({ wsRoot }).dev
                ?.enableLinkCandidates;
            (0, testUtilsv2_1.expect)(isLinkCandidateEnabled).toBeTruthy();
            const noteWithTarget = (await engine.findNotesMeta({ fname: "alpha", vault: vaults[0] }))[0];
            await checkNoteBacklinks({ wsRoot, vaults, noteWithTarget });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN there are multiple notes with the candidate word", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            // Create 2 notes with the same name
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
                genRandomId: true,
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[1],
                genRandomId: true,
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
        },
        modConfigCb: (config) => {
            config.dev = {
                enableLinkCandidates: true,
            };
            return config;
        },
    }, () => {
        (0, mocha_1.test)("THEN finds the backlink candidate for all notes", async () => {
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const isLinkCandidateEnabled = engine_test_utils_1.TestConfigUtils.getConfig({ wsRoot }).dev
                ?.enableLinkCandidates;
            (0, testUtilsv2_1.expect)(isLinkCandidateEnabled).toBeTruthy();
            // Check the backlinks for both notes
            await checkNoteBacklinks({
                wsRoot,
                vaults,
                noteWithTarget: (await engine.findNotesMeta({ fname: "alpha", vault: vaults[0] }))[0],
            });
            await checkNoteBacklinks({
                wsRoot,
                vaults,
                noteWithTarget: (await engine.findNotesMeta({ fname: "alpha", vault: vaults[1] }))[0],
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a multi vault workspace with notes referencing each other across vaults", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "alpha",
                body: `[[beta]]`,
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "beta",
                body: `[[alpha]]`,
                vault: vaults[1],
                wsRoot,
                props: {
                    updated: 2,
                },
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "omega",
                body: `[[alpha]]`,
                vault: vaults[1],
                wsRoot,
                props: {
                    updated: 3,
                },
            });
        },
        modConfigCb: (config) => {
            config.dev = {
                enableLinkCandidates: true,
            };
            return config;
        },
    }, () => {
        (0, mocha_1.test)("THEN backlink sort order is correct", async () => {
            const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            function buildVault1Path(fileName) {
                return vscode.Uri.file(path_1.default.join(wsRoot, vaults[1].fsPath, fileName)).path.toLowerCase();
            }
            const notePath = path_1.default.join(wsRoot, vaults[0].fsPath, "alpha.md");
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.file(notePath));
            // Test Last Updated sort order
            {
                const { out } = await getRootChildrenBacklinksAsPlainObject(common_all_1.BacklinkPanelSortOrder.LastUpdated);
                (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(buildVault1Path("omega.md"));
                (0, testUtilsv2_1.expect)(out.length).toEqual(2);
            }
            // Test PathNames sort order
            {
                const { out } = await getRootChildrenBacklinksAsPlainObject(common_all_1.BacklinkPanelSortOrder.PathNames);
                (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(buildVault1Path("beta.md"));
                (0, testUtilsv2_1.expect)(out.length).toEqual(2);
            }
        });
        (0, mocha_1.test)("THEN BacklinksTreeDataProvider calculates correct number of backlinks", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const note = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(note);
            const { out } = await getRootChildrenBacklinksAsPlainObject();
            const expectedPath = vscode.Uri.file(path_1.default.join(wsRoot, vaults[1].fsPath, "beta.md")).path;
            (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
            (0, testUtilsv2_1.expect)(out.length).toEqual(2);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a multi vault workspace with two notes in different vaults", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "alpha",
                body: `gamma`,
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
                wsRoot,
                vault: vaults[1],
            });
        },
        modConfigCb: (config) => {
            config.dev = {
                enableLinkCandidates: true,
            };
            return config;
        },
    }, () => {
        (0, mocha_1.test)("THEN link candidates should only work within a vault", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const alpha = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alpha);
            const alphaOut = (await getRootChildrenBacklinksAsPlainObject()).out;
            (0, testUtilsv2_1.expect)(alphaOut).toEqual([]);
            (0, testUtilsv2_1.expect)(alpha.links).toEqual([]);
            const gamma = (await engine.getNote("gamma")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(gamma);
            const gammaOut = (await getRootChildrenBacklinksAsPlainObject()).out;
            (0, testUtilsv2_1.expect)(gammaOut).toEqual([]);
            (0, testUtilsv2_1.expect)(gamma.links).toEqual([]);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a single vault workspace with links and feature flag was not enabled", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "alpha",
                body: "[[beta]] beta",
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "beta",
                body: "alpha",
                vault: vaults[0],
                wsRoot,
            });
        },
    }, () => {
        (0, mocha_1.test)("THEN candidate links don't show up", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            await new ReloadIndex_1.ReloadIndexCommand().execute();
            const alpha = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alpha);
            const { out: alphaOut } = await getRootChildrenBacklinks();
            const alphaOutObj = backlinksToPlainObject(alphaOut);
            (0, testUtilsv2_1.expect)(lodash_1.default.isEmpty(alphaOutObj)).toBeTruthy();
            const beta = (await engine.getNote("beta")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(beta);
            const { out: betaOut } = await getRootChildrenBacklinks();
            const betaOutObj = backlinksToPlainObject(betaOut);
            (0, testUtilsv2_1.expect)(betaOutObj[0].children.length).toEqual(1);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a single vault workspace and a note with many links", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "alpha",
                body: "this note has many links and candidates to it.",
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "beta",
                body: "[[alpha]] alpha alpha [[alpha]] [[alpha]] alpha\nalpha\n\nalpha",
                vault: vaults[0],
                wsRoot,
            });
        },
        modConfigCb: (config) => {
            config.dev = {
                enableLinkCandidates: true,
            };
            return config;
        },
    }, () => {
        (0, mocha_1.test)("THEN multi backlink items are displayed correctly", async () => {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            // need this until we move it out of the feature flag.
            await new ReloadIndex_1.ReloadIndexCommand().execute();
            const alpha = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alpha);
            const { out } = await getRootChildrenBacklinks();
            const outObj = backlinksToPlainObject(out);
            // source should be beta.md
            const sourceTreeItem = outObj[0];
            (0, testUtilsv2_1.expect)(sourceTreeItem.label).toEqual("beta");
            // it should have all links and references in a flat list
            (0, testUtilsv2_1.expect)(sourceTreeItem.children.length).toEqual(8);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a multi vault workspace with xvault links", {
        preSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "alpha",
                body: `[[beta]]`,
                vault: vaults[0],
                wsRoot,
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                fname: "beta",
                body: `[[dendron://${common_all_1.VaultUtils.getName(vaults[0])}/alpha]]`,
                vault: vaults[1],
                wsRoot,
            });
        },
        modConfigCb: (config) => {
            config.dev = {
                enableLinkCandidates: true,
            };
            return config;
        },
    }, () => {
        (0, mocha_1.test)("THEN BacklinksTreeDataProvider calculates correct number of backlinks", async () => {
            const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const alpha = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alpha);
            const { out } = await getRootChildrenBacklinksAsPlainObject();
            const expectedPath = vscode.Uri.file(path_1.default.join(wsRoot, vaults[1].fsPath, "beta.md")).path;
            (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
            (0, testUtilsv2_1.expect)(out.length).toEqual(1);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a single vault workspace and anchor notes", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
        },
    }, () => {
        (0, mocha_1.test)("THEN BacklinksTreeDataProvider calculates correct number of links", async () => {
            const { engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const alpha = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alpha);
            const { out } = await getRootChildrenBacklinksAsPlainObject();
            const expectedPath = vscode.Uri.file(common_all_1.NoteUtils.getFullPath({
                note: (await engine.getNote("beta")).data,
                wsRoot,
            })).path;
            (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
            (0, testUtilsv2_1.expect)(out.length).toEqual(1);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a single vault workspace and alias notes", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
                wsRoot,
                vault: vaults[0],
            });
            await common_test_utils_1.NOTE_PRESETS_V4.NOTE_WITH_ALIAS_LINK.create({
                wsRoot,
                vault: vaults[0],
            });
        },
    }, () => {
        (0, mocha_1.test)("THEN BacklinksTreeDataProvider calculates correct number of links", async () => {
            const { engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const alpha = (await engine.getNote("alpha")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alpha);
            const { out } = await getRootChildrenBacklinksAsPlainObject();
            // assert.strictEqual(
            //   out[0].command.arguments[0].path.toLowerCase() as string,
            //   NoteUtils.getPathV4({ note: noteWithLink, wsRoot })
            // );
            const expectedPath = vscode.Uri.file(common_all_1.NoteUtils.getFullPath({
                note: (await engine.getNote("beta")).data,
                wsRoot,
            })).path;
            (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
            (0, testUtilsv2_1.expect)(out.length).toEqual(1);
        });
    });
    (0, testUtilsV3_1.describeSingleWS)("GIVEN a single vault workspace and hashtags", {
        postSetupHook: async ({ wsRoot, vaults }) => {
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                vault: vaults[0],
                fname: "tags.my.test-0.tag",
            });
            await common_test_utils_1.NoteTestUtilsV4.createNote({
                wsRoot,
                vault: vaults[0],
                fname: "test",
                body: "#my.test-0.tag",
            });
        },
    }, () => {
        (0, mocha_1.test)("THEN BacklinksTreeDataProvider calculates correct number of links", async () => {
            const { engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const alpha = (await engine.getNote("tags.my.test-0.tag")).data;
            await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(alpha);
            const { out } = await getRootChildrenBacklinksAsPlainObject();
            const expectedPath = vscode.Uri.file(common_all_1.NoteUtils.getFullPath({
                note: (await engine.getNote("test")).data,
                wsRoot,
            })).path;
            (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
            (0, testUtilsv2_1.expect)(out.length).toEqual(1);
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("WHEN a basic workspace exists", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        let updateSortOrder;
        let backlinksTreeDataProvider;
        let mockEvents;
        (0, mocha_1.beforeEach)(() => {
            mockEvents = new MockEngineEvents_1.MockEngineEvents();
            backlinksTreeDataProvider = new BacklinksTreeDataProvider_1.default(mockEvents, common_server_1.DConfig.readConfigSync(ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot));
            updateSortOrder = sinon_1.default
                .stub(BacklinksTreeDataProvider_1.default.prototype, "sortOrder")
                .returns(undefined);
        });
        (0, mocha_1.afterEach)(() => {
            updateSortOrder.restore();
            backlinksTreeDataProvider.dispose();
        });
        (0, mocha_1.test)("AND a note gets created, THEN the data provider refresh event gets invoked", (done) => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNoteProps = common_all_1.NoteUtils.create({
                fname: "foo",
                vault: vaults[0],
            });
            const entry = {
                note: testNoteProps,
                status: "create",
            };
            backlinksTreeDataProvider.onDidChangeTreeData(() => {
                done();
            });
            mockEvents.testFireOnNoteChanged([entry]);
        });
        (0, mocha_1.test)("AND a note gets updated, THEN the data provider refresh event gets invoked", (done) => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNoteProps = common_all_1.NoteUtils.create({
                fname: "foo",
                vault: vaults[0],
            });
            const entry = {
                prevNote: testNoteProps,
                note: testNoteProps,
                status: "update",
            };
            backlinksTreeDataProvider.onDidChangeTreeData(() => {
                done();
            });
            mockEvents.testFireOnNoteChanged([entry]);
        });
        (0, mocha_1.test)("AND a note gets deleted, THEN the data provider refresh event gets invoked", (done) => {
            const { vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const testNoteProps = common_all_1.NoteUtils.create({
                fname: "foo",
                vault: vaults[0],
            });
            const entry = {
                note: testNoteProps,
                status: "delete",
            };
            backlinksTreeDataProvider.onDidChangeTreeData(() => {
                done();
            });
            mockEvents.testFireOnNoteChanged([entry]);
        });
    });
});
async function checkNoteBacklinks({ wsRoot, vaults, noteWithTarget, }) {
    (0, testUtilsv2_1.expect)(noteWithTarget).toBeTruthy();
    await ExtensionProvider_1.ExtensionProvider.getWSUtils().openNote(noteWithTarget);
    const { out } = await getRootChildrenBacklinksAsPlainObject();
    const expectedPath = vscode.Uri.file(path_1.default.join(wsRoot, vaults[0].fsPath, "gamma.md")).path;
    (0, testUtilsv2_1.expect)(out[0].command.arguments[0].path.toLowerCase()).toEqual(expectedPath.toLowerCase());
    const ref = out[0].refs[0];
    (0, testUtilsv2_1.expect)(ref.isCandidate).toBeTruthy();
    (0, testUtilsv2_1.expect)(ref.matchText).toEqual("alpha");
    return true;
}
//# sourceMappingURL=BacklinksTreeDataProvider.test.js.map