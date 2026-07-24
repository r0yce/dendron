/**
 * Backlinks tree view + sort/expand commands.
 */
import {
  BacklinkPanelSortOrder,
  DendronTreeViewKey,
  VSCodeEvents,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Backlink } from "../features/Backlink";
import BacklinksTreeDataProvider from "../features/BacklinksTreeDataProvider";
import { Logger } from "../logger";
import { AnalyticsUtils, sentryReportingCallback } from "../utils/analytics";
import type { IDendronExtension } from "../dendronExtensionInterface";
import type BacklinksTreeDataProviderType from "../features/BacklinksTreeDataProvider";

/** Host must allow `backlinksDataProvider` to be explicitly undefined (exactOptionalPropertyTypes). */
type BacklinksHost = IDendronExtension & {
  backlinksDataProvider: BacklinksTreeDataProviderType | undefined;
};

export function setupBacklinkTreeView(ext: BacklinksHost) {
    const ctx = "setupBacklinkTreeView";
    Logger.info({ ctx, msg: "init:backlinks" });
    const config = ext.getDWorkspace().config;

    const backlinksTreeDataProvider = new BacklinksTreeDataProvider(
      ext.getEngine() as any,
      config,
    );

    const backlinkTreeView = vscode.window.createTreeView(
      DendronTreeViewKey.BACKLINKS,
      {
        treeDataProvider: backlinksTreeDataProvider,
        showCollapseAll: true,
      }
    );

    backlinkTreeView.onDidExpandElement(() => {
      AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
        type: "ExpandElement",
      });
    });

    backlinkTreeView.onDidChangeVisibility((e) => {
      AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
        type: "VisibilityChanged",
        state: e.visible ? "Visible" : "Collapsed",
      });
    });

    ext.backlinksDataProvider = backlinksTreeDataProvider;
    ext.context.subscriptions.push(backlinksTreeDataProvider);

    vscode.commands.registerCommand(
      DENDRON_COMMANDS.BACKLINK_SORT_BY_LAST_UPDATED.key,
      sentryReportingCallback(() => {
        AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
          type: "SortOrderChanged",
          state: "SortByLastUpdated",
        });

        backlinksTreeDataProvider.sortOrder =
          BacklinkPanelSortOrder.LastUpdated;
      })
    );

    vscode.commands.registerCommand(
      DENDRON_COMMANDS.BACKLINK_SORT_BY_PATH_NAMES.key,
      sentryReportingCallback(() => {
        AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
          type: "SortOrderChanged",
          state: "SortByPathName",
        });

        backlinksTreeDataProvider.sortOrder = BacklinkPanelSortOrder.PathNames;
      })
    );

    vscode.commands.registerCommand(
      DENDRON_COMMANDS.BACKLINK_SORT_BY_LAST_UPDATED_CHECKED.key,
      sentryReportingCallback(() => {
        AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
          type: "SortOrderChanged",
          state: "SortByLastUpdated",
        });

        backlinksTreeDataProvider.sortOrder =
          BacklinkPanelSortOrder.LastUpdated;
      })
    );

    vscode.commands.registerCommand(
      DENDRON_COMMANDS.BACKLINK_SORT_BY_PATH_NAMES_CHECKED.key,
      sentryReportingCallback(() => {
        AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
          type: "SortOrderChanged",
          state: "SortByPathName",
        });

        backlinksTreeDataProvider.sortOrder = BacklinkPanelSortOrder.PathNames;
      })
    );

    vscode.commands.registerCommand(
      DENDRON_COMMANDS.BACKLINK_EXPAND_ALL.key,
      sentryReportingCallback(async () => {
        function expand(backlink: Backlink) {
          backlinkTreeView.reveal(backlink, {
            expand: true,
            focus: false,
            select: false,
          });
        }

        const children = await backlinksTreeDataProvider.getChildren();
        children?.forEach((backlink) => {
          expand(backlink);
        });
      })
    );

    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GOTO_BACKLINK.key,
      (uri, options, isCandidate) => {
        AnalyticsUtils.track(VSCodeEvents.BacklinksPanelUsed, {
          type: "BacklinkClicked",
          state: isCandidate === true ? "Candidate" : "Link",
        });

        vscode.commands.executeCommand("vscode.open", uri, options);
      }
    );

    return backlinkTreeView;
  }