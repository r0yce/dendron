import { BasicCommand } from "../base";
type CommandOutput = void;
type CommandOpts = {};
export declare class ConfigureExportPodV2 extends BasicCommand<CommandOpts, CommandOutput> {
    key: string;
    execute(): Promise<void>;
}
export {};
