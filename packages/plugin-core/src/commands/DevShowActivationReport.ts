import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { getLastActivationReport, getDevOutputChannel } from "../utils/dev";
import * as vscode from "vscode";

type CommandOpts = {};
type CommandInput = {};
type CommandOutput = void;

/**
 * Development command that shows the last activation performance report
 * in a clean, readable format.
 */
export class DevShowActivationReport extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.DEV_SHOW_ACTIVATION_REPORT.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute() {
    const report = getLastActivationReport();

    if (!report) {
      vscode.window.showWarningMessage(
        "No activation report available yet. Restart the Extension Development Host to capture one."
      );
      return;
    }

    // Show in the dedicated clean dev channel
    const channel = getDevOutputChannel();
    channel.clear();
    channel.appendLine(report);
    channel.show(true);

    // Also offer to copy to clipboard
    const choice = await vscode.window.showInformationMessage(
      "Activation report shown in 'Dendron Dev' output channel.",
      "Copy to Clipboard"
    );

    if (choice === "Copy to Clipboard") {
      await vscode.env.clipboard.writeText(report);
      vscode.window.showInformationMessage("Activation report copied to clipboard.");
    }
  }
}
