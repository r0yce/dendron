import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandOpts = {};
type CommandOutput = {} | undefined;
export declare class TaskCompleteCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    static requireActiveWorkspace: boolean;
    private _ext;
    constructor(extension: IDendronExtension);
    execute(_opts: CommandOpts): Promise<{} | undefined>;
}
export {};
