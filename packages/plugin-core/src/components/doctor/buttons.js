"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeScopeBtn = exports.DoctorBtn = void 0;
const vscode_1 = require("vscode");
class DoctorBtn {
    iconPathNormal;
    iconPathPressed;
    type;
    pressed;
    canToggle;
    title;
    opts;
    constructor(opts) {
        const { iconOff, iconOn, type, title, pressed } = opts;
        this.iconPathNormal = new vscode_1.ThemeIcon(iconOff);
        this.iconPathPressed = new vscode_1.ThemeIcon(iconOn);
        this.type = type;
        this.pressed = pressed || false;
        this.title = title;
        // TODO: examine whether this is the behavior we actually want since
        // ths expression (opts.canToggle || true) will always return true
        // (as long as 'opts' is not undefined). Secondly 'this.canToggle'
        // does not appear to be used.
        this.canToggle = opts.canToggle || true;
        this.opts = opts;
    }
    clone() {
        return new DoctorBtn({
            ...this.opts,
        });
    }
    async onEnable(_opts) {
        console.log("enabled");
        return undefined;
    }
    async onDisable(_opts) {
        console.log("disabled");
        return undefined;
    }
    get iconPath() {
        return !this.pressed ? this.iconPathNormal : this.iconPathPressed;
    }
    get tooltip() {
        return `${this.title}, status: ${this.pressed ? "on" : "off"}`;
    }
    toggle() {
        this.pressed = !this.pressed;
    }
}
exports.DoctorBtn = DoctorBtn;
class ChangeScopeBtn extends DoctorBtn {
    static create(pressed) {
        return new ChangeScopeBtn({
            title: "Change Scope",
            iconOff: "symbol-file",
            iconOn: "root-folder-opened",
            type: "workspace",
            pressed,
        });
    }
}
exports.ChangeScopeBtn = ChangeScopeBtn;
//# sourceMappingURL=buttons.js.map