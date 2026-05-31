import { DVault } from "@dendronhq/common-all";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type CommandOpts = {
    vault: DVault;
    /**
     * added for contextual-ui check
     */
    fsPath?: string;
};
type CommandOutput = {
    vault: DVault;
};
export { CommandOpts as RemoveVaultCommandOpts };
export declare class RemoveVaultCommand extends BasicCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    gatherInputs(opts?: CommandOpts): Promise<any>;
    execute(opts: CommandOpts): Promise<{
        vault: DVault;
    }>;
}
