import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";
type OpenBackupCommandOpts = {};
export declare class OpenBackupCommand extends BasicCommand<OpenBackupCommandOpts, void> {
    key: string;
    private extension;
    constructor(ext: IDendronExtension);
    private promptBackupEntrySelection;
    private promptBackupKeySelection;
    execute(opts?: OpenBackupCommandOpts): Promise<void>;
}
export {};
