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
exports.DendronBtn = exports.LookupSplitTypeEnum = exports.LookupEffectTypeEnum = void 0;
exports.getButtonCategory = getButtonCategory;
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
var LookupEffectTypeEnum;
(function (LookupEffectTypeEnum) {
    LookupEffectTypeEnum["copyNoteLink"] = "copyNoteLink";
    LookupEffectTypeEnum["copyNoteRef"] = "copyNoteRef";
    LookupEffectTypeEnum["multiSelect"] = "multiSelect";
})(LookupEffectTypeEnum || (exports.LookupEffectTypeEnum = LookupEffectTypeEnum = {}));
var LookupSplitTypeEnum;
(function (LookupSplitTypeEnum) {
    LookupSplitTypeEnum["horizontal"] = "horizontal";
})(LookupSplitTypeEnum || (exports.LookupSplitTypeEnum = LookupSplitTypeEnum = {}));
function getButtonCategory(button) {
    if (isSelectionBtn(button)) {
        return "selection";
    }
    if (isNoteBtn(button)) {
        return "note";
    }
    if (isSplitButton(button)) {
        return "split";
    }
    if (isFilterButton(button)) {
        return "filter";
    }
    if (isEffectButton(button)) {
        return "effect";
    }
    if (isSelectVaultButton(button)) {
        return "selectVault";
    }
    throw Error(`unknown btn type ${button}`);
}
function isEffectButton(button) {
    return lodash_1.default.includes(["copyNoteLink", "copyNoteRef", "multiSelect"], button.type);
}
function isFilterButton(button) {
    return lodash_1.default.includes(["directChildOnly"], button.type);
}
function isSelectionBtn(button) {
    return lodash_1.default.includes(["selection2link", "selectionExtract", "selection2Items"], button.type);
}
function isNoteBtn(button) {
    return lodash_1.default.includes(["journal", "scratch", "task"], button.type);
}
function isSplitButton(button) {
    return lodash_1.default.includes(["horizontal", "vertical"], button.type);
}
function isSelectVaultButton(button) {
    return lodash_1.default.includes(["selectVault"], button.type);
}
class DendronBtn {
    iconPathNormal;
    iconPathPressed;
    type;
    description;
    _pressed;
    canToggle;
    title;
    opts;
    get pressed() {
        return this._pressed;
    }
    set pressed(isPressed) {
        if (this.canToggle) {
            this._pressed = isPressed;
        }
    }
    onLookup = async (_payload) => {
        return;
    };
    constructor(opts) {
        const { iconOff, iconOn, type, title, description, pressed } = opts;
        this.iconPathNormal = new vscode.ThemeIcon(iconOff);
        this.iconPathPressed = new vscode.ThemeIcon(iconOn);
        this.type = type;
        this.description = description;
        this._pressed = pressed || false;
        this.title = title;
        this.canToggle = lodash_1.default.isUndefined(opts.canToggle) ? true : opts.canToggle;
        this.opts = opts;
    }
    clone() {
        return new DendronBtn({
            ...this.opts,
            pressed: this._pressed,
        });
    }
    get iconPath() {
        return !this.pressed ? this.iconPathNormal : this.iconPathPressed;
    }
    get tooltip() {
        return this.description
            ? `${this.title}, ${this.description}, status: ${this.pressed ? "on" : "off"}`
            : `${this.title}, status: ${this.pressed ? "on" : "off"}`;
    }
    toggle() {
        if (this.canToggle) {
            this.pressed = !this.pressed;
        }
    }
}
exports.DendronBtn = DendronBtn;
//# sourceMappingURL=ButtonTypes.js.map