/**
 * Command registration for the extension host.
 * Split from `_extension.ts` for maintainability.
 */
import { isDisposable } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { ALL_COMMANDS } from "../commands";
import { ConfigureWithUICommand } from "../commands/ConfigureWithUICommand";
import { GoToSiblingCommand } from "../commands/GoToSiblingCommand";
import { GotoNoteCommand } from "../commands/GotoNote";
import { SeedAddCommand } from "../commands/SeedAddCommand";
import {
  SeedBrowseCommand,
  WebViewPanelFactory,
} from "../commands/SeedBrowseCommand";
import { SeedRemoveCommand } from "../commands/SeedRemoveCommand";
import { ShowNoteGraphCommand } from "../commands/ShowNoteGraph";
import { ShowSchemaGraphCommand } from "../commands/ShowSchemaGraph";
import { TogglePreviewCommand } from "../commands/TogglePreview";
import { TogglePreviewLockCommand } from "../commands/TogglePreviewLock";
import { ConfigureUIPanelFactory } from "../components/views/ConfigureUIPanelFactory";
import { NoteGraphPanelFactory } from "../components/views/NoteGraphViewFactory";
import { PreviewPanelFactory } from "../components/views/PreviewViewFactory";
import { SchemaGraphViewFactory } from "../components/views/SchemaGraphViewFactory";
import { DENDRON_COMMANDS } from "../constants";
import { sentryReportingCallback } from "../utils/analytics";
import { ExtensionUtils } from "../utils/ExtensionUtils";
import { DendronExtension } from "../workspace";

export async function setupCommands({
  ext,
  context,
  // If your command needs access to the engine at setup, requireActiveWorkspace should be set to true
  requireActiveWorkspace,
}: {
  ext: DendronExtension;
  context: vscode.ExtensionContext;
  requireActiveWorkspace: boolean;
}) {
  const existingCommands = await vscode.commands.getCommands();

  // add all commands
  ALL_COMMANDS.map((Cmd) => {
    // only process commands that match the filter
    if (Cmd.requireActiveWorkspace !== requireActiveWorkspace) {
      return;
    }
    const cmd = new Cmd(ext);
    if (isDisposable(cmd)) {
      context.subscriptions.push(cmd);
    }

    if (!existingCommands.includes(cmd.key))
      context.subscriptions.push(
        vscode.commands.registerCommand(
          cmd.key,
          sentryReportingCallback(async (args: any) => {
            await cmd.run(args);
          }),
        ),
      );
  });
  // ---
  if (requireActiveWorkspace === true) {
    if (!existingCommands.includes(DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key,
          sentryReportingCallback(async () => {
            await new GoToSiblingCommand().execute({ direction: "next" });
          }),
        ),
      );
    }
    if (!existingCommands.includes(DENDRON_COMMANDS.GO_PREV_HIERARCHY.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.GO_PREV_HIERARCHY.key,
          sentryReportingCallback(async () => {
            await new GoToSiblingCommand().execute({ direction: "prev" });
          }),
        ),
      );
    }

    const preview = PreviewPanelFactory.create(ext);

    if (!existingCommands.includes(DENDRON_COMMANDS.TOGGLE_PREVIEW.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.TOGGLE_PREVIEW.key,
          sentryReportingCallback(async (args) => {
            if (args === undefined) {
              args = {};
            }
            await new TogglePreviewCommand(preview).run(args);
          }),
        ),
      );
    }

    if (!existingCommands.includes(DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key,
          sentryReportingCallback(async (args) => {
            if (args === undefined) {
              args = {};
            }
            await new TogglePreviewLockCommand(preview).run(args);
          }),
        ),
      );
    }

    if (!existingCommands.includes(DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key,
          sentryReportingCallback(async () => {
            await new ShowSchemaGraphCommand(
              SchemaGraphViewFactory.create(ext),
            ).run();
          }),
        ),
      );
    }

    if (!existingCommands.includes(DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key,
          sentryReportingCallback(async () => {
            await new ShowNoteGraphCommand(
              NoteGraphPanelFactory.create(ext, ext.getEngine()),
            ).run();
          }),
        ),
      );
    }

    if (!existingCommands.includes(DENDRON_COMMANDS.CONFIGURE_UI.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.CONFIGURE_UI.key,
          sentryReportingCallback(async () => {
            await new ConfigureWithUICommand(
              ConfigureUIPanelFactory.create(ext),
            ).run();
          }),
        ),
      );
    }
    if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key,
          sentryReportingCallback(async (id: string) => {
            const resp = await ext.getEngine().getNoteMeta(id);
            const { data } = resp;
            await new GotoNoteCommand(ext).run({
              qs: data?.fname,
              vault: data?.vault,
            });
          }),
        ),
      );
    }
  }

  // NOTE: seed commands currently DO NOT take extension as a first argument
  ExtensionUtils.addCommand({
    context,
    key: DENDRON_COMMANDS.SEED_ADD.key,
    cmd: new SeedAddCommand(),
    existingCommands,
  });

  ExtensionUtils.addCommand({
    context,
    key: DENDRON_COMMANDS.SEED_REMOVE.key,
    cmd: new SeedRemoveCommand(),
    existingCommands,
  });

  if (!existingCommands.includes(DENDRON_COMMANDS.SEED_BROWSE.key)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.SEED_BROWSE.key,
        sentryReportingCallback(async () => {
          const panel = WebViewPanelFactory.create(
            ext.workspaceService!.seedService,
          );
          const cmd = new SeedBrowseCommand(panel);

          return cmd.run();
        }),
      ),
    );
  }
}
