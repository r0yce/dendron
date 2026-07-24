import { PreviewPanelFactory } from "../components/views/PreviewViewFactory";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = void;

/**
 * Navigate preview history backward (Sprint 2).
 * History is owned by the singleton PreviewPanel.
 */
export class PreviewBackCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.PREVIEW_BACK.key;
  static requireActiveWorkspace = true;
  private _ext: IDendronExtension;

  constructor(extension: IDendronExtension) {
    super();
    this._ext = extension;
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const preview = PreviewPanelFactory.create(this._ext);
    await preview.goBack();
  }
}

/**
 * Navigate preview history forward (Sprint 2).
 */
export class PreviewForwardCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.PREVIEW_FORWARD.key;
  static requireActiveWorkspace = true;
  private _ext: IDendronExtension;

  constructor(extension: IDendronExtension) {
    super();
    this._ext = extension;
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const preview = PreviewPanelFactory.create(this._ext);
    await preview.goForward();
  }
}
