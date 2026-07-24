/**
 * Native tree view registration + tree-related commands.
 */
import { TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { CreateNoteCommand } from "../commands/CreateNoteCommand";
import { DENDRON_COMMANDS } from "../constants";
import { container } from "../di/inject";
import { NativeTreeView } from "../views/common/treeview/NativeTreeView";
import { sentryReportingCallback } from "../utils/analytics";

function setupTreeViewCommands(
  treeView: NativeTreeView,
  existingCommands: string[],
) {
  if (
    !existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_LABEL_BY_TITLE.key)
  ) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_LABEL_BY_TITLE.key,
      sentryReportingCallback(() => {
        treeView.updateLabelType({
          labelType: TreeViewItemLabelTypeEnum.title,
        });
      }),
    );
  }

  if (
    !existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_LABEL_BY_FILENAME.key)
  ) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_LABEL_BY_FILENAME.key,
      sentryReportingCallback(() => {
        treeView.updateLabelType({
          labelType: TreeViewItemLabelTypeEnum.filename,
        });
      }),
    );
  }

  if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key)) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key,
      sentryReportingCallback(async (opts) => {
        await new CreateNoteCommand().run(opts);
      }),
    );
  }

  /**
   * This is a little flaky right now, but it works most of the time.
   * Leaving this for dev / debug purposes.
   * Enablement is set to be DendronContext.DEV_MODE
   *
   * TODO: fix tree item register issue and flip the dev mode flag.
   */
  if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_EXPAND_ALL.key)) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_EXPAND_ALL.key,
      sentryReportingCallback(async () => {
        await treeView.expandAll();
      }),
    );
  }

  if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key)) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key,
      sentryReportingCallback(async (id) => {
        await treeView.expandTreeItem(id);
      }),
    );
  }
}

export async function initTreeView({
  context,
}: {
  context: vscode.ExtensionContext;
}) {
  const existingCommands = await vscode.commands.getCommands();
  const treeView = container.resolve(NativeTreeView);
  treeView.show();
  setupTreeViewCommands(treeView, existingCommands);
  context.subscriptions.push(treeView);
}
