import { LocalConfigScope } from "@dendronhq/common-server";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {
    configScope?: LocalConfigScope;
};
type CommandOutput = void;
export declare class ConfigureLocalOverride extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    static requireActiveWorkspace: boolean;
    _ext: IDendronExtension;
    constructor(extension: IDendronExtension);
    execute(opts?: CommandOpts): Promise<void>;
}
export {};
