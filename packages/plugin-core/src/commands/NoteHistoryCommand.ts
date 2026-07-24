import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { NoteHistoryService } from "../services/NoteHistoryService";
import { BasicCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {};
type CommandOutput = void;

async function openEntry(
  ext: IDendronExtension,
  entry: { fname: string; vaultFsPath: string }
) {
  const vault = ext
    .getDWorkspace()
    .vaults.find((v) => v.fsPath === entry.vaultFsPath);
  await new GotoNoteCommand(ext).execute({
    qs: entry.fname,
    ...(vault ? { vault } : {}),
  });
}

export class NoteHistoryBackCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.NOTE_HISTORY_BACK.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    if (!NoteHistoryService.canGoBack()) {
      window.showInformationMessage("No previous Dendron note in history.");
      return;
    }
    await NoteHistoryService.goBack((e) => openEntry(this._ext, e));
  }
}

export class NoteHistoryForwardCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.NOTE_HISTORY_FORWARD.key;
  static requireActiveWorkspace = true;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    if (!NoteHistoryService.canGoForward()) {
      window.showInformationMessage("No next Dendron note in history.");
      return;
    }
    await NoteHistoryService.goForward((e) => openEntry(this._ext, e));
  }
}
