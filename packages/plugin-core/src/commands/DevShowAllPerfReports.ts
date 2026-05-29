import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { getAllPerfReports, clearPerfReports, getDevOutputChannel } from "../utils/dev";
import * as vscode from "vscode";

type CommandOpts = {};
type CommandInput = {};
type CommandOutput = void;

/**
 * Development command that shows all recorded performance reports from the current session
 * in the clean "Dendron Dev" output channel.
 */
export class DevShowAllPerfReports extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.DEV_SHOW_ALL_PERF_REPORTS.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute() {
    const reports = getAllPerfReports();

    const channel = getDevOutputChannel();
    channel.clear();

    if (reports.length === 0) {
      channel.appendLine("No performance reports recorded in this session yet.");
      channel.appendLine("Trigger some actions (lookup, graph, backlinks, reload index, preview) with DENDRON_PERF=1 enabled.");
      channel.show(true);
      return;
    }

    channel.appendLine(`=== All Perf Reports (${reports.length} total) ===\n`);

    reports.forEach((entry, index) => {
      channel.appendLine(`[${index + 1}] ${entry.name} @ ${entry.timestamp.toLocaleTimeString()}`);
      channel.appendLine(entry.report);
      channel.appendLine("---");
    });

    channel.show(true);

    const choice = await vscode.window.showInformationMessage(
      `${reports.length} perf reports shown in "Dendron Dev" channel.`,
      "Clear Reports",
      "Copy All to Clipboard"
    );

    if (choice === "Clear Reports") {
      clearPerfReports();
      vscode.window.showInformationMessage("Perf reports cleared.");
    } else if (choice === "Copy All to Clipboard") {
      const allText = reports
        .map((entry) => `[${entry.name} @ ${entry.timestamp.toISOString()}]\n${entry.report}`)
        .join("\n\n");
      await vscode.env.clipboard.writeText(allText);
      vscode.window.showInformationMessage("All perf reports copied to clipboard.");
    }
  }
}
