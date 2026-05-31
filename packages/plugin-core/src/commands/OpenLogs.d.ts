import { BasicCommand } from "./base";
type OpenLogsCommandOpts = {};
export declare class OpenLogsCommand extends BasicCommand<OpenLogsCommandOpts, void> {
    key: string;
    execute(opts?: OpenLogsCommandOpts): Promise<void>;
}
export {};
