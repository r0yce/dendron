import {
  PodItemV4,
  SnapshotExportPod,
  SnapshotExportPodResp,
} from "@dendronhq/pods-core";
import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { BaseCommand } from "./base";

type CommandOpts = {};

type CommandInput = { podChoice: PodItemV4 };

type CommandOutput = SnapshotExportPodResp;
export { CommandOpts as SnapshotVaultCommandOpts };

export class SnapshotVaultCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SNAPSHOT_VAULT.key;
  constructor(private _ext: IDendronExtension) {
    super();
  }
  async gatherInputs(): Promise<any> {
    return {};
  }

  async enrichInputs(_inputs: CommandInput): Promise<CommandOpts | undefined> {
    return {};
  }

  async execute(_opts: CommandOpts) {
    const pod = new SnapshotExportPod();
    const { engine } = this._ext.getDWorkspace();
    const vault = engine.vaults[0]!;
    const { wsRoot } = this._ext.getDWorkspace();
    const { data: snapshotDirPath } = await pod.execute({
      vaults: [vault],
      wsRoot,
      engine,
      config: {} as any /* TODO: SnapshotExportPod / pod opts expect full DendronConfig (exactOptional strict); legacy partial snapshot mock; 4-axis style + dated final burn (2026-06-01 per ts-expect-error-burner). Real: pass minimal valid config or widen pod type. */,
    });
    window.showInformationMessage(`snapshot made to ${snapshotDirPath}`);
    return { snapshotDirPath };
  }
}
