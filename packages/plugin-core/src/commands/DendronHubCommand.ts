import { window, QuickPickItem, commands } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = void;

type HubItem = QuickPickItem & { command: string; args?: unknown };

/**
 * Sprint 2: Dendron Hub — single QuickPick for the most common Dendron actions.
 * Prefer this over hunting the full command palette.
 */
export class DendronHubCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_HUB.key;
  static requireActiveWorkspace = false;

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const items: HubItem[] = [
      {
        label: "$(search) Note Lookup",
        description: "Find or create a note",
        command: DENDRON_COMMANDS.LOOKUP_NOTE.key,
      },
      {
        label: "$(calendar) Daily Journal",
        description: "Open or create today's journal",
        command: DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key,
      },
      {
        label: "$(inbox) Capture to Inbox",
        description: "Quick capture (Cmd/Ctrl+Alt+C)",
        command: DENDRON_COMMANDS.CAPTURE_INBOX.key,
      },
      {
        label: "$(book) Review Ritual",
        description: "Daily or weekly review of recent notes",
        command: DENDRON_COMMANDS.REVIEW_RITUAL.key,
      },
      {
        label: "$(checklist) Task Board",
        description: "Browse tasks by status",
        command: DENDRON_COMMANDS.TASK_BOARD.key,
      },
      {
        label: "$(sparkle) Local AI Assist",
        description: "Opt-in local AI scaffold / endpoint",
        command: DENDRON_COMMANDS.LOCAL_AI_ASSIST.key,
      },
      {
        label: "$(folder) Vault Focus",
        description: "Limit work to one vault",
        command: DENDRON_COMMANDS.VAULT_FOCUS.key,
      },
      {
        label: "$(versions) Workmodes",
        description: "Named spaces (vault presets)",
        command: DENDRON_COMMANDS.WORKMODE.key,
      },
      {
        label: "$(replace-all) Safe Bulk Rename",
        description: "Dry-run hierarchy renames",
        command: DENDRON_COMMANDS.SAFE_BULK_RENAME.key,
      },
      {
        label: "$(open-preview) Toggle Preview",
        description: "Show/hide note preview",
        command: DENDRON_COMMANDS.TOGGLE_PREVIEW.key,
      },
      {
        label: "$(type-hierarchy) Note Graph",
        description: "Open full note graph",
        command: DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key,
      },
      {
        label: "$(refresh) Reload Index",
        description: "Rescan vault notes",
        command: DENDRON_COMMANDS.RELOAD_INDEX.key,
      },
      {
        label: "$(gear) Configure (UI)",
        description: "Dendron settings UI",
        command: DENDRON_COMMANDS.CONFIGURE_UI.key,
      },
      {
        label: "$(gear) Configure (YAML)",
        description: "Open dendron.yml",
        command: DENDRON_COMMANDS.CONFIGURE_RAW.key,
      },
      {
        label: "$(new-file) Create Note",
        description: "Create a note by name",
        command: DENDRON_COMMANDS.CREATE_NOTE.key,
      },
      {
        label: "$(random) Random Note",
        description: "Jump to a random note",
        command: DENDRON_COMMANDS.RANDOM_NOTE.key,
      },
      {
        label: "$(book) Show Welcome",
        description: "Welcome / getting started",
        command: DENDRON_COMMANDS.SHOW_WELCOME_PAGE.key,
      },
      {
        label: "$(question) Show Help",
        description: "Open Dendron docs",
        command: DENDRON_COMMANDS.SHOW_HELP.key,
      },
    ];

    const picked = await window.showQuickPick(items, {
      title: "Dendron Hub",
      placeHolder: "What do you want to do?",
      matchOnDescription: true,
    });
    if (!picked) {
      return;
    }
    await commands.executeCommand(picked.command, picked.args);
  }
}
