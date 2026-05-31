import { PodItemV4, SnapshotExportPodResp } from "@dendronhq/pods-core";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BaseCommand } from "./base";
type CommandOpts = {};
type CommandInput = {
    podChoice: PodItemV4;
};
type CommandOutput = SnapshotExportPodResp;
export { CommandOpts as SnapshotVaultCommandOpts };
export declare class SnapshotVaultCommand extends BaseCommand<CommandOpts, CommandOutput> {
    private _ext;
    key: string;
    constructor(_ext: IDendronExtension);
    gatherInputs(): Promise<any>;
    enrichInputs(_inputs: CommandInput): Promise<CommandOpts | undefined>;
    execute(_opts: CommandOpts): Promise<{
        snapshotDirPath: any;
    }>;
}
