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
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const engine_test_utils_1 = require("@dendronhq/engine-test-utils");
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const buttons_1 = require("../../../../../src/components/lookup/buttons");
const LookupControllerV3_1 = require("../../../../../src/components/lookup/LookupControllerV3");
const LookupProviderV3Factory_1 = require("../../../../../src/components/lookup/LookupProviderV3Factory");
const ExtensionProvider_1 = require("../../../../../src/ExtensionProvider");
const TwoWayBinding_1 = require("../../../../utils/TwoWayBinding");
const WSUtilsV2_1 = require("../../../../../src/WSUtilsV2");
const types_1 = require("../../../../components/lookup/types");
const testUtilsv2_1 = require("../../../testUtilsv2");
const testUtilsV3_1 = require("../../../testUtilsV3");
const common_test_utils_1 = require("@dendronhq/common-test-utils");
(0, mocha_1.describe)(`GIVEN a LookupControllerV3`, () => {
    const viewModel = {
        selectionState: new TwoWayBinding_1.TwoWayBinding(common_all_1.LookupSelectionTypeEnum.none),
        vaultSelectionMode: new TwoWayBinding_1.TwoWayBinding(types_1.VaultSelectionMode.auto),
        isMultiSelectEnabled: new TwoWayBinding_1.TwoWayBinding(false),
        isCopyNoteLinkEnabled: new TwoWayBinding_1.TwoWayBinding(false),
        isApplyDirectChildFilter: new TwoWayBinding_1.TwoWayBinding(false),
        nameModifierMode: new TwoWayBinding_1.TwoWayBinding(common_all_1.LookupNoteTypeEnum.none),
        isSplitHorizontally: new TwoWayBinding_1.TwoWayBinding(false),
    };
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a LookupControllerV3", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        const buttons = [
            buttons_1.VaultSelectButton.create({ pressed: false }),
            buttons_1.MultiSelectBtn.create({ pressed: false }),
            buttons_1.CopyNoteLinkBtn.create(false),
            buttons_1.DirectChildFilterBtn.create(false),
            buttons_1.SelectionExtractBtn.create({ pressed: false }),
            buttons_1.Selection2LinkBtn.create(false),
            buttons_1.Selection2ItemsBtn.create({
                pressed: false,
            }),
            buttons_1.JournalBtn.create({
                pressed: false,
            }),
            buttons_1.ScratchBtn.create({
                pressed: false,
            }),
            buttons_1.TaskBtn.create(false),
            buttons_1.HorizontalSplitBtn.create(false),
        ];
        const controller = new LookupControllerV3_1.LookupControllerV3({
            nodeType: "note",
            buttons,
            title: "Test Quick Pick",
            viewModel,
        });
        (0, mocha_1.describe)(`WHEN journal mode is toggled`, () => {
            test(`THEN the contents of the quick pick update with 'journal'`, async () => {
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                await WSUtilsV2_1.WSUtilsV2.instance().openNote((await engine.getNoteMeta("foo")).data);
                const provider = new LookupProviderV3Factory_1.NoteLookupProviderFactory(ExtensionProvider_1.ExtensionProvider.getExtension()).create("test", {
                    allowNewNote: true,
                });
                controller.prepareQuickPick({
                    placeholder: "foo",
                    provider,
                    initialValue: "foo",
                    nonInteractive: true,
                    alwaysShow: true,
                });
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.journal;
                const qp = controller.quickPick;
                (0, testUtilsv2_1.expect)(qp.value.startsWith("foo.journal.")).toBeTruthy();
                // Now untoggle the button:
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.none;
                (0, testUtilsv2_1.expect)(qp.value).toEqual("foo");
            });
        });
        (0, mocha_1.describe)(`WHEN scratch mode is toggled`, () => {
            test(`THEN the contents of the quick pick update with 'scratch'`, async () => {
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                await WSUtilsV2_1.WSUtilsV2.instance().openNote((await engine.getNoteMeta("foo")).data);
                const provider = new LookupProviderV3Factory_1.NoteLookupProviderFactory(ExtensionProvider_1.ExtensionProvider.getExtension()).create("test", {
                    allowNewNote: true,
                });
                controller.prepareQuickPick({
                    placeholder: "foo",
                    provider,
                    initialValue: "foo",
                    nonInteractive: true,
                    alwaysShow: true,
                });
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.scratch;
                const qp = controller.quickPick;
                (0, testUtilsv2_1.expect)(qp.value.startsWith("scratch.")).toBeTruthy();
                // Now untoggle the button:
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.none;
                (0, testUtilsv2_1.expect)(qp.value).toEqual("foo");
            });
        });
        (0, mocha_1.describe)(`WHEN task mode is toggled`, () => {
            test(`THEN the contents of the quick pick update with 'task.'`, async () => {
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                await WSUtilsV2_1.WSUtilsV2.instance().openNote((await engine.getNoteMeta("foo")).data);
                const provider = new LookupProviderV3Factory_1.NoteLookupProviderFactory(ExtensionProvider_1.ExtensionProvider.getExtension()).create("test", {
                    allowNewNote: true,
                });
                controller.prepareQuickPick({
                    placeholder: "foo",
                    provider,
                    initialValue: "foo",
                    nonInteractive: true,
                    alwaysShow: true,
                });
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.task;
                const qp = controller.quickPick;
                (0, testUtilsv2_1.expect)(qp.value.startsWith("task.")).toBeTruthy();
                // Now untoggle the button:
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.none;
                (0, testUtilsv2_1.expect)(qp.value).toEqual("foo");
            });
        });
    });
    (0, testUtilsV3_1.describeMultiWS)("GIVEN a LookupControllerV3 with selection2Link enabled at the start", {
        preSetupHook: engine_test_utils_1.ENGINE_HOOKS.setupBasic,
    }, () => {
        const buttons = [
            buttons_1.VaultSelectButton.create({ pressed: false }),
            buttons_1.MultiSelectBtn.create({ pressed: false }),
            buttons_1.CopyNoteLinkBtn.create(false),
            buttons_1.DirectChildFilterBtn.create(false),
            buttons_1.SelectionExtractBtn.create({ pressed: false }),
            buttons_1.Selection2LinkBtn.create(true),
            buttons_1.Selection2ItemsBtn.create({
                pressed: false,
            }),
            buttons_1.JournalBtn.create({
                pressed: false,
            }),
            buttons_1.ScratchBtn.create({
                pressed: false,
            }),
            buttons_1.TaskBtn.create(false),
            buttons_1.HorizontalSplitBtn.create(false),
        ];
        const controller = new LookupControllerV3_1.LookupControllerV3({
            nodeType: "note",
            buttons,
            title: "Test Quick Pick",
            viewModel,
        });
        (0, mocha_1.describe)(`WHEN journal mode is toggled on/off when selection2Link is already enabled`, () => {
            test(`THEN the contents of the quick pick restore to the original selection2Link value properly`, async () => {
                const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                const fooNoteEditor = await WSUtilsV2_1.WSUtilsV2.instance().openNote((await engine.getNoteMeta("foo")).data);
                // selects "foo body"
                fooNoteEditor.selection = new vscode.Selection(7, 0, 7, 12);
                const provider = new LookupProviderV3Factory_1.NoteLookupProviderFactory(ExtensionProvider_1.ExtensionProvider.getExtension()).create("test", {
                    allowNewNote: true,
                });
                controller.prepareQuickPick({
                    placeholder: "foo",
                    provider,
                    initialValue: "foo",
                    nonInteractive: true,
                    alwaysShow: true,
                });
                const qp = controller.quickPick;
                (0, testUtilsv2_1.expect)(qp.value).toEqual("foo.foo-body");
                // Toggle the journal Button
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.journal;
                (0, testUtilsv2_1.expect)(qp.value.startsWith("foo.journal.")).toBeTruthy();
                // Now untoggle the button:
                viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.none;
                (0, testUtilsv2_1.expect)(qp.value).toEqual("foo.foo-body");
            });
        });
    });
    suite("selection2Items", () => {
        let active;
        let activeWithAmbiguousLink;
        let activeWithNonUniqueLinks;
        (0, testUtilsV3_1.describeMultiWS)("GIVEN a LookupControllerV3 with Selection2Items enabled at the start", {
            preSetupHook: async ({ vaults, wsRoot }) => {
                await engine_test_utils_1.ENGINE_HOOKS.setupBasic({ vaults, wsRoot });
                active = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    wsRoot,
                    fname: "active",
                    body: "[[dendron.ginger]]\n[[dendron.dragonfruit]]\n[[dendron.clementine]]",
                });
                activeWithAmbiguousLink = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    wsRoot,
                    fname: "active-ambiguous",
                    body: "[[pican]]",
                });
                activeWithNonUniqueLinks = await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    wsRoot,
                    fname: "active-dedupe",
                    body: "[[dendron.ginger]]\n\n[[Ginger|dendron.ginger]]\n\n[[Lots of Ginger|dendron.ginger]]\n\n",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    genRandomId: true,
                    vault: engine_test_utils_1.TestEngineUtils.vault2(vaults),
                    wsRoot,
                    fname: "pican",
                    body: "",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    genRandomId: true,
                    vault: engine_test_utils_1.TestEngineUtils.vault3(vaults),
                    wsRoot,
                    fname: "pican",
                    body: "",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    wsRoot,
                    fname: "dendron.ginger",
                    body: "",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    wsRoot,
                    fname: "dendron.dragonfruit",
                    body: "",
                });
                await common_test_utils_1.NoteTestUtilsV4.createNote({
                    vault: engine_test_utils_1.TestEngineUtils.vault1(vaults),
                    wsRoot,
                    fname: "dendron.clementine",
                    body: "",
                });
            },
        }, () => {
            const buttons = [
                buttons_1.VaultSelectButton.create({ pressed: false }),
                buttons_1.MultiSelectBtn.create({ pressed: false }),
                buttons_1.CopyNoteLinkBtn.create(false),
                buttons_1.DirectChildFilterBtn.create(false),
                buttons_1.SelectionExtractBtn.create({ pressed: false }),
                buttons_1.Selection2LinkBtn.create(false),
                buttons_1.Selection2ItemsBtn.create({
                    pressed: true,
                }),
                buttons_1.JournalBtn.create({
                    pressed: false,
                }),
                buttons_1.ScratchBtn.create({
                    pressed: false,
                }),
                buttons_1.TaskBtn.create(false),
                buttons_1.HorizontalSplitBtn.create(false),
            ];
            const controller = new LookupControllerV3_1.LookupControllerV3({
                nodeType: "note",
                buttons,
                title: "Test Quick Pick",
                viewModel,
            });
            (0, mocha_1.describe)(`GIVEN an active note with selection that contains wikilinks`, () => {
                test(`THEN quickpick is populated with notes that were selected.`, async () => {
                    const editor = await WSUtilsV2_1.WSUtilsV2.instance().openNote(active);
                    editor.selection = new vscode.Selection(7, 0, 10, 0);
                    const provider = new LookupProviderV3Factory_1.NoteLookupProviderFactory(ExtensionProvider_1.ExtensionProvider.getExtension()).create("test", {
                        allowNewNote: true,
                    });
                    await controller.prepareQuickPick({
                        placeholder: "foo",
                        provider,
                        initialValue: "foo",
                        nonInteractive: true,
                        alwaysShow: true,
                    });
                    const { onSelect2ItemsBtnToggled } = controller.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
                    await onSelect2ItemsBtnToggled(true);
                    const expectedItemLabels = [
                        "dendron.ginger",
                        "dendron.dragonfruit",
                        "dendron.clementine",
                    ];
                    const actualItemLabels = controller.quickPick.itemsFromSelection.map((item) => item.label);
                    (0, testUtilsv2_1.expect)(expectedItemLabels).toEqual(actualItemLabels);
                });
                test(`THEN if selected wikilink's vault is ambiguous, list all notes with same fname across all vaults.`, async () => {
                    const editor = await WSUtilsV2_1.WSUtilsV2.instance().openNote(activeWithAmbiguousLink);
                    editor.selection = new vscode.Selection(7, 0, 8, 0);
                    const provider = new LookupProviderV3Factory_1.NoteLookupProviderFactory(ExtensionProvider_1.ExtensionProvider.getExtension()).create("test", {
                        allowNewNote: true,
                    });
                    await controller.prepareQuickPick({
                        placeholder: "foo",
                        provider,
                        initialValue: "foo",
                        nonInteractive: true,
                        alwaysShow: true,
                    });
                    const { onSelect2ItemsBtnToggled } = controller.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
                    await onSelect2ItemsBtnToggled(true);
                    const expectedItemLabels = ["pican", "pican"];
                    const actualItemLabels = controller.quickPick.itemsFromSelection.map((item) => item.label);
                    (0, testUtilsv2_1.expect)(expectedItemLabels).toEqual(actualItemLabels);
                });
                test(`THEN if selection contains links that point to same note, correctly dedupes them`, async () => {
                    const editor = await WSUtilsV2_1.WSUtilsV2.instance().openNote(activeWithNonUniqueLinks);
                    editor.selection = new vscode.Selection(7, 0, 10, 0);
                    const provider = new LookupProviderV3Factory_1.NoteLookupProviderFactory(ExtensionProvider_1.ExtensionProvider.getExtension()).create("test", {
                        allowNewNote: true,
                    });
                    await controller.prepareQuickPick({
                        placeholder: "foo",
                        provider,
                        initialValue: "foo",
                        nonInteractive: true,
                        alwaysShow: true,
                    });
                    const { onSelect2ItemsBtnToggled } = controller.__DO_NOT_USE_IN_PROD_exposePropsForTesting();
                    await onSelect2ItemsBtnToggled(true);
                    const expectedItemLabels = ["dendron.ginger"];
                    const actualItemLabels = controller.quickPick.itemsFromSelection.map((item) => item.label);
                    (0, testUtilsv2_1.expect)(expectedItemLabels).toEqual(actualItemLabels);
                });
            });
        });
    });
});
//# sourceMappingURL=LookupControllerV3.test.js.map