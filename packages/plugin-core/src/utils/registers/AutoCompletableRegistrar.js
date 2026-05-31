"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCompletableRegistrar = void 0;
const vscode_1 = require("vscode");
/**
 * Singleton - TODO get rid of singleton in favor of injection in local ext -
 * this requires us to be able to construct local commands via injection first
 */
class AutoCompletableRegistrar {
    static _eventEmitter;
    /**
     * Event that fires when 'Tab' is pressed when the
     * DendronContext.NOTE_LOOK_UP_ACTIVE context is set to true.
     */
    static get OnAutoComplete() {
        if (!this._eventEmitter) {
            this._eventEmitter = new vscode_1.EventEmitter();
        }
        return this._eventEmitter.event;
    }
    /**
     * NOTE: ONLY NoteLookupAutoCompleteCommand should call this method.
     */
    static fire() {
        if (!this._eventEmitter) {
            this._eventEmitter = new vscode_1.EventEmitter();
        }
        this._eventEmitter.fire();
    }
}
exports.AutoCompletableRegistrar = AutoCompletableRegistrar;
//# sourceMappingURL=AutoCompletableRegistrar.js.map