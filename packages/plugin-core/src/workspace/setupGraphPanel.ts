/**
 * Side graph panel + depth/edge toggle commands.
 */
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { GraphPanel } from "../views/GraphPanel";
import { sentryReportingCallback } from "../utils/analytics";

export function setupGraphPanel(ext: IDendronExtension) {
    const graphPanel = new GraphPanel(ext);

    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_INCREASE_DEPTH.key,
      sentryReportingCallback(() => {
        graphPanel.increaseGraphDepth();
      })
    );
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_DECREASE_DEPTH.key,
      sentryReportingCallback(() => {
        graphPanel.decreaseGraphDepth();
      })
    );
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_SHOW_BACKLINKS_CHECKED.key,
      sentryReportingCallback(() => {
        graphPanel.showBacklinks = false;
      })
    );
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_SHOW_BACKLINKS.key,
      sentryReportingCallback(() => {
        graphPanel.showBacklinks = true;
      })
    );
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_SHOW_OUTWARD_LINKS_CHECKED.key,
      sentryReportingCallback(() => {
        graphPanel.showOutwardLinks = false;
      })
    );
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_SHOW_OUTWARD_LINKS.key,
      sentryReportingCallback(() => {
        graphPanel.showOutwardLinks = true;
      })
    );
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_SHOW_HIERARCHY_CHECKED.key,
      sentryReportingCallback(() => {
        graphPanel.showHierarchy = false;
      })
    );
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GRAPH_PANEL_SHOW_HIERARCHY.key,
      sentryReportingCallback(() => {
        graphPanel.showHierarchy = true;
      })
    );
    return vscode.window.registerWebviewViewProvider(
      GraphPanel.viewType,
      graphPanel
    );
  }