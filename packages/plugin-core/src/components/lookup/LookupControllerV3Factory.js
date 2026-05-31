"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupControllerV3Factory = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const TwoWayBinding_1 = require("../../utils/TwoWayBinding");
const buttons_1 = require("./buttons");
const LookupControllerV3_1 = require("./LookupControllerV3");
const types_1 = require("./types");
class LookupControllerV3Factory {
    extension;
    constructor(extension) {
        this.extension = extension;
    }
    create(opts) {
        const { vaults } = this.extension.getDWorkspace();
        // disable vault selection if explicitly requested or we are looking at schemas
        const disableVaultSelection = (lodash_1.default.isBoolean(opts?.disableVaultSelection) &&
            opts?.disableVaultSelection) ||
            opts?.nodeType === "schema";
        // --- start: multi vault selection check
        const isMultiVault = vaults.length > 1 && !disableVaultSelection;
        // should vault toggle be pressed?
        const maybeVaultSelectButtonPressed = lodash_1.default.isUndefined(opts?.vaultButtonPressed)
            ? isMultiVault
            : isMultiVault && opts.vaultButtonPressed;
        const maybeVaultSelectButton = opts?.nodeType === "note" && isMultiVault
            ? [
                buttons_1.VaultSelectButton.create({
                    pressed: maybeVaultSelectButtonPressed,
                    canToggle: opts?.vaultSelectCanToggle,
                }),
            ]
            : [];
        // --- end: multi vault selection check
        const buttons = opts?.buttons || maybeVaultSelectButton;
        const extraButtons = opts?.extraButtons || [];
        const viewModel = {
            selectionState: new TwoWayBinding_1.TwoWayBinding(common_all_1.LookupSelectionTypeEnum.none),
            vaultSelectionMode: new TwoWayBinding_1.TwoWayBinding(types_1.VaultSelectionMode.auto),
            isMultiSelectEnabled: new TwoWayBinding_1.TwoWayBinding(false),
            isCopyNoteLinkEnabled: new TwoWayBinding_1.TwoWayBinding(false),
            isApplyDirectChildFilter: new TwoWayBinding_1.TwoWayBinding(false),
            nameModifierMode: new TwoWayBinding_1.TwoWayBinding(common_all_1.LookupNoteTypeEnum.none),
            isSplitHorizontally: new TwoWayBinding_1.TwoWayBinding(false),
        };
        return new LookupControllerV3_1.LookupControllerV3({
            nodeType: opts?.nodeType,
            fuzzThreshold: opts?.fuzzThreshold,
            buttons: buttons.concat(extraButtons),
            enableLookupView: opts?.enableLookupView,
            title: opts?.title,
            viewModel,
        });
    }
}
exports.LookupControllerV3Factory = LookupControllerV3Factory;
//# sourceMappingURL=LookupControllerV3Factory.js.map