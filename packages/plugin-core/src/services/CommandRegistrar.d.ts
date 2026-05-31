import { NoteTrait } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
/**
 * Manages registration of new VS Code commands. This service is intended for
 * use of dynamically created (and registered) commands. Static commands that
 * are registered onActivate() should not use this class
 */
export declare class CommandRegistrar {
    private _extension;
    private context;
    private disposables;
    CUSTOM_COMMAND_PREFIX: string;
    readonly registeredCommands: {
        [traitId: string]: string;
    };
    constructor(extension: IDendronExtension);
    registerCommandForTrait(trait: NoteTrait): string;
    unregisterTrait(trait: NoteTrait): void;
}
