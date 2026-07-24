import {
  ErrorUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { DConfig, file2Note } from "@dendronhq/common-server";
import { EngineUtils } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";

export type SmartReloadResult = {
  scanned: number;
  updated: number;
  created: number;
  deleted: number;
  durationMs: number;
};

/**
 * Incremental index reconcile (prefer over full `engine.init()`).
 *
 * Walks vault `*.md` files (top-level vault dirs), re-parses notes whose disk
 * mtime is newer than engine `note.updated`, metaOnly-writes them, deletes
 * engine metas whose files vanished, then optionally rebuilds Fuse via
 * `updateIndex("note")`.
 *
 * Used by ReloadIndex when the engine already has notes loaded. Cold start
 * still uses full init. Complements FileWatcher create/change/delete paths.
 */
export class SmartReloadService {
  static async reconcile(): Promise<SmartReloadResult> {
    const start = Date.now();
    const ctx = "SmartReloadService.reconcile";
    const { engine, vaults, wsRoot } = ExtensionProvider.getDWorkspace();
    const config = DConfig.readConfigSync(wsRoot);
    let scanned = 0;
    let updated = 0;
    let created = 0;
    let deleted = 0;

    const onDiskKeys = new Set<string>();

    for (const vault of vaults) {
      const vpath = path.join(
        wsRoot,
        VaultUtils.normVaultPath({ vault, wsRoot })
      );
      if (!(await fs.pathExists(vpath))) continue;

      const files = (await fs.readdir(vpath)).filter((f) => f.endsWith(".md"));
      for (const file of files) {
        scanned += 1;
        const fsPath = path.join(vpath, file);
        const fname = path.basename(file, ".md");
        onDiskKeys.add(`${vault.fsPath}::${fname}`);

        let stat: fs.Stats;
        try {
          stat = await fs.stat(fsPath);
        } catch {
          continue;
        }
        const mtimeSec = Math.floor(stat.mtimeMs / 1000);
        const existing = (await engine.findNotesMeta({ fname, vault }))[0];

        if (existing && existing.updated >= mtimeSec) {
          continue; // engine is current or newer
        }

        const resp = file2Note(fsPath, vault);
        if (ErrorUtils.isErrorResp(resp)) {
          Logger.info({ ctx, fsPath, msg: "skip unreadable note" });
          continue;
        }
        let note: NoteProps = resp.data;
        if (existing) {
          note = NoteUtils.hydrate({
            noteRaw: note,
            noteHydrated: existing,
          });
          delete (note as any).stub;
          delete (note as any).schemaStub;
          updated += 1;
        } else {
          created += 1;
        }

        try {
          await EngineUtils.refreshNoteLinksAndAnchors({
            note,
            fmChangeOnly: false,
            engine: engine as any,
            config,
          });
          await engine.writeNote(note, { metaOnly: true });
        } catch (err) {
          Logger.error({
            ctx,
            msg: `smart reload write failed: ${fsPath}`,
            error: err as any,
          });
        }
      }
    }

    // Delete engine notes that no longer exist on disk (non-stub)
    const allMeta = await engine.findNotesMeta({ excludeStub: true });
    for (const meta of allMeta) {
      if (meta.fname === "root") continue;
      const key = `${meta.vault.fsPath}::${meta.fname}`;
      if (!onDiskKeys.has(key)) {
        // confirm file missing
        const full = NoteUtils.getFullPath({ note: meta, wsRoot });
        if (!(await fs.pathExists(full))) {
          try {
            await engine.deleteNote(meta.id, { metaOnly: true });
            deleted += 1;
          } catch (err) {
            Logger.info({ ctx, fname: meta.fname, msg: "delete skip", err });
          }
        }
      }
    }

    // Rebuild note index (fuse) if available
    try {
      if (typeof (engine as any).updateIndex === "function") {
        await (engine as any).updateIndex("note");
      }
    } catch (err) {
      Logger.info({ ctx, msg: "updateIndex optional failed", err });
    }

    return {
      scanned,
      updated,
      created,
      deleted,
      durationMs: Date.now() - start,
    };
  }
}
