import { Disposable } from "vscode";
/**
 * A Two Way Binding implementation for plugin-core UI's that require multiple
 * views over the same view model. A data value T can be represented with an
 * instance of this class, and any 'views' can bind a callback to get updated
 * whenever that value changes. This utilizes vscode EventEmitter under the hood.
 */
export declare class TwoWayBinding<T> {
    private _value;
    private _emitter;
    constructor(initialValue: T);
    /**
     * Get the current value
     */
    get value(): T;
    /**
     * Set the value. If this causes the value to change, then all bound callbacks
     * will get notified.
     */
    set value(newValue: T);
    /**
     * A view or a controller can bind a callback to the viewmodel with this
     * function
     * @param callback
     * @param thisArg
     * @returns
     */
    bind(callback: (newValue: T, previous: T) => void, thisArg?: any): Disposable;
}
