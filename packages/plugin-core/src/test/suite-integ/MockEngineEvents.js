"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockEngineEvents = void 0;
const vscode_1 = require("vscode");
/**
 * Convenience class for testing classes that rely on EngineEvents signaling
 */
class MockEngineEvents {
    _onNoteStateChangedEmitter = new vscode_1.EventEmitter();
    get onEngineNoteStateChanged() {
        return this._onNoteStateChangedEmitter.event;
    }
    /**
     * Use this method to mock an engine change event to trigger a response from
     * the component you're testing.
     * @param entries
     */
    testFireOnNoteChanged(entries) {
        this._onNoteStateChangedEmitter.fire(entries);
    }
    dispose() {
        this._onNoteStateChangedEmitter.dispose();
    }
}
exports.MockEngineEvents = MockEngineEvents;
//# sourceMappingURL=MockEngineEvents.js.map