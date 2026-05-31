import { CodeConfigChanges } from "@dendronhq/engine-server";
import { BasicCommand } from "./base";
type UpgradeSettingsCommandOpts = {};
export type UpgradeSettingsCommandResp = {
    configUpdate: CodeConfigChanges;
};
export declare class UpgradeSettingsCommand extends BasicCommand<UpgradeSettingsCommandOpts, UpgradeSettingsCommandResp> {
    key: string;
    execute(_opts: UpgradeSettingsCommandOpts): Promise<{
        configUpdate: Required<CodeConfigChanges>;
    }>;
}
export {};
