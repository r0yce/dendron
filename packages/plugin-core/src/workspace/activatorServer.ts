/**
 * Engine server process start / attach for workspace activation.
 */
import { SubProcessExitType } from "@dendronhq/api-server";
import { VSCodeEvents } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import type { IDendronExtension } from "../dendronExtensionInterface";
import { AnalyticsUtils } from "../utils/analytics";
import { ExtensionUtils } from "../utils/ExtensionUtils";

/**
 * Return the engine port, starting a server process when needed.
 */
export async function verifyOrStartServerProcess({
  ext,
  wsService,
}: {
  ext: IDendronExtension;
  wsService: WorkspaceService;
}): Promise<number> {
  const context = ext.context;
  const start = process.hrtime();
  if (ext.port) {
    return ext.port;
  }

  const { port, subprocess } = await ExtensionUtils.startServerProcess({
    context,
    start,
    wsService,
    onExit: (type: SubProcessExitType) => {
      const txt = "Restart Dendron";
      vscode.window
        .showErrorMessage("Dendron engine encountered an error", txt)
        .then(async (resp) => {
          if (resp === txt) {
            AnalyticsUtils.track(VSCodeEvents.ServerCrashed, {
              code: type,
            });
            await ExtensionUtils.activate();
          }
        });
    },
  });
  ext.port = _.toInteger(port);
  ext.serverProcess =
    subprocess as any /* TODO: exactOptional + execa childprocess | undef interop on IDendronExtension.serverProcess (d.ts widened); Batch 5 debug launch sweep 2026-05-31 (per Strict-Fixer plan on _extension/activator/Partial opts + user mandate to 0 + full test + Clean Host smoke + merge); see 4-axis + prior M2 cast notes */;
  return ext.port;
}
