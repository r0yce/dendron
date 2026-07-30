/**
 * Activate window / workspace / file watchers for DendronExtension.
 */
import { getStage } from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { PreviewPanelFactory } from "./components/views/PreviewViewFactory";
import { IDendronExtension } from "./dendronExtensionInterface";
import { ExtensionProvider } from "./ExtensionProvider";
import { FileWatcher } from "./fileWatcher";
import { Logger } from "./logger";
import { WindowWatcher } from "./windowWatcher";
import { WorkspaceWatcher } from "./WorkspaceWatcher";

export type WatcherHost = IDendronExtension & {
  windowWatcher?: WindowWatcher;
  fileWatcher?: FileWatcher;
  schemaSyncService: IDendronExtension["schemaSyncService"];
  context: vscode.ExtensionContext;
};

export async function activateWatchersForExtension(
  ext: WatcherHost
): Promise<void> {
  const ctx = "activateWorkspace";
  const stage = getStage();
  Logger.info({ ctx, stage, msg: "enter" });
  const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
  if (!wsRoot) {
    throw new Error(`rootDir not set when activating Watcher`);
  }

  const windowWatcher = new WindowWatcher({
    extension: ext,
    previewProxy: PreviewPanelFactory.create(ext),
  });

  windowWatcher.activate();
  for (const editor of vscode.window.visibleTextEditors) {
    windowWatcher.triggerUpdateDecorations(editor);
  }
  ext.windowWatcher = windowWatcher;
  const workspaceWatcher = new WorkspaceWatcher({
    schemaSyncService: ext.schemaSyncService,
    extension: ext,
    windowWatcher,
  });
  workspaceWatcher.activate(ext.context);

  const wsFolders = vscode.workspace.workspaceFolders;
  if (_.isUndefined(wsFolders) || _.isEmpty(wsFolders)) {
    Logger.info({
      ctx,
      msg: "no folders set for workspace",
    });
  }
  const fileWatcher = new FileWatcher({
    workspaceOpts: {
      wsRoot,
      vaults,
    },
  });

  fileWatcher.activate(ExtensionProvider.getExtension().context);
  ext.fileWatcher = fileWatcher;
}
