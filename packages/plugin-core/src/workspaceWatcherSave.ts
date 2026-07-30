/**
 * Note save handlers for WorkspaceWatcher (will/did save).
 */
import {
  ConfigUtils,
  NoteUtils,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import * as Sentry from "@sentry/node";
import fs from "fs";
import path from "path";
import {
  Range,
  TextDocument,
  TextDocumentSaveReason,
  TextDocumentWillSaveEvent,
  TextEdit,
} from "vscode";
import { DoctorUtils } from "./components/doctor/utils";
import { IDendronExtension } from "./dendronExtensionInterface";
import { Logger } from "./logger";
import { TextDocumentService } from "./services/node/TextDocumentService";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import {
  buildPersistentHistoryFname,
  buildPersistentHistoryLine,
  planFrontmatterUpdatedReplace,
  shouldWritePersistentHistory,
} from "./workspaceWatcherSaveHelpers";

/**
 * If note is in workspace markdown, update frontmatter `updated` timestamp.
 */
export function onWillSaveTextDocumentForWorkspace(
  event: TextDocumentWillSaveEvent,
  extension: IDendronExtension
): { changes: TextEdit[] } {
  try {
    const ctx = "WorkspaceWatcher:onWillSaveTextDocument";
    const uri = event.document.uri;
    Logger.info({
      ctx,
      url: uri.fsPath,
      reason: TextDocumentSaveReason[event.reason],
      msg: "enter",
    });
    const { wsRoot, vaults } = extension.getDWorkspace();
    if (
      !WorkspaceUtils.isPathInWorkspace({ fpath: uri.fsPath, wsRoot, vaults })
    ) {
      Logger.debug({
        ctx,
        uri: uri.fsPath,
        msg: "not in workspace, ignoring.",
      });
      return { changes: [] };
    }

    if (uri.fsPath.endsWith(".md")) {
      return onWillSaveNote(event, extension);
    }
    Logger.debug({
      ctx,
      uri: uri.fsPath,
      msg: "File type is not registered for updates. ignoring.",
    });
    return { changes: [] };
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

function onWillSaveNote(
  event: TextDocumentWillSaveEvent,
  extension: IDendronExtension
): { changes: TextEdit[] } {
  const ctx = "WorkspaceWatcher:onWillSaveNote";
  const uri = event.document.uri;
  const engine = extension.getEngine();
  const fname = path.basename(uri.fsPath, ".md");
  const now = Time.now().toMillis();
  let changes: TextEdit[] = [];
  // eslint-disable-next-line  no-async-promise-executor
  const promise = new Promise(async (resolve) => {
    const note = (
      await engine.findNotes({
        fname,
        vault: extension.wsUtils.getVaultFromUri(uri),
      })
    )[0];
    // If we can't find the note, don't do anything
    if (!note) {
      // Log at info level and not error level for now to reduce Sentry noise
      Logger.info({
        ctx,
        msg: `Note with fname ${fname} not found in engine! Skipping updated field FM modification.`,
      });
      return;
    }

    // Return undefined if document is missing frontmatter
    if (!TextDocumentService.containsFrontmatter(event.document)) {
      return;
    }
    const content = event.document.getText();
    const plan = planFrontmatterUpdatedReplace({
      content,
      nowMillis: now,
      contentChanged: WorkspaceUtils.noteContentChanged({ content, note }),
    });
    if (plan) {
      Logger.info({ ctx, msg: "update activeText editor" });
      const startPos = event.document.positionAt(plan.matchIndex);
      const endPos = event.document.positionAt(
        plan.matchIndex + plan.matchLength
      );
      changes = [
        TextEdit.replace(new Range(startPos, endPos), plan.replaceText),
      ];
    }
    return resolve(changes);
  });
  event.waitUntil(promise);

  return { changes };
}

export async function onDidSaveNoteForWorkspace(
  document: TextDocument,
  extension: IDendronExtension
): Promise<void> {
  // check and prompt duplicate warning.
  await DoctorUtils.findDuplicateNoteAndPromptIfNecessary(
    document,
    "onDidSaveNote"
  );

  const fname = path.basename(document.uri.fsPath, ".md");
  const engine = extension.getEngine();
  const config = extension.getDWorkspace().config;
  const { enablePersistentHistory, mainVault } = ConfigUtils.getProp(
    config,
    "workspace"
  );

  if (
    !shouldWritePersistentHistory({
      enablePersistentHistory,
      mainVault,
      fname,
    })
  ) {
    return;
  }

  const date = Time.now().toFormat("y.MM.dd");
  const historyFile = buildPersistentHistoryFname(date);
  const minuteAndSecond = Time.now().toFormat("MM-dd-y HH:mm");
  const maybeVault = engine.vaults.find(
    (vault) => VaultUtils.getName(vault) === mainVault
  );
  if (!maybeVault) {
    Logger.error({
      ctx: "onWillSaveNote",
      msg: `could not find vault for history file. vault: ${mainVault}`,
    });
    return;
  }
  const line = buildPersistentHistoryLine({ minuteAndSecond, fname });
  const base = maybeVault.fsPath;
  const fpath = path.join(engine.wsRoot, base, historyFile);
  Logger.info({
    ctx: "onDidSaveNote",
    fpath,
    line,
    msg: "writing to history file",
  });
  if (!fs.existsSync(fpath)) {
    const note = NoteUtils.create({
      fname: historyFile,
      vault: maybeVault,
    });
    await engine.writeNote(note, { runHooks: false });
  }
  fs.appendFileSync(fpath + ".md", "\n" + line);
}
