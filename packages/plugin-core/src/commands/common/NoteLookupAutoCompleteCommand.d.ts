import { EventEmitter } from "vscode";
export declare class NoteLookupAutoCompleteCommand {
    private emitter;
    static key: string;
    constructor(emitter: EventEmitter<void>);
    run(): void;
}
