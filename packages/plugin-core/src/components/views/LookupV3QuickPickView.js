"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupV3QuickPickView = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const analytics_1 = require("../../utils/analytics");
const types_1 = require("../lookup/types");
/**
 * A 'view' that represents the UI state of the Lookup Quick Pick. This
 * essentially controls the button state of the quick pick and reacts upon user
 * mouse clicks to the buttons.
 */
class LookupV3QuickPickView {
    _quickPick;
    _viewState;
    _disposables;
    _providerId;
    constructor(quickPick, viewModel, providerId // For telemetry purposes only
    ) {
        this._quickPick = quickPick;
        this._viewState = viewModel;
        this._providerId = providerId;
        this._disposables = [];
        this.setupViewModel();
        this._disposables.push(this._quickPick.onDidTriggerButton(this.onTriggerButton));
    }
    dispose() {
        this._disposables.forEach((callback) => callback.dispose());
    }
    setupViewModel() {
        const ToLinkBtn = this.getButton("selection2link");
        const ExtractBtn = this.getButton("selectionExtract");
        const ToItemsBtn = this.getButton("selection2Items");
        this._disposables.push(this._viewState.selectionState.bind(async (newValue) => {
            switch (newValue) {
                case common_all_1.LookupSelectionTypeEnum.selection2Items: {
                    if (ToLinkBtn)
                        ToLinkBtn.pressed = false;
                    if (ExtractBtn)
                        ExtractBtn.pressed = false;
                    if (ToItemsBtn)
                        ToItemsBtn.pressed = true;
                    break;
                }
                case common_all_1.LookupSelectionTypeEnum.selection2link: {
                    if (ToLinkBtn)
                        ToLinkBtn.pressed = true;
                    if (ExtractBtn)
                        ExtractBtn.pressed = false;
                    if (ToItemsBtn)
                        ToItemsBtn.pressed = false;
                    break;
                }
                case common_all_1.LookupSelectionTypeEnum.selectionExtract: {
                    if (ToLinkBtn)
                        ToLinkBtn.pressed = false;
                    if (ExtractBtn)
                        ExtractBtn.pressed = true;
                    if (ToItemsBtn)
                        ToItemsBtn.pressed = false;
                    break;
                }
                case common_all_1.LookupSelectionTypeEnum.none: {
                    if (ToLinkBtn)
                        ToLinkBtn.pressed = false;
                    if (ExtractBtn)
                        ExtractBtn.pressed = false;
                    if (ToItemsBtn)
                        ToItemsBtn.pressed = false;
                    break;
                }
                default:
                    (0, common_all_1.assertUnreachable)(newValue);
            }
            const buttons = [];
            if (ToLinkBtn)
                buttons.push(ToLinkBtn);
            if (ExtractBtn)
                buttons.push(ExtractBtn);
            if (ToItemsBtn)
                buttons.push(ToItemsBtn);
            this.updateButtonsOnQuickPick(...buttons);
        }));
        const vaultSelectionBtn = this.getButton("selectVault");
        if (vaultSelectionBtn !== undefined) {
            this._disposables.push(this._viewState.vaultSelectionMode.bind(async (newValue) => {
                vaultSelectionBtn.pressed =
                    newValue === types_1.VaultSelectionMode.alwaysPrompt;
                this.updateButtonsOnQuickPick(vaultSelectionBtn);
            }));
        }
        const multiSelectBtn = this.getButton("multiSelect");
        if (multiSelectBtn) {
            this._disposables.push(this._viewState.isMultiSelectEnabled.bind(async (newValue) => {
                multiSelectBtn.pressed = newValue;
                this.updateButtonsOnQuickPick(multiSelectBtn);
            }));
        }
        const copyLinkBtn = this.getButton("copyNoteLink");
        if (copyLinkBtn) {
            this._disposables.push(this._viewState.isCopyNoteLinkEnabled.bind(async (enabled) => {
                copyLinkBtn.pressed = enabled;
                this.updateButtonsOnQuickPick(copyLinkBtn);
            }));
        }
        const directChildBtn = this.getButton("directChildOnly");
        if (directChildBtn) {
            this._disposables.push(this._viewState.isApplyDirectChildFilter.bind(async (newValue) => {
                directChildBtn.pressed = newValue;
                this.updateButtonsOnQuickPick(directChildBtn);
            }));
        }
        const journalBtn = this.getButton(common_all_1.LookupNoteTypeEnum.journal);
        const scratchBtn = this.getButton(common_all_1.LookupNoteTypeEnum.scratch);
        const taskBtn = this.getButton(common_all_1.LookupNoteTypeEnum.task);
        this._disposables.push(this._viewState.nameModifierMode.bind(async (newValue) => {
            switch (newValue) {
                case common_all_1.LookupNoteTypeEnum.journal:
                    if (journalBtn)
                        journalBtn.pressed = true;
                    if (scratchBtn)
                        scratchBtn.pressed = false;
                    if (taskBtn)
                        taskBtn.pressed = false;
                    break;
                case common_all_1.LookupNoteTypeEnum.scratch:
                    if (journalBtn)
                        journalBtn.pressed = false;
                    if (scratchBtn)
                        scratchBtn.pressed = true;
                    if (taskBtn)
                        taskBtn.pressed = false;
                    break;
                case common_all_1.LookupNoteTypeEnum.task:
                    if (journalBtn)
                        journalBtn.pressed = false;
                    if (scratchBtn)
                        scratchBtn.pressed = false;
                    if (taskBtn)
                        taskBtn.pressed = true;
                    break;
                case common_all_1.LookupNoteTypeEnum.none:
                    if (journalBtn)
                        journalBtn.pressed = false;
                    if (scratchBtn)
                        scratchBtn.pressed = false;
                    if (taskBtn)
                        taskBtn.pressed = false;
                    break;
                default:
                    (0, common_all_1.assertUnreachable)(newValue);
            }
            const validButtons = [];
            if (journalBtn)
                validButtons.push(journalBtn);
            if (scratchBtn)
                validButtons.push(scratchBtn);
            if (taskBtn)
                validButtons.push(taskBtn);
            this.updateButtonsOnQuickPick(...validButtons);
        }));
        const horizontalBtn = this.getButton("horizontal");
        if (horizontalBtn) {
            this._disposables.push(this._viewState.isSplitHorizontally.bind(async (splitHorizontally) => {
                horizontalBtn.pressed = splitHorizontally;
                this.updateButtonsOnQuickPick(horizontalBtn);
            }));
        }
    }
    getButtonFromArray(type, buttons) {
        return lodash_1.default.find(buttons, (value) => value.type === type);
    }
    getButton(type) {
        if (this._quickPick) {
            return this.getButtonFromArray(type, this._quickPick?.buttons);
        }
        return;
    }
    updateButtonsOnQuickPick(...btns) {
        const newButtons = this._quickPick.buttons.map((b) => {
            const toUpdate = lodash_1.default.find(btns, (value) => value.type === b.type);
            if (toUpdate) {
                return toUpdate;
            }
            else {
                return b.clone();
            }
        });
        this._quickPick.buttons = newButtons;
    }
    onTriggerButton = (btn) => {
        const btnType = btn.type;
        switch (btnType) {
            case common_all_1.LookupSelectionTypeEnum.selection2Items:
                if (this.getButton(common_all_1.LookupSelectionTypeEnum.selection2Items)?.canToggle) {
                    this._viewState.selectionState.value =
                        this._viewState.selectionState.value ===
                            common_all_1.LookupSelectionTypeEnum.selection2Items
                            ? common_all_1.LookupSelectionTypeEnum.none
                            : common_all_1.LookupSelectionTypeEnum.selection2Items;
                }
                break;
            case common_all_1.LookupSelectionTypeEnum.selection2link:
                if (this.getButton(common_all_1.LookupSelectionTypeEnum.selection2link)?.canToggle) {
                    this._viewState.selectionState.value =
                        this._viewState.selectionState.value ===
                            common_all_1.LookupSelectionTypeEnum.selection2link
                            ? common_all_1.LookupSelectionTypeEnum.none
                            : common_all_1.LookupSelectionTypeEnum.selection2link;
                }
                break;
            case common_all_1.LookupSelectionTypeEnum.selectionExtract:
                if (this.getButton(common_all_1.LookupSelectionTypeEnum.selectionExtract)?.canToggle) {
                    this._viewState.selectionState.value =
                        this._viewState.selectionState.value ===
                            common_all_1.LookupSelectionTypeEnum.selectionExtract
                            ? common_all_1.LookupSelectionTypeEnum.none
                            : common_all_1.LookupSelectionTypeEnum.selectionExtract;
                }
                break;
            case "selectVault": {
                if (this.getButton("selectVault")?.canToggle) {
                    this._viewState.vaultSelectionMode.value =
                        this._viewState.vaultSelectionMode.value ===
                            types_1.VaultSelectionMode.alwaysPrompt
                            ? types_1.VaultSelectionMode.smart
                            : types_1.VaultSelectionMode.alwaysPrompt;
                }
                break;
            }
            case "multiSelect": {
                if (this.getButton("multiSelect")?.canToggle) {
                    this._viewState.isMultiSelectEnabled.value =
                        !this._viewState.isMultiSelectEnabled.value;
                }
                break;
            }
            case "copyNoteLink": {
                if (this.getButton("copyNoteLink")?.canToggle) {
                    this._viewState.isCopyNoteLinkEnabled.value =
                        !this._viewState.isCopyNoteLinkEnabled.value;
                }
                break;
            }
            case "directChildOnly": {
                if (this.getButton("directChildOnly")?.canToggle) {
                    this._viewState.isApplyDirectChildFilter.value =
                        !this._viewState.isApplyDirectChildFilter.value;
                }
                break;
            }
            case common_all_1.LookupNoteTypeEnum.journal: {
                if (this.getButton(common_all_1.LookupNoteTypeEnum.journal)?.canToggle) {
                    this._viewState.nameModifierMode.value =
                        this._viewState.nameModifierMode.value ===
                            common_all_1.LookupNoteTypeEnum.journal
                            ? common_all_1.LookupNoteTypeEnum.none
                            : common_all_1.LookupNoteTypeEnum.journal;
                }
                break;
            }
            case common_all_1.LookupNoteTypeEnum.scratch: {
                if (this.getButton(common_all_1.LookupNoteTypeEnum.scratch)?.canToggle) {
                    this._viewState.nameModifierMode.value =
                        this._viewState.nameModifierMode.value ===
                            common_all_1.LookupNoteTypeEnum.scratch
                            ? common_all_1.LookupNoteTypeEnum.none
                            : common_all_1.LookupNoteTypeEnum.scratch;
                }
                break;
            }
            case common_all_1.LookupNoteTypeEnum.task: {
                if (this.getButton(common_all_1.LookupNoteTypeEnum.task)?.canToggle) {
                    this._viewState.nameModifierMode.value =
                        this._viewState.nameModifierMode.value === common_all_1.LookupNoteTypeEnum.task
                            ? common_all_1.LookupNoteTypeEnum.none
                            : common_all_1.LookupNoteTypeEnum.task;
                }
                break;
            }
            case "horizontal": {
                if (this.getButton("horizontal")?.canToggle) {
                    this._viewState.isSplitHorizontally.value =
                        !this._viewState.isSplitHorizontally.value;
                }
                break;
            }
            default:
                break;
        }
        analytics_1.AnalyticsUtils.track(common_all_1.LookupEvents.LookupModifierToggledByUser, {
            command: this._providerId,
            type: btn.type,
            pressed: btn.pressed,
        });
    };
}
exports.LookupV3QuickPickView = LookupV3QuickPickView;
//# sourceMappingURL=LookupV3QuickPickView.js.map