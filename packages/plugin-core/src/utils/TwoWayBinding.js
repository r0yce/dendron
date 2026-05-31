"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoWayBinding = void 0;
const vscode_1 = require("vscode");
/**
 * A Two Way Binding implementation for plugin-core UI's that require multiple
 * views over the same view model. A data value T can be represented with an
 * instance of this class, and any 'views' can bind a callback to get updated
 * whenever that value changes. This utilizes vscode EventEmitter under the hood.
 */
class TwoWayBinding {
    _value;
    _emitter;
    constructor(initialValue) {
        this._value = initialValue;
        this._emitter = new vscode_1.EventEmitter();
    }
    /**
     * Get the current value
     */
    get value() {
        return this._value;
    }
    /**
     * Set the value. If this causes the value to change, then all bound callbacks
     * will get notified.
     */
    set value(newValue) {
        if (this._value !== newValue) {
            const previous = this._value;
            this._value = newValue;
            this._emitter.fire({ newValue, previous });
        }
    }
    /**
     * A view or a controller can bind a callback to the viewmodel with this
     * function
     * @param callback
     * @param thisArg
     * @returns
     */
    bind(callback, thisArg) {
        return this._emitter.event((data) => {
            const bound = callback.bind(thisArg);
            bound(data.newValue, data.previous);
        });
    }
}
exports.TwoWayBinding = TwoWayBinding;
//# sourceMappingURL=TwoWayBinding.js.map