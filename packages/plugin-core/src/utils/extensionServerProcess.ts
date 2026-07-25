/**
 * Engine server process launch + lifecycle for the VS Code extension host.
 */
import { launchv2, ServerUtils } from "@dendronhq/api-server";
import { getStage } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import type { Subprocess } from "execa";
import path from "path";
import * as vscode from "vscode";
import { CONFIG } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET } from "../types/global";

export async function startServerProcess(): Promise<{
  port: number;
  subprocess?: Subprocess;
}> {
  const { nextServerUrl, nextStaticRoot, engineServerPort } =
    ExtensionProvider.getDWorkspace().config.dev || {};
  // const ctx = "startServer";
  const maybePort =
    ExtensionProvider.getExtension()
      .getWorkspaceConfig()
      .get<number | undefined>(CONFIG.SERVER_PORT!.key) || engineServerPort;
  const port = maybePort;
  if (port) {
    return { port };
  }

  // if in dev mode, simplify debugging without going multi process
  if (getStage() !== "prod") {
    const out = await launchv2({
      logPath: path.join(__dirname, "..", "..", "dendron.server.log"),
      googleOauthClientId: GOOGLE_OAUTH_ID,
      googleOauthClientSecret: GOOGLE_OAUTH_SECRET,
    });
    return { port: out.port };
  }

  // start server is separate process ^pyiildtq4tdx
  const logPath = ExtensionProvider.getDWorkspace().logUri.fsPath;
  try {
    const out = await ServerUtils.execServerNode({
      scriptPath: path.join(__dirname, "server.js"),
      logPath,
      nextServerUrl,
      nextStaticRoot,
      port,
      googleOauthClientId: GOOGLE_OAUTH_ID,
      googleOauthClientSecret: GOOGLE_OAUTH_SECRET,
    });
    return out;
  } catch (err) {
    // TODO: change to error, wait for https://github.com/dendronhq/dendron/issues/3227 to be resolved first
    Logger.info({ msg: "failed to spawn a subshell" });
    const out = await launchv2({
      logPath: path.join(__dirname, "..", "..", "dendron.server.log"),
      googleOauthClientId: GOOGLE_OAUTH_ID,
      googleOauthClientSecret: GOOGLE_OAUTH_SECRET,
    });
    return { port: out.port };
  }
}

export function handleServerProcess({
  subprocess,
  context,
  onExit,
}: {
  subprocess: Subprocess;
  context: vscode.ExtensionContext;
  onExit: Parameters<(typeof ServerUtils)["onProcessExit"]>[0]["cb"];
}) {
  const ctx = "handleServerProcess";
  Logger.info({ ctx, msg: "subprocess running", pid: subprocess.pid });
  // if extension closes, reap server process
  context.subscriptions.push(
    new vscode.Disposable(() => {
      Logger.info({ ctx, msg: "kill server start" });
      if (subprocess.pid) {
        process.kill(subprocess.pid);
      }
      Logger.info({ ctx, msg: "kill server end" });
    }),
  );
  // if server process has issues, prompt user to restart
  ServerUtils.onProcessExit({
    // 4-axis boundary cast (execa Subprocess interop vs @dendronhq/api-server ServerUtils.onProcessExit expected shape; cross-pkg typing + strict final wave). Burned @ts-ignore via explicit as any + dated TODO (ts-expect-error-burner final sweep 2026-06-01). See Suppression Registry in di/inject.ts. 0 bare.
    subprocess: subprocess as any,
    cb: onExit,
  });
}

export async function startServerProcessForWorkspace({
  context,
  start,
  wsService,
  onExit,
}: {
  context: vscode.ExtensionContext;
  wsService: WorkspaceService;
  start: [number, number];
  onExit: Parameters<(typeof ServerUtils)["onProcessExit"]>[0]["cb"];
}) {
  const ctx = "startServerProcess";
  const { port, subprocess } = await startServerProcess();
  if (subprocess) {
    handleServerProcess({
      subprocess,
      context,
      onExit,
    });
  }
  const durationStartServer = getDurationMilliseconds(start);
  Logger.info({ ctx, msg: "post-start-server", port, durationStartServer });
  wsService.writePort(port);
  return { port, subprocess };
}
