import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = void;
export declare class ConfigureCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    static requireActiveWorkspace: boolean;
    private _ext;
    constructor(extension: IDendronExtension);
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
