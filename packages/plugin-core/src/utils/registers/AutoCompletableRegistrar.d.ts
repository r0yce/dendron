import { Event } from "vscode";
/**
 * Singleton - TODO get rid of singleton in favor of injection in local ext -
 * this requires us to be able to construct local commands via injection first
 */
export declare class AutoCompletableRegistrar {
    private static _eventEmitter;
    /**
     * Event that fires when 'Tab' is pressed when the
     * DendronContext.NOTE_LOOK_UP_ACTIVE context is set to true.
     */
    static get OnAutoComplete(): Event<void>;
    /**
     * NOTE: ONLY NoteLookupAutoCompleteCommand should call this method.
     */
    static fire(): void;
}
