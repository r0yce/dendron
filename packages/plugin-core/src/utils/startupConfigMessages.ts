/**
 * Startup messages for dendron.yml config issues (duplicate / deprecated / missing).
 */
import {
  ConfigEvents,
  ConfirmStatus,
  InstallStatus,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import _md from "markdown-it";
import * as vscode from "vscode";
import { DoctorCommand } from "../commands/Doctor";
import { IDendronExtension } from "../dendronExtensionInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { AnalyticsUtils } from "./analytics";
import {
  shouldDisplayDeprecatedConfigMessage as shouldDisplayDeprecatedConfigGate,
  shouldDisplayMissingDefaultConfigMessage as shouldDisplayMissingDefaultConfigGate,
} from "./startupGates";

export function getDuplicateKeysMessage(opts: {
  ext: IDendronExtension;
}): string | undefined {
  const wsRoot = opts.ext.getDWorkspace().wsRoot;
  try {
    DConfig.getRaw(wsRoot);
  } catch (error: any) {
    if (
      error.name === "YAMLException" &&
      error.reason === "duplicated mapping key"
    ) {
      return error.message;
    }
  }
  return undefined;
}

export function showDuplicateConfigEntryMessageIfNecessary(opts: {
  ext: IDendronExtension;
}) {
  const message = getDuplicateKeysMessage(opts);
  if (message !== undefined) {
    showDuplicateConfigEntryMessage({
      ...opts,
      message,
    });
  }
}

export function showDuplicateConfigEntryMessage(opts: {
  ext: IDendronExtension;
  message: string;
}) {
  AnalyticsUtils.track(ConfigEvents.DuplicateConfigEntryMessageShow);
  const FIX_ISSUE = "Fix Issue";
  const MESSAGE =
    "We have detected duplicate key(s) in dendron.yml. Dendron has activated using the last entry of the duplicate key(s)";
  vscode.window
    .showInformationMessage(MESSAGE, FIX_ISSUE)
    .then(async (resp) => {
      if (resp === FIX_ISSUE) {
        AnalyticsUtils.track(ConfigEvents.DuplicateConfigEntryMessageConfirm, {
          status: ConfirmStatus.accepted,
        });
        const wsRoot = opts.ext.getDWorkspace().wsRoot;
        const configPath = DConfig.configPath(wsRoot);
        const configUri = vscode.Uri.file(configPath);

        const message = opts.message;
        const content = [
          `# Duplicate Keys in \`dendron.yml\``,
          "",
          "The message at the bottom displays the _first_ duplicate key mapping that was detected in `dendron.yml`",
          "",
          "**There may be more duplicate key mappings**.",
          "",
          "Take the following steps to fix this issue.",
          "1. Look through `dendron.yml` and remove all duplicate mappings.",
          "",
          `    - We recommend installing the [YAML extension](${vscode.Uri.parse(
            `command:workbench.extensions.search?${JSON.stringify(
              "@id:redhat.vscode-yaml",
            )}`,
          )}) for validating \`dendron.yml\``,
          "",
          "1. When you are done, save your changes made to `dendron.yml`",
          "",
          `1. Reload the window for it to take effect. [Click here to reload window](${vscode.Uri.parse(
            `command:workbench.action.reloadWindow`,
          )})`,
          "",
          "## Error message",
          "```",
          message,
          "```",
          "",
          "",
        ].join("\n");
        const panel = vscode.window.createWebviewPanel(
          "showDuplicateConfigMessagePreview",
          "Duplicated Mapping Keys Preview",
          vscode.ViewColumn.One,
          {
            enableCommandUris: true,
          },
        );
        const md = _md();
        panel.webview.html = md.render(content);
        await VSCodeUtils.openFileInEditor(configUri, {
          column: vscode.ViewColumn.Beside,
        });
      } else {
        AnalyticsUtils.track(ConfigEvents.DuplicateConfigEntryMessageConfirm, {
          status: ConfirmStatus.rejected,
        });
      }
    });
}

export function showDeprecatedConfigMessageIfNecessary(opts: {
  ext: IDendronExtension;
  extensionInstallStatus: InstallStatus;
}) {
  if (shouldDisplayDeprecatedConfigMessage(opts)) {
    showDeprecatedConfigMessage({ ext: opts.ext });
  }
}

export function shouldDisplayDeprecatedConfigMessage(opts: {
  ext: IDendronExtension;
  extensionInstallStatus: InstallStatus;
}): boolean {
  if (opts.extensionInstallStatus !== InstallStatus.UPGRADED) {
    return false;
  }
  const wsRoot = opts.ext.getDWorkspace().wsRoot;
  const rawConfig = DConfig.getRaw(wsRoot);
  return shouldDisplayDeprecatedConfigGate({
    extensionInstallStatus: opts.extensionInstallStatus,
    rawConfig,
  });
}

export function showDeprecatedConfigMessage(opts: { ext: IDendronExtension }) {
  AnalyticsUtils.track(ConfigEvents.DeprecatedConfigMessageShow);
  const REMOVE_CONFIG = "Remove Deprecated Configuration";
  const MESSAGE =
    "We have detected some deprecated configurations. Would you like to remove them from dendron.yml?";
  vscode.window
    .showInformationMessage(MESSAGE, REMOVE_CONFIG)
    .then(async (resp) => {
      if (resp === REMOVE_CONFIG) {
        AnalyticsUtils.track(ConfigEvents.DeprecatedConfigMessageConfirm, {
          status: ConfirmStatus.accepted,
        });
        const cmd = new DoctorCommand(opts.ext);
        await cmd.execute({
          action: DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS,
          scope: "workspace",
        });
      } else {
        AnalyticsUtils.track(ConfigEvents.DeprecatedConfigMessageConfirm, {
          status: ConfirmStatus.rejected,
        });
      }
    });
}

export function showMissingDefaultConfigMessageIfNecessary(opts: {
  ext: IDendronExtension;
  extensionInstallStatus: InstallStatus;
}) {
  if (shouldDisplayMissingDefaultConfigMessage(opts)) {
    showMissingDefaultConfigMessage({ ext: opts.ext });
  }
}

export function shouldDisplayMissingDefaultConfigMessage(opts: {
  ext: IDendronExtension;
  extensionInstallStatus: InstallStatus;
}): boolean {
  if (opts.extensionInstallStatus !== InstallStatus.UPGRADED) {
    return false;
  }
  const wsRoot = opts.ext.getDWorkspace().wsRoot;
  const rawConfig = DConfig.getRaw(wsRoot);
  return shouldDisplayMissingDefaultConfigGate({
    extensionInstallStatus: opts.extensionInstallStatus,
    rawConfig,
  });
}

export function showMissingDefaultConfigMessage(opts: {
  ext: IDendronExtension;
}) {
  AnalyticsUtils.track(ConfigEvents.ShowMissingDefaultConfigMessage);
  const ADD_CONFIG = "Add Missing Configuration";
  const MESSAGE =
    "We have detected a missing configuration. This may happen because a new configuration was introduced, or because an existing required configuration has been deleted. Would you like to add them to dendron.yml?";
  vscode.window
    .showInformationMessage(MESSAGE, ADD_CONFIG)
    .then(async (resp) => {
      if (resp === ADD_CONFIG) {
        AnalyticsUtils.track(ConfigEvents.MissingDefaultConfigMessageConfirm, {
          status: ConfirmStatus.accepted,
        });
        const cmd = new DoctorCommand(opts.ext);
        await cmd.execute({
          action: DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS,
          scope: "workspace",
        });
      } else {
        AnalyticsUtils.track(ConfigEvents.MissingDefaultConfigMessageConfirm, {
          status: ConfirmStatus.rejected,
        });
      }
    });
}
