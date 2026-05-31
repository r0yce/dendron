import { BasicCommand } from "./base";
type ChangeWorkspaceCommandOpts = {
    rootDirRaw: string;
    skipOpenWS?: boolean;
};
type CommandInput = {
    rootDirRaw: string;
};
export declare class ChangeWorkspaceCommand extends BasicCommand<ChangeWorkspaceCommandOpts, any> {
    key: string;
    gatherInputs(): Promise<CommandInput | undefined>;
    execute(opts: ChangeWorkspaceCommandOpts): Promise<void>;
}
export {};
