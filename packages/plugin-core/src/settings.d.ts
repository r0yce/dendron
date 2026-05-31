import { CodeConfigChanges, ConfigChanges, ConfigUpdateChangeSet, Settings as EngineSettings, SettingsUpgradeOpts, Snippets, WorkspaceConfig as EngineWorkspaceConfig, Extensions as EngineExtension } from "@dendronhq/engine-server";
import { WorkspaceConfiguration } from "vscode";
export { Snippets };
export declare class Extensions extends EngineExtension {
    /**
     * Get Dendron recommended extensions
     */
    static getDendronExtensionRecommendations(): {
        id: any;
        extension: import("vscode").Extension<any> | undefined;
    }[];
}
export declare class WorkspaceConfig extends EngineWorkspaceConfig {
    static update(_wsRoot: string): Promise<Required<CodeConfigChanges>>;
}
export declare class Settings extends EngineSettings {
    /**
     * Upgrade config
     * @param config config to upgrade
     * @param target: config set to upgrade to
     */
    static upgrade(src: WorkspaceConfiguration, target: ConfigUpdateChangeSet, opts?: SettingsUpgradeOpts): Promise<ConfigChanges>;
}
