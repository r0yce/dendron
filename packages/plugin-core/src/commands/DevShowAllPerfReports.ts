import { globalPerfRing } from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import {
  getAllPerfReports,
  clearPerfReports,
  getDevOutputChannel,
} from "../utils/dev";
import * as vscode from "vscode";

type CommandOpts = {};
type CommandInput = {};
type CommandOutput = void;

/**
 * Development command that shows all recorded performance reports from the current session
 * in the clean "Dendron Dev" output channel, plus the process-wide PerfRingBuffer summary.
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
    const ringReport = globalPerfRing.formatReport(30);
    const ringSnap = globalPerfRing.toSnapshot(50);

    const channel = getDevOutputChannel();
    channel.clear();

    channel.appendLine("=== PerfRingBuffer (process-wide) ===");
    channel.appendLine(ringReport);
    channel.appendLine(
      `avg=${ringSnap.summary.avgDurationMs.toFixed(1)}ms p95=${ringSnap.summary.p95DurationMs.toFixed(1)}ms written=${globalPerfRing.written}`,
    );
    channel.appendLine("");

    if (reports.length === 0) {
      channel.appendLine("No named session perf reports yet.");
      channel.appendLine(
        "Trigger lookup, graph, backlinks, reload index, or preview (DENDRON_PERF=1 for extra logging).",
      );
      channel.appendLine("CLI: yarn dendron dev dump_perf");
      channel.show(true);
      return;
    }

    channel.appendLine(`=== Named session reports (${reports.length}) ===\n`);

    reports.forEach((entry, index) => {
      channel.appendLine(
        `[${index + 1}] ${entry.name} @ ${entry.timestamp.toLocaleTimeString()}`,
      );
      channel.appendLine(entry.report);
      channel.appendLine("---");
    });

    channel.show(true);

    const choice = await vscode.window.showInformationMessage(
      `${reports.length} named reports + ring (${ringSnap.summary.totalEntries}) in "Dendron Dev".`,
      "Clear Reports",
      "Clear Ring",
      "Copy All to Clipboard",
    );

    if (choice === "Clear Reports") {
      clearPerfReports();
      vscode.window.showInformationMessage("Named perf reports cleared.");
    } else if (choice === "Clear Ring") {
      globalPerfRing.clear();
      vscode.window.showInformationMessage("PerfRingBuffer cleared.");
    } else if (choice === "Copy All to Clipboard") {
      const allText = [
        ringReport,
        "",
        ...reports.map(
          (entry) =>
            `[${entry.name} @ ${entry.timestamp.toISOString()}]\n${entry.report}`,
        ),
      ].join("\n\n");
      await vscode.env.clipboard.writeText(allText);
      vscode.window.showInformationMessage(
        "Perf reports + ring copied to clipboard.",
      );
    }
  }
}
