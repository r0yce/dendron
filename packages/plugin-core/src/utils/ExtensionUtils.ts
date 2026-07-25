/**
 * Extension host shell — command registration, context, server, telemetry.
 * Peels: extensionServerProcess, extensionTelemetry.
 */
import { ConfigEvents, DendronConfig, getStage } from "@dendronhq/common-all";
import { ServerUtils } from "@dendronhq/api-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { DendronContext } from "../constants";
import { IBaseCommand } from "../types";
import { MarkdownUtils } from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { AnalyticsUtils, sentryReportingCallback } from "../utils/analytics";
import { startServerProcessForWorkspace } from "./extensionServerProcess";
import {
  getAndTrackInstallStatus,
  getCodeFolderCreated,
  getTutorialIds,
  trackWorkspaceInit,
} from "./extensionTelemetry";

export class ExtensionUtils {
  static async activate() {
    const ext = this.getExtension();
    return ext.activate();
  }

  static addCommand = ({
    context,
    key,
    cmd,
    existingCommands,
  }: {
    context: vscode.ExtensionContext;
    key: string;
    cmd: IBaseCommand;
    existingCommands: string[];
  }) => {
    if (!existingCommands.includes(key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          key,
          sentryReportingCallback(async (args) => {
            cmd.run(args);
          }),
        ),
      );
    }
  };

  static getExtension() {
    const extName =
      getStage() === "dev"
        ? "dendron.@dendronhq/plugin-core"
        : "dendron.dendron";
    const ext = vscode.extensions.getExtension(extName);
    return ext as vscode.Extension<any>;
  }

  static _TUTORIAL_IDS: Set<string> | undefined;
  static getTutorialIds(): Set<string> {
    // Keep class-level cache in sync with module helper for any external readers of _TUTORIAL_IDS.
    const ids = getTutorialIds();
    ExtensionUtils._TUTORIAL_IDS = ids;
    return ids;
  }

  static setWorkspaceContextOnActivate(dendronConfig: DendronConfig) {
    if (VSCodeUtils.isDevMode()) {
      vscode.commands.executeCommand(
        "setContext",
        DendronContext.DEV_MODE,
        true,
      );
    }
    // used for enablement of legacy show preview command.
    VSCodeUtils.setContext(
      DendronContext.HAS_LEGACY_PREVIEW,
      MarkdownUtils.hasLegacyPreview(),
    );

    //used for enablement of export pod v2 command
    VSCodeUtils.setContext(
      DendronContext.ENABLE_EXPORT_PODV2,
      dendronConfig.dev?.enableExportPodV2 ?? false,
    );

    // @deprecate: should track as property of workspace init instead
    if (dendronConfig.dev?.enableExportPodV2) {
      AnalyticsUtils.track(ConfigEvents.EnabledExportPodV2);
    }
  }

  /**
   * Setup segment client
   * Also setup cache flushing in case of missed uploads
   */
  static async startServerProcess({
    context,
    start,
    wsService,
    onExit,
  }: {
    context: vscode.ExtensionContext;
    wsService: WorkspaceService;
    start: [number, number];
    onExit: Parameters<(typeof ServerUtils)["onProcessExit"]>[0]["cb"];
  }) {
    return startServerProcessForWorkspace({
      context,
      start,
      wsService,
      onExit,
    });
  }

  static getAndTrackInstallStatus = getAndTrackInstallStatus;

  static trackWorkspaceInit = trackWorkspaceInit;

  static getCodeFolderCreated = getCodeFolderCreated;
}
