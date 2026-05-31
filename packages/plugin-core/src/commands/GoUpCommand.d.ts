import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {};
type CommandOutput = void;
export declare class GoUpCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    constructor(_ext: IDendronExtension);
    key: string;
    gatherInputs(): Promise<any>;
    execute(): Promise<void>;
}
export {};
