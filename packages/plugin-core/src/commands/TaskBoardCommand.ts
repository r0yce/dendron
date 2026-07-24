import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { TaskBoardPanelFactory } from "../views/TaskBoardPanelFactory";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = void;

/**
 * Open the Task Board kanban in the editor area (full-width webview panel).
 * The sidebar "Task Board" view remains available in the Dendron activity bar.
 */
export class TaskBoardCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.TASK_BOARD.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    try {
      await TaskBoardPanelFactory.open(this._ext);
    } catch (err: any) {
      window.showErrorMessage(
        `Could not open Task Board: ${err?.message || String(err)}`
      );
    }
  }
}
