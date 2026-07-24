/**
 * Workspace reload / engine API helpers for WorkspaceActivator.
 */
import {
  CONSTANTS,
  DendronError,
} from "@dendronhq/common-all";
import type { IDendronExtension } from "../dendronExtensionInterface";
import { HistoryService, WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import semver from "semver";
import * as vscode from "vscode";
import { DENDRON_COMMANDS, DendronContext } from "../constants";
import { Logger } from "../logger";
import { EngineAPIService } from "../services/EngineAPIService";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { WSUtils } from "../WSUtils";
import { WorkspaceInitFactory } from "./WorkspaceInitFactory";

export async function postReloadWorkspace({
  wsService,
}: {
  wsService: WorkspaceService;
}) {
  const ctx = "postReloadWorkspace";
  if (!wsService) {
    const errorMsg = "No workspace service found.";
    Logger.error({
      msg: errorMsg,
      error: new DendronError({ message: errorMsg }),
    });
    return;
  }

  const wsMeta = wsService.getMeta();
  const previousWsVersion = wsMeta.version;
  // stats
  // NOTE: this is legacy to upgrade .code-workspace specific settings
  // we are moving everything to dendron.yml
  // see [[2021 06 Deprecate Workspace Settings|proj.2021-06-deprecate-workspace-settings]]
  if (previousWsVersion === CONSTANTS.DENDRON_INIT_VERSION) {
    Logger.info({ ctx, msg: "no previous global version" });
    vscode.commands
      .executeCommand(DENDRON_COMMANDS.UPGRADE_SETTINGS.key)
      .then((changes) => {
        Logger.info({ ctx, msg: "postUpgrade: new wsVersion", changes });
      });
    wsService.writeMeta({ version: DendronExtension.version() });
  } else {
    const newVersion = DendronExtension.version();
    if (semver.lt(previousWsVersion, newVersion)) {
      let changes: any;
      Logger.info({ ctx, msg: "preUpgrade: new wsVersion" });
      try {
        changes = await vscode.commands.executeCommand(
          DENDRON_COMMANDS.UPGRADE_SETTINGS.key
        );
        Logger.info({
          ctx,
          msg: "postUpgrade: new wsVersion",
          changes,
          previousWsVersion,
          newVersion,
        });
        wsService.writeMeta({ version: DendronExtension.version() });
      } catch (err) {
        Logger.error({
          msg: "error upgrading",
          error: new DendronError({ message: JSON.stringify(err) }),
        });
        return;
      }
      HistoryService.instance().add({
        source: "extension",
        action: "upgraded",
        data: { changes },
      });
    } else {
      Logger.info({ ctx, msg: "same wsVersion" });
    }
  }
  Logger.info({ ctx, msg: "exit" });
}

export async function reloadWorkspace({
  ext,
  wsService,
}: {
  ext: IDendronExtension;
  wsService: WorkspaceService;
}) {
  const ctx = "reloadWorkspace";
  const ws = ext.getDWorkspace();
  const maybeEngine = await WSUtils.reloadWorkspace();
  if (!maybeEngine) {
    return maybeEngine;
  }
  Logger.info({ ctx, msg: "post-ws.reloadWorkspace" });

  // Run any initialization code necessary for this workspace invocation.
  const initializer = WorkspaceInitFactory.create();

  if (initializer?.onWorkspaceOpen) {
    initializer.onWorkspaceOpen({ ws });
  }

  vscode.window.showInformationMessage("Dendron is active");
  Logger.info({ ctx, msg: "exit" });

  await postReloadWorkspace({ wsService });
  HistoryService.instance().add({
    source: "extension",
    action: "initialized",
  });
  return maybeEngine;
}

export function togglePluginActiveContext(enabled: boolean) {
  const ctx = "togglePluginActiveContext";
  Logger.info({ ctx, state: `togglePluginActiveContext: ${enabled}` });
  VSCodeUtils.setContext(DendronContext.PLUGIN_ACTIVE, enabled);
  VSCodeUtils.setContext(DendronContext.HAS_CUSTOM_MARKDOWN_VIEW, enabled);
}

export function updateEngineAPI(
  port: number | string,
  ext: IDendronExtension
): EngineAPIService {
  // set engine api ^9dr6chh7ah9v
  const svc = EngineAPIService.createEngine({
    port,
    enableWorkspaceTrust: vscode.workspace.isTrusted,
    vaults: ext.getDWorkspace().vaults,
    wsRoot: ext.getDWorkspace().wsRoot,
  });
  ext.setEngine(svc);
  ext.port = _.toInteger(port);

  return svc;
}
