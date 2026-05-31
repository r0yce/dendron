import { BasicCommand } from "./base";
type DiagnosticsReportCommandOpts = {};
export declare class DiagnosticsReportCommand extends BasicCommand<DiagnosticsReportCommandOpts, void> {
    key: string;
    execute(opts?: DiagnosticsReportCommandOpts): Promise<void>;
    showResponse(): Promise<void>;
}
export {};
