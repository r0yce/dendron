import { DendronConfig, InstallStatus, WorkspaceSettings } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import { IDendronExtension } from "../dendronExtensionInterface";
export declare class StartupUtils {
    static shouldShowManualUpgradeMessage({ previousWorkspaceVersion, currentVersion, }: {
        previousWorkspaceVersion: string;
        currentVersion: string;
    }): boolean;
    static showManualUpgradeMessage(): void;
    static showManualUpgradeMessageIfNecessary({ previousWorkspaceVersion, currentVersion, }: {
        previousWorkspaceVersion: string;
        currentVersion: string;
    }): Promise<void>;
    static runMigrationsIfNecessary({ wsService, currentVersion, previousWorkspaceVersion, dendronConfig, maybeWsSettings, }: {
        wsService: WorkspaceService;
        currentVersion: string;
        previousWorkspaceVersion: string;
        dendronConfig: DendronConfig;
        maybeWsSettings?: WorkspaceSettings | undefined;
    }): Promise<void>;
    static showDuplicateConfigEntryMessageIfNecessary(opts: {
        ext: IDendronExtension;
    }): void;
    static getDuplicateKeysMessage(opts: {
        ext: IDendronExtension;
    }): any;
    static showDuplicateConfigEntryMessage(opts: {
        ext: IDendronExtension;
        message: string;
    }): void;
    static showDeprecatedConfigMessageIfNecessary(opts: {
        ext: IDendronExtension;
        extensionInstallStatus: InstallStatus;
    }): void;
    static shouldDisplayDeprecatedConfigMessage(opts: {
        ext: IDendronExtension;
        extensionInstallStatus: InstallStatus;
    }): boolean;
    static showDeprecatedConfigMessage(opts: {
        ext: IDendronExtension;
    }): void;
    static showMissingDefaultConfigMessageIfNecessary(opts: {
        ext: IDendronExtension;
        extensionInstallStatus: InstallStatus;
    }): void;
    static shouldDisplayMissingDefaultConfigMessage(opts: {
        ext: IDendronExtension;
        extensionInstallStatus: InstallStatus;
    }): boolean;
    static showMissingDefaultConfigMessage(opts: {
        ext: IDendronExtension;
    }): void;
    static showInactiveUserMessageIfNecessary(): Promise<void>;
    static shouldDisplayInactiveUserSurvey(): boolean;
    static showInactiveUserMessage(): Promise<void>;
    static warnIncompatibleExtensions(opts: {
        ext: IDendronExtension;
    }): void;
    static showUninstallMarkdownLinksExtensionMessage(): void;
    /**
     * A one-off logic to show a special webview message for the v0.100.0 launch.
     * @returns
     */
    static maybeShowProductHuntMessage(): void;
    /**
     * this method pings the localhost and checks if it is available. Incase local is blocked off,
     * displays a toaster with a link to troubleshooting docs
     */
    static showWhitelistingLocalhostDocsIfNecessary(): Promise<void>;
}
