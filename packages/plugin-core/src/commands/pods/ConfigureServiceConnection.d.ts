import { IDendronExtension } from "../../dendronExtensionInterface";
import { BasicCommand } from "../base";
type CommandOutput = void;
type CommandOpts = {};
export declare class ConfigureServiceConnection extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    execute(_opts: CommandOpts): Promise<void>;
}
export {};
