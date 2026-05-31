"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultSelectionMode = exports.DendronQuickPickState = void 0;
var DendronQuickPickState;
(function (DendronQuickPickState) {
    /**
     * Default state
     */
    DendronQuickPickState["IDLE"] = "IDLE";
    /**
     * Finished taking request
     */
    DendronQuickPickState["FULFILLED"] = "FULFILLED";
    /**
     * About to show a new picker. Old picker will be hidden but we are still gathering further input
     */
    DendronQuickPickState["PENDING_NEXT_PICK"] = "PENDING_NEXT_PICK";
})(DendronQuickPickState || (exports.DendronQuickPickState = DendronQuickPickState = {}));
var VaultSelectionMode;
(function (VaultSelectionMode) {
    /**
     * Never prompt the user. Useful for testing
     */
    VaultSelectionMode[VaultSelectionMode["auto"] = 0] = "auto";
    /**
     * Tries to determine the vault automatically, but will prompt the user if
     * there is ambiguity
     */
    VaultSelectionMode[VaultSelectionMode["smart"] = 1] = "smart";
    /**
     * Always prompt the user if there is more than one vault
     */
    VaultSelectionMode[VaultSelectionMode["alwaysPrompt"] = 2] = "alwaysPrompt";
})(VaultSelectionMode || (exports.VaultSelectionMode = VaultSelectionMode = {}));
//# sourceMappingURL=types.js.map