/**
 * Sidebar / tree view registration after extension "initialized" history event.
 */
import { HistoryService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { IDendronExtension } from "./dendronExtensionInterface";
import type BacklinksTreeDataProviderType from "./features/BacklinksTreeDataProvider";
import { Logger } from "./logger";
import { registerHtmlSidePanels } from "./workspace/registerSidePanels";
import { setupBacklinkTreeView } from "./workspace/setupBacklinks";
import { setupGraphPanel } from "./workspace/setupGraphPanel";
import { setupTipOfTheDayView } from "./workspace/setupTipOfTheDay";

/** Host must allow `backlinksDataProvider` to be explicitly undefined (exactOptionalPropertyTypes). */
type BacklinksHost = IDendronExtension & {
  backlinksDataProvider: BacklinksTreeDataProviderType | undefined;
};

export async function setupViewsForExtension(
  ext: BacklinksHost,
  context: vscode.ExtensionContext
): Promise<void> {
  const ctx = "setupViews";
  HistoryService.instance().subscribe("extension", async (event) => {
    if (event.action === "initialized") {
      Logger.info({ ctx, msg: "init:treeViewV2" });

      // IMPORTANT: register WebviewViewProviders in the same turn as
      // "initialized". Deferring with setTimeout leaves calendar/graph
      // empty — VS Code resolves visible sidebar views when the provider
      // is registered; a delayed register can miss resolveWebviewView.
      // (Sprint 1 lazy-activation lesson; keep deferred work elsewhere.)

      registerHtmlSidePanels(ext, context);

      // backlinks / tip-of-day / graph still need instance methods below
      const backlinkTreeView = setupBacklinkTreeView(ext);
      const tipOfDayView = setupTipOfTheDayView();
      const graphPanel = setupGraphPanel(ext);

      context.subscriptions.push(backlinkTreeView);
      context.subscriptions.push(tipOfDayView);
      context.subscriptions.push(graphPanel);
    }
  });
}
