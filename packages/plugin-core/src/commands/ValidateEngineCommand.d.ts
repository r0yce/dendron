import { BasicCommand } from "./base";
type ValidateEngineCommandOpts = {};
export declare class ValidateEngineCommand extends BasicCommand<ValidateEngineCommandOpts, void> {
    key: string;
    execute(opts?: ValidateEngineCommandOpts): Promise<void>;
    showResponse(): Promise<void>;
}
export {};
