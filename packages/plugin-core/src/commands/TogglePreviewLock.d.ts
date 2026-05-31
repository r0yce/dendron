import { PreviewProxy } from "../components/views/PreviewProxy";
import { BasicCommand } from "./base";
type CommandInput = {};
type CommandOpts = {};
type CommandOutput = CommandOpts;
export declare class TogglePreviewLockCommand extends BasicCommand<CommandOpts, CommandOutput, CommandInput> {
    key: string;
    _panel: PreviewProxy | undefined;
    constructor(previewPanel: PreviewProxy);
    sanityCheck(): Promise<"No preview currently open" | undefined>;
    execute(_opts?: CommandOpts): Promise<{}>;
}
export {};
