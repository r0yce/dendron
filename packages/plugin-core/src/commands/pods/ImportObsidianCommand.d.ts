import { PodQuickPickItemV4 } from "../../utils/pods";
import { CommandOpts, ImportPodCommand } from "../ImportPod";
/**
 * Convenience command that uses the same flow as {@link ImportPodCommand} for
 * Markdown Pod but simplifies the steps by not requiring the user to fill out a
 * config.yml file.
 */
export declare class ImportObsidianCommand extends ImportPodCommand {
    key: string;
    constructor(_name?: string);
    /**
     * Hardcoded to use markdown pod, as Obsidian is a markdown import.
     * @returns
     */
    gatherInputs(): Promise<{
        podChoice: PodQuickPickItemV4;
    }>;
    /**
     * Use a file picker control instead of a pod config YAML file to get the
     * Obsidian vault location. Also, just default to the current vault.
     * @returns
     */
    enrichInputs(): Promise<CommandOpts | undefined>;
}
