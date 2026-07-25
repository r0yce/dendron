/**
 * Startup orchestration shell — config messages, surveys, migrations.
 * Peels: startupGates (pure), startupConfigMessages, startupUserPrompts.
 */
import {
  ConfirmStatus,
  DendronConfig,
  MigrationEvents,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  MigrationChangeSetStatus,
  MigrationUtils,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { AnalyticsUtils } from "./analytics";
import {
  getDuplicateKeysMessage,
  showDeprecatedConfigMessage,
  showDeprecatedConfigMessageIfNecessary,
  showDuplicateConfigEntryMessage,
  showDuplicateConfigEntryMessageIfNecessary,
  showMissingDefaultConfigMessage,
  showMissingDefaultConfigMessageIfNecessary,
  shouldDisplayDeprecatedConfigMessage,
  shouldDisplayMissingDefaultConfigMessage,
} from "./startupConfigMessages";
import { shouldShowManualUpgradeMessage as shouldShowManualUpgradeGate } from "./startupGates";
import {
  maybeShowProductHuntMessage,
  shouldDisplayInactiveUserSurvey,
  showInactiveUserMessage,
  showInactiveUserMessageIfNecessary,
  showUninstallMarkdownLinksExtensionMessage,
  showWhitelistingLocalhostDocsIfNecessary,
  warnIncompatibleExtensions,
} from "./startupUserPrompts";

export class StartupUtils {
  static shouldShowManualUpgradeMessage({
    previousWorkspaceVersion,
    currentVersion,
  }: {
    previousWorkspaceVersion: string;
    currentVersion: string;
  }) {
    const workspaceInstallStatus = VSCodeUtils.getInstallStatusForWorkspace({
      previousWorkspaceVersion,
      currentVersion,
    });
    return shouldShowManualUpgradeGate({
      previousWorkspaceVersion,
      workspaceInstallStatus,
    });
  }

  static showManualUpgradeMessage() {
    const SHOW_ME_HOW = "Show Me How";
    const MESSAGE =
      "You are upgrading from a legacy version of Dendron. Please follow the instructions to manually migrate your configuration.";
    vscode.window
      .showInformationMessage(MESSAGE, SHOW_ME_HOW)
      .then(async (resp) => {
        if (resp === SHOW_ME_HOW) {
          AnalyticsUtils.track(MigrationEvents.ManualUpgradeMessageConfirm, {
            status: ConfirmStatus.accepted,
          });
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/4119x15gl9w90qx8qh1truj",
          );
        } else {
          AnalyticsUtils.track(MigrationEvents.ManualUpgradeMessageConfirm, {
            status: ConfirmStatus.rejected,
          });
        }
      });
  }

  static async showManualUpgradeMessageIfNecessary({
    previousWorkspaceVersion,
    currentVersion,
  }: {
    previousWorkspaceVersion: string;
    currentVersion: string;
  }) {
    if (
      StartupUtils.shouldShowManualUpgradeMessage({
        previousWorkspaceVersion,
        currentVersion,
      })
    ) {
      StartupUtils.showManualUpgradeMessage();
    }
  }

  static async runMigrationsIfNecessary({
    wsService,
    currentVersion,
    previousWorkspaceVersion,
    dendronConfig,
    maybeWsSettings,
  }: {
    wsService: WorkspaceService;
    currentVersion: string;
    previousWorkspaceVersion: string;
    dendronConfig: DendronConfig;
    maybeWsSettings?: WorkspaceSettings | undefined;
  }) {
    const workspaceInstallStatus = VSCodeUtils.getInstallStatusForWorkspace({
      previousWorkspaceVersion,
      currentVersion,
    });
    // see [[Migration|dendron://dendron.docs/pkg.plugin-core.t.migration]] for overview of migration process
    const changes = await wsService.runMigrationsIfNecessary({
      currentVersion,
      previousVersion: previousWorkspaceVersion,
      dendronConfig,
      workspaceInstallStatus,
      ...(maybeWsSettings !== undefined ? { wsConfig: maybeWsSettings } : {}),
    });
    Logger.info({
      ctx: "runMigrationsIfNecessary",
      changes,
      workspaceInstallStatus,
    });
    if (changes.length > 0) {
      changes.forEach((change: MigrationChangeSetStatus) => {
        const event = _.isUndefined(change.error)
          ? MigrationEvents.MigrationSucceeded
          : MigrationEvents.MigrationFailed;

        AnalyticsUtils.track(
          event,
          MigrationUtils.getMigrationAnalyticProps(change),
        );
      });
    }
  }

  static showDuplicateConfigEntryMessageIfNecessary =
    showDuplicateConfigEntryMessageIfNecessary;

  static getDuplicateKeysMessage = getDuplicateKeysMessage;

  static showDuplicateConfigEntryMessage = showDuplicateConfigEntryMessage;

  static showDeprecatedConfigMessageIfNecessary =
    showDeprecatedConfigMessageIfNecessary;

  static shouldDisplayDeprecatedConfigMessage =
    shouldDisplayDeprecatedConfigMessage;

  static showDeprecatedConfigMessage = showDeprecatedConfigMessage;

  static showMissingDefaultConfigMessageIfNecessary =
    showMissingDefaultConfigMessageIfNecessary;

  static shouldDisplayMissingDefaultConfigMessage =
    shouldDisplayMissingDefaultConfigMessage;

  static showMissingDefaultConfigMessage = showMissingDefaultConfigMessage;

  static showInactiveUserMessageIfNecessary =
    showInactiveUserMessageIfNecessary;

  static shouldDisplayInactiveUserSurvey = shouldDisplayInactiveUserSurvey;

  static showInactiveUserMessage = showInactiveUserMessage;

  static warnIncompatibleExtensions = warnIncompatibleExtensions;

  static showUninstallMarkdownLinksExtensionMessage =
    showUninstallMarkdownLinksExtensionMessage;

  static maybeShowProductHuntMessage = maybeShowProductHuntMessage;

  static showWhitelistingLocalhostDocsIfNecessary =
    showWhitelistingLocalhostDocsIfNecessary;
}
