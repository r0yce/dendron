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
const lodash_1 = __importDefault(require("lodash"));
const mocha_1 = require("mocha");
const vscode = __importStar(require("vscode"));
const buttons_1 = require("../../../../../src/components/lookup/buttons");
const LookupV3QuickPickView_1 = require("../../../../../src/components/views/LookupV3QuickPickView");
const TwoWayBinding_1 = require("../../../../utils/TwoWayBinding");
const types_1 = require("../../../../components/lookup/types");
const testUtilsv2_1 = require("../../../testUtilsv2");
const isButtonPressed = function (type, buttons) {
    const button = lodash_1.default.find(buttons, (value) => value.type === type);
    return button.pressed;
};
(0, mocha_1.describe)(`GIVEN a LookupV3QuickPick`, () => {
    const qp = vscode.window.createQuickPick();
    qp.buttons = [
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
    const viewModel = {
        selectionState: new TwoWayBinding_1.TwoWayBinding(common_all_1.LookupSelectionTypeEnum.none),
        vaultSelectionMode: new TwoWayBinding_1.TwoWayBinding(types_1.VaultSelectionMode.auto),
        isMultiSelectEnabled: new TwoWayBinding_1.TwoWayBinding(false),
        isCopyNoteLinkEnabled: new TwoWayBinding_1.TwoWayBinding(false),
        isApplyDirectChildFilter: new TwoWayBinding_1.TwoWayBinding(false),
        nameModifierMode: new TwoWayBinding_1.TwoWayBinding(common_all_1.LookupNoteTypeEnum.none),
        isSplitHorizontally: new TwoWayBinding_1.TwoWayBinding(false),
    };
    let viewToTest;
    (0, mocha_1.before)(() => {
        viewToTest = new LookupV3QuickPickView_1.LookupV3QuickPickView(qp, viewModel);
    });
    (0, mocha_1.after)(() => {
        if (viewToTest) {
            viewToTest.dispose();
            viewToTest = undefined;
        }
    });
    (0, mocha_1.describe)(`WHEN mode changed to selection2Items`, () => {
        (0, mocha_1.it)(`THEN selection2Items button checked and Extract and toLink buttons unchecked`, () => {
            viewModel.selectionState.value = common_all_1.LookupSelectionTypeEnum.selection2Items;
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2Items", qp.buttons)).toBeTruthy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selectionExtract", qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2link", qp.buttons)).toBeFalsy();
        });
    });
    (0, mocha_1.describe)(`WHEN mode changed to selection2Link`, () => {
        (0, mocha_1.it)(`THEN selection2Link button checked and Extract and toItems buttons unchecked`, () => {
            viewModel.selectionState.value = common_all_1.LookupSelectionTypeEnum.selection2link;
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2Items", qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selectionExtract", qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2link", qp.buttons)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)(`WHEN mode changed to selection2Extract`, () => {
        (0, mocha_1.it)(`THEN selection2Extract button checked and toItems and toLink buttons unchecked`, () => {
            viewModel.selectionState.value = common_all_1.LookupSelectionTypeEnum.selectionExtract;
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2Items", qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selectionExtract", qp.buttons)).toBeTruthy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2link", qp.buttons)).toBeFalsy();
        });
    });
    (0, mocha_1.describe)(`WHEN mode changed to None`, () => {
        (0, mocha_1.it)(`THEN extract, toItems, toLink buttons all unchecked`, () => {
            viewModel.selectionState.value = common_all_1.LookupSelectionTypeEnum.none;
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2Items", qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selectionExtract", qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed("selection2link", qp.buttons)).toBeFalsy();
        });
    });
    (0, mocha_1.describe)(`WHEN vaultSelection is alwaysPrompt`, () => {
        (0, mocha_1.it)(`THEN vaultSelection button is checked`, () => {
            viewModel.vaultSelectionMode.value = types_1.VaultSelectionMode.alwaysPrompt;
            (0, testUtilsv2_1.expect)(isButtonPressed("selectVault", qp.buttons)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)(`WHEN vaultSelection is smart`, () => {
        (0, mocha_1.it)(`THEN vaultSelection button is unchecked`, () => {
            viewModel.vaultSelectionMode.value = types_1.VaultSelectionMode.smart;
            (0, testUtilsv2_1.expect)(isButtonPressed("selectVault", qp.buttons)).toBeFalsy();
        });
    });
    (0, mocha_1.describe)(`WHEN multiSelect is enabled`, () => {
        (0, mocha_1.it)(`THEN multiSelect button is checked`, () => {
            viewModel.isMultiSelectEnabled.value = true;
            (0, testUtilsv2_1.expect)(isButtonPressed("multiSelect", qp.buttons)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)(`WHEN multiSelect is disabled`, () => {
        (0, mocha_1.it)(`THEN multiSelect button is unchecked`, () => {
            viewModel.isMultiSelectEnabled.value = false;
            (0, testUtilsv2_1.expect)(isButtonPressed("multiSelect", qp.buttons)).toBeFalsy();
        });
    });
    // Copy Note Link State
    (0, mocha_1.describe)(`WHEN copyNoteLink is enabled`, () => {
        (0, mocha_1.it)(`THEN copyNoteLink button is checked`, () => {
            viewModel.isCopyNoteLinkEnabled.value = true;
            (0, testUtilsv2_1.expect)(isButtonPressed("copyNoteLink", qp.buttons)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)(`WHEN copyNoteLink is disabled`, () => {
        (0, mocha_1.it)(`THEN copyNoteLink button is unchecked`, () => {
            viewModel.isCopyNoteLinkEnabled.value = false;
            (0, testUtilsv2_1.expect)(isButtonPressed("copyNoteLink", qp.buttons)).toBeFalsy();
        });
    });
    // Direct Child Only state
    (0, mocha_1.describe)(`WHEN directChildOnly is enabled`, () => {
        (0, mocha_1.it)(`THEN directChildOnly button is checked`, () => {
            viewModel.isApplyDirectChildFilter.value = true;
            (0, testUtilsv2_1.expect)(isButtonPressed("directChildOnly", qp.buttons)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)(`WHEN directChildOnly is disabled`, () => {
        (0, mocha_1.it)(`THEN directChildOnly button is unchecked`, () => {
            viewModel.isApplyDirectChildFilter.value = false;
            (0, testUtilsv2_1.expect)(isButtonPressed("directChildOnly", qp.buttons)).toBeFalsy();
        });
    });
    // Horizontal Split state
    (0, mocha_1.describe)(`WHEN horizontal split is enabled`, () => {
        (0, mocha_1.it)(`THEN horizontal button is checked`, () => {
            viewModel.isSplitHorizontally.value = true;
            (0, testUtilsv2_1.expect)(isButtonPressed("horizontal", qp.buttons)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)(`WHEN horizontal split is disabled`, () => {
        (0, mocha_1.it)(`THEN horizontal button is unchecked`, () => {
            viewModel.isSplitHorizontally.value = false;
            (0, testUtilsv2_1.expect)(isButtonPressed("horizontal", qp.buttons)).toBeFalsy();
        });
    });
    // Name Modifier Options (Journal / Scratch / Task):
    (0, mocha_1.describe)(`WHEN name modifier mode changed to Journal`, () => {
        (0, mocha_1.it)(`THEN journal button checked and scratch and task buttons unchecked`, () => {
            viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.journal;
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.journal, qp.buttons)).toBeTruthy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.scratch, qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.task, qp.buttons)).toBeFalsy();
        });
    });
    (0, mocha_1.describe)(`WHEN name modifier mode changed to Scratch`, () => {
        (0, mocha_1.it)(`THEN scratch button checked and journal and task buttons unchecked`, () => {
            viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.scratch;
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.journal, qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.scratch, qp.buttons)).toBeTruthy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.task, qp.buttons)).toBeFalsy();
        });
    });
    (0, mocha_1.describe)(`WHEN name modifier mode changed to Task`, () => {
        (0, mocha_1.it)(`THEN task button checked and journal and scratch buttons unchecked`, () => {
            viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.task;
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.journal, qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.scratch, qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.task, qp.buttons)).toBeTruthy();
        });
    });
    (0, mocha_1.describe)(`WHEN name modifier mode changed to None`, () => {
        (0, mocha_1.it)(`THEN journal, scratch, task buttons all unchecked`, () => {
            viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.none;
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.journal, qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.scratch, qp.buttons)).toBeFalsy();
            (0, testUtilsv2_1.expect)(isButtonPressed(common_all_1.LookupNoteTypeEnum.task, qp.buttons)).toBeFalsy();
        });
    });
});
//# sourceMappingURL=LookupViewModel.test.js.map