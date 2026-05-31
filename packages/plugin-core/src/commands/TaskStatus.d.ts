import { NoteProps } from "@dendronhq/common-all";
import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";
type CommandInput = {
    setStatus?: string;
};
type CommandOpts = Required<CommandInput> & {
    note: NoteProps;
};
type CommandOutput = {};
export declare class TaskStatusCommand extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    static requireActiveWorkspace: boolean;
    private _ext;
    constructor(extension: IDendronExtension);
    gatherInputs(opts?: CommandInput): Promise<CommandOpts | undefined>;
    execute(opts: CommandOpts): Promise<{}>;
}
export {};
