import { EngineEventEmitter, Event, NoteChangeEntry } from "@dendronhq/common-all";
import { EventEmitter } from "vscode";
/**
 * Convenience class for testing classes that rely on EngineEvents signaling
 */
export declare class MockEngineEvents implements EngineEventEmitter {
    _onNoteStateChangedEmitter: EventEmitter<NoteChangeEntry[]>;
    get onEngineNoteStateChanged(): Event<NoteChangeEntry[]>;
    /**
     * Use this method to mock an engine change event to trigger a response from
     * the component you're testing.
     * @param entries
     */
    testFireOnNoteChanged(entries: NoteChangeEntry[]): void;
    dispose(): void;
}
