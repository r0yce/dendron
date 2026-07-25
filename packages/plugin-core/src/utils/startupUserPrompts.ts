/**
 * Startup user prompts: inactive survey, incompatible extensions, product hunt, localhost.
 */
import {
  ExtensionEvents,
  SurveyEvents,
  Time,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { readMD } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import _ from "lodash";
import os from "os";
import * as vscode from "vscode";
import { DoctorCommand, PluginDoctorActionsEnum } from "../commands/Doctor";
import { INCOMPATIBLE_EXTENSIONS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { SurveyUtils } from "../survey";
import { VSCodeUtils } from "../vsCodeUtils";
import { AnalyticsUtils } from "./analytics";
import { decideInactiveUserSurvey } from "./startupGates";

export async function showInactiveUserMessageIfNecessary() {
  if (shouldDisplayInactiveUserSurvey()) {
    await showInactiveUserMessage();
  }
}

export function shouldDisplayInactiveUserSurvey(): boolean {
  const metaData = MetadataService.instance().getMeta();
  const decision = decideInactiveUserSurvey({
    meta: metaData,
    currentTimeSeconds: Time.now().toSeconds(),
  });
  if (decision.shouldSend && decision.reason) {
    AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyPromptReason, {
      reason: decision.reason,
      currentTime: decision.currentTime,
      ...metaData,
    });
  }
  return decision.shouldSend;
}

export async function showInactiveUserMessage() {
  AnalyticsUtils.track(VSCodeEvents.ShowInactiveUserMessage);
  MetadataService.instance().setInactiveUserMsgSendTime();
  await SurveyUtils.showInactiveUserSurvey();
}

export function warnIncompatibleExtensions(opts: { ext: IDendronExtension }) {
  const installStatus = INCOMPATIBLE_EXTENSIONS.map((extId) => {
    return { id: extId, installed: VSCodeUtils.isExtensionInstalled(extId) };
  });

  const installedExtensions = installStatus
    .filter((status) => status.installed)
    .map((status) => status.id);

  const shouldDisplayWarning = installStatus.some((status) => status.installed);
  if (shouldDisplayWarning) {
    AnalyticsUtils.track(ExtensionEvents.IncompatibleExtensionsWarned, {
      installedExtensions,
    });
    vscode.window
      .showWarningMessage(
        "We have detected some extensions that may conflict with Dendron. Further action is needed for Dendron to function correctly",
        "Fix conflicts...",
      )
      .then(async (resp) => {
        if (resp === "Fix conflicts...") {
          const cmd = new DoctorCommand(opts.ext);
          await cmd.execute({
            action: PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
            scope: "workspace",
            data: { installStatus },
          });
        }
      });
  }
}

export function showUninstallMarkdownLinksExtensionMessage() {
  if (VSCodeUtils.isExtensionInstalled("dendron.dendron-markdown-links")) {
    vscode.window
      .showInformationMessage(
        "Please uninstall the Dendron Markdown Links extension. Dendron has the note graph feature built-in now and having this legacy extension installed will interfere with its functionality.",
        { modal: true },
        { title: "Uninstall" },
      )
      .then(async (resp) => {
        if (resp?.title === "Uninstall") {
          await vscode.commands.executeCommand(
            "workbench.extensions.uninstallExtension",
            "dendron.dendron-markdown-links",
          );
        }
      });
  }
}

/**
 * A one-off logic to show a special webview message for the v0.100.0 launch.
 */
export function maybeShowProductHuntMessage() {
  // only show once
  if (MetadataService.instance().v100ReleaseMessageShown) {
    return;
  }

  const uri = VSCodeUtils.joinPath(
    VSCodeUtils.getAssetUri(ExtensionProvider.getExtension().context),
    "dendron-ws",
    "vault",
    "v100.html",
  );

  const { content } = readMD(uri.fsPath);
  const title = "Dendron Release Notes";

  const panel = vscode.window.createWebviewPanel(
    _.kebabCase(title),
    title,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    },
  );

  panel.webview.html = content;
  panel.reveal();

  AnalyticsUtils.track(VSCodeEvents.V100ReleaseNotesShown);

  MetadataService.instance().v100ReleaseMessageShown = true;
}

/**
 * Ping localhost; if blocked, show troubleshooting docs toaster.
 */
export async function showWhitelistingLocalhostDocsIfNecessary() {
  const pingArgs =
    os.platform() === "win32" ? "ping -n 1 127.0.0.1" : "ping -c 1 127.0.0.1";
  const { failed } = await (await import("execa")).execaCommand(pingArgs);
  if (failed) {
    AnalyticsUtils.track(ExtensionEvents.LocalhostBlockedNotified);
    vscode.window
      .showWarningMessage(
        "Dendron is facing issues while connecting with localhost. Please ensure that you don't have anything running that can block localhost.",
        ...["Open troubleshooting docs"],
      )
      .then((resp) => {
        if (resp === "Open troubleshooting docs") {
          AnalyticsUtils.track(ExtensionEvents.LocalhostBlockedAccepted);
          vscode.commands.executeCommand(
            "vscode.open",
            "https://wiki.dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe/#whitelisting-localhost",
          );
        } else {
          AnalyticsUtils.track(ExtensionEvents.LocalhostBlockedRejected);
        }
      });
  }
}
