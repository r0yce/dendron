"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultSelectButton = exports.CopyNoteLinkBtn = exports.MultiSelectBtn = exports.DirectChildFilterBtn = exports.HorizontalSplitBtn = exports.TaskBtn = exports.ScratchBtn = exports.JournalBtn = exports.Selection2ItemsBtn = exports.SelectionExtractBtn = exports.Selection2LinkBtn = void 0;
exports.createAllButtons = createAllButtons;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const ButtonTypes_1 = require("./ButtonTypes");
class Selection2LinkBtn extends ButtonTypes_1.DendronBtn {
    static create(pressed) {
        return new Selection2LinkBtn({
            title: "Selection to Link",
            description: common_all_1.MODIFIER_DESCRIPTIONS["selection2link"] || "",
            iconOff: "link",
            iconOn: "menu-selection",
            type: "selection2link",
            pressed,
        });
    }
}
exports.Selection2LinkBtn = Selection2LinkBtn;
class SelectionExtractBtn extends ButtonTypes_1.DendronBtn {
    static create(opts) {
        const { pressed, canToggle } = lodash_1.default.defaults(opts, {
            pressed: false,
            canToggle: true,
        });
        return new SelectionExtractBtn({
            title: "Selection Extract",
            description: common_all_1.MODIFIER_DESCRIPTIONS["selectionExtract"] || "",
            iconOff: "find-selection",
            iconOn: "menu-selection",
            type: "selectionExtract",
            pressed,
            canToggle,
        });
    }
}
exports.SelectionExtractBtn = SelectionExtractBtn;
class Selection2ItemsBtn extends ButtonTypes_1.DendronBtn {
    static create(opts) {
        const { pressed, canToggle } = lodash_1.default.defaults(opts, {
            pressed: false,
            canToggle: true,
        });
        return new Selection2ItemsBtn({
            title: "Selection to Items",
            description: common_all_1.MODIFIER_DESCRIPTIONS["selection2Items"] || "",
            iconOff: "checklist",
            iconOn: "menu-selection",
            type: "selection2Items",
            pressed,
            canToggle,
        });
    }
}
exports.Selection2ItemsBtn = Selection2ItemsBtn;
class JournalBtn extends ButtonTypes_1.DendronBtn {
    static create(opts) {
        const { pressed, canToggle } = lodash_1.default.defaults(opts, {
            pressed: false,
            canToggle: true,
        });
        return new JournalBtn({
            title: "Create Journal Note",
            description: common_all_1.MODIFIER_DESCRIPTIONS["journal"],
            iconOff: "calendar",
            iconOn: "menu-selection",
            type: common_all_1.LookupNoteTypeEnum.journal,
            pressed,
            canToggle,
        });
    }
}
exports.JournalBtn = JournalBtn;
class ScratchBtn extends ButtonTypes_1.DendronBtn {
    static create(opts) {
        const { pressed, canToggle } = lodash_1.default.defaults(opts, {
            pressed: false,
            canToggle: true,
        });
        return new ScratchBtn({
            title: "Create Scratch Note",
            description: common_all_1.MODIFIER_DESCRIPTIONS["scratch"],
            iconOff: "new-file",
            iconOn: "menu-selection",
            type: common_all_1.LookupNoteTypeEnum.scratch,
            pressed,
            canToggle,
        });
    }
}
exports.ScratchBtn = ScratchBtn;
class TaskBtn extends ButtonTypes_1.DendronBtn {
    static create(pressed) {
        return new TaskBtn({
            title: "Create Task Note",
            description: common_all_1.MODIFIER_DESCRIPTIONS["task"],
            iconOff: "diff-added",
            iconOn: "menu-selection",
            type: common_all_1.LookupNoteTypeEnum.task,
            pressed,
        });
    }
}
exports.TaskBtn = TaskBtn;
class HorizontalSplitBtn extends ButtonTypes_1.DendronBtn {
    static create(pressed) {
        return new HorizontalSplitBtn({
            title: "Split Horizontal",
            description: common_all_1.MODIFIER_DESCRIPTIONS["horizontal"],
            iconOff: "split-horizontal",
            iconOn: "menu-selection",
            type: "horizontal",
            pressed,
        });
    }
}
exports.HorizontalSplitBtn = HorizontalSplitBtn;
class DirectChildFilterBtn extends ButtonTypes_1.DendronBtn {
    static create(pressed) {
        return new DirectChildFilterBtn({
            title: "Direct Child Filter",
            description: common_all_1.MODIFIER_DESCRIPTIONS["directChildOnly"],
            iconOff: "git-branch",
            iconOn: "menu-selection",
            type: "directChildOnly",
            pressed,
        });
    }
}
exports.DirectChildFilterBtn = DirectChildFilterBtn;
class MultiSelectBtn extends ButtonTypes_1.DendronBtn {
    static create(opts) {
        const { pressed, canToggle } = lodash_1.default.defaults(opts, {
            pressed: false,
            canToggle: true,
        });
        return new MultiSelectBtn({
            title: "Multi-Select",
            description: common_all_1.MODIFIER_DESCRIPTIONS["multiSelect"],
            iconOff: "chrome-maximize",
            iconOn: "menu-selection",
            type: "multiSelect",
            pressed,
            canToggle,
        });
    }
}
exports.MultiSelectBtn = MultiSelectBtn;
class CopyNoteLinkBtn extends ButtonTypes_1.DendronBtn {
    static create(pressed) {
        return new CopyNoteLinkBtn({
            title: "Copy Note Link",
            description: common_all_1.MODIFIER_DESCRIPTIONS["copyNoteLink"],
            iconOff: "clippy",
            iconOn: "menu-selection",
            type: "copyNoteLink",
            pressed,
            // Setting this to TRUE to retain any previous behavior. Previously DendronBtn
            // would always overwrite the canToggle to TRUE. Even though this code branch
            // used to set it to FALSE.
            canToggle: true,
        });
    }
}
exports.CopyNoteLinkBtn = CopyNoteLinkBtn;
class VaultSelectButton extends ButtonTypes_1.DendronBtn {
    static create(opts) {
        return new VaultSelectButton({
            title: "Select Vault",
            description: "",
            iconOff: "package",
            iconOn: "menu-selection",
            type: "selectVault",
            pressed: opts.pressed,
            canToggle: opts.canToggle,
        });
    }
    get tooltip() {
        return `${this.title}, status: ${this.pressed ? "always prompt" : "smart"}`;
    }
}
exports.VaultSelectButton = VaultSelectButton;
function createAllButtons(typesToTurnOn = []) {
    const buttons = [
        MultiSelectBtn.create({}),
        CopyNoteLinkBtn.create(),
        DirectChildFilterBtn.create(),
        SelectionExtractBtn.create({}),
        Selection2LinkBtn.create(),
        Selection2ItemsBtn.create({}),
        JournalBtn.create(),
        ScratchBtn.create({}),
        HorizontalSplitBtn.create(),
        // VerticalSplitBtn.create(),
    ];
    typesToTurnOn.map((btnType) => {
        lodash_1.default.find(buttons, { type: btnType }).pressed = true;
    });
    return buttons;
}
//# sourceMappingURL=buttons.js.map