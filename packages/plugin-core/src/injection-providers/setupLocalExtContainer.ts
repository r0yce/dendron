import "reflect-metadata";
import { DVault } from "@dendronhq/common-all";
import { registerDesktopDependencies, TOKENS } from "../di/inject"; // Phase 2: use shim (delegates pure to @dendronhq/common-di)
import * as vscode from "vscode";
import { EngineAPIService } from "../services/EngineAPIService";
import { MetadataSvcTreeViewConfig } from "../views/node/treeview/MetadataSvcTreeViewConfig";
import { ITreeViewConfig } from "../views/common/treeview/ITreeViewConfig";

export async function setupLocalExtContainer(opts: {
  wsRoot: string;
  vaults: DVault[];
  engine: EngineAPIService;
}) {
  const { wsRoot, engine, vaults } = opts;
  // Phase 2 proof migration (desktop reg site): delegate pure core (wsRoot, vaults, engine, emitter alias) to common-di via shim.
  // vscode.Uri + ITreeViewConfig (MetadataSvc) stay local (vscode-tied or plugin-core impl).
  registerDesktopDependencies({ wsRoot, vaults, engine });
  // vscode-tied value for wsRoot (Uri) - keep here per ADR (common-di uses plain string)
  const { container } = await import("../di/inject"); // lazy to avoid cycle in shim
  container.register(TOKENS.WsRoot, { useValue: vscode.Uri.file(wsRoot) }); // or registerInstance if preferred
  container.register<ITreeViewConfig>(TOKENS.ITreeViewConfig, {
    useClass: MetadataSvcTreeViewConfig,
  });
  // Note: legacy string registers removed in favor of TOKENS (compat aliases in common-di)
}
