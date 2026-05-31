import { NoteTrait, RespV2 } from "@dendronhq/common-all";
import { CommandRegistrar } from "./CommandRegistrar";
import { NoteTraitService } from "./NoteTraitService";
import * as vscode from "vscode";
export declare class NoteTraitManager implements NoteTraitService, vscode.Disposable {
    private _wsRoot;
    private cmdRegistar;
    private L;
    private _watcher;
    constructor(_wsRoot: string, registrar: CommandRegistrar);
    /**
     * Loads up saved note traits and sets up a filewatcher on trait .js files
     */
    initialize(): Promise<void>;
    registeredTraits: Map<string, NoteTrait>;
    registerTrait(trait: NoteTrait): RespV2<void>;
    unregisterTrait(trait: NoteTrait): RespV2<void>;
    getTypesWithRegisteredCallback(_callbackType: callbackType): NoteTrait[];
    getRegisteredCommandForTrait(trait: NoteTrait): string | undefined;
    dispose(): void;
    private setupSavedTraitsFromFS;
    private setupTraitFromJSFile;
    private setupFileWatcherForTraitFileChanges;
}
/**
 * Not used yet
 */
declare enum callbackType {
    onDescendantLifecycleEvent = 0,
    onSiblingLifecycleEvent = 1
}
export {};
