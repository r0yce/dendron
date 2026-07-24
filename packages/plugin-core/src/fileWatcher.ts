import {
  ContextualUIEvents,
  DVault,
  ErrorUtils,
  NoteProps,
  NoteUtils,
  VaultUtils,
  WorkspaceOpts,
  WorkspaceType,
} from "@dendronhq/common-all";
import { DConfig, file2Note } from "@dendronhq/common-server";
import {
  EngineFileWatcher,
  EngineUtils,
  FileWatcherAdapter,
  HistoryService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { ExtensionProvider } from "./ExtensionProvider";
import { Logger } from "./logger";
import { AnalyticsUtils, sentryReportingCallback } from "./utils/analytics";

export class FileWatcher {
  public watchers: { vault: DVault; watcher: FileWatcherAdapter }[];
  /**
   * Should watching be paused
   */
  public pause: boolean;
  public L = Logger;
  /** Debounced reindex of external file changes (git, other editors). */
  private _pendingChanges = new Set<string>();
  private _flushChanges: (() => void) | undefined;

  constructor(opts: { workspaceOpts: WorkspaceOpts }) {
    const { workspaceOpts } = opts;

    const { vaults, wsRoot } = workspaceOpts;
    this.watchers = vaults.map((vault) => {
      const vpath = path.join(
        wsRoot,
        VaultUtils.normVaultPath({ vault, wsRoot })
      );
      const rootFolder = vpath;
      const pattern = new vscode.RelativePattern(rootFolder, "*.md");

      let watcher: FileWatcherAdapter;
      // For VSCode workspaces, or if forced in the config, use the VSCode watcher
      if (FileWatcher.watcherType(workspaceOpts) === "plugin") {
        watcher = new PluginFileWatcher(pattern);
      } else {
        watcher = new EngineFileWatcher(pattern.base, pattern.pattern);
      }

      return { vault, watcher };
    });
    this.pause = false;
    // Coalesce rapid multi-file changes (e.g. git checkout) into one flush.
    this._flushChanges = _.debounce(() => {
      void this.flushPendingChanges();
    }, 300);
  }

  static watcherType(opts: WorkspaceOpts): "plugin" | "engine" {
    const forceWatcherType = opts.dendronConfig?.dev?.forceWatcherType;
    // If a certain type of watcher has been forced, try to use that
    if (forceWatcherType !== undefined) return forceWatcherType;

    const wsType = ExtensionProvider.getDWorkspace().type;
    // For VSCode workspaces, use the built-in VSCode watcher
    if (wsType === WorkspaceType.CODE) return "plugin";
    // Otherwise, use the engine watcher that works without VSCode
    return "engine";
  }

  activate(context: vscode.ExtensionContext) {
    this.watchers.forEach(({ watcher }) => {
      context.subscriptions.push(
        watcher.onDidCreate(
          sentryReportingCallback(this.onDidCreate.bind(this))
        )
      );
      context.subscriptions.push(
        watcher.onDidDelete(
          sentryReportingCallback(this.onDidDelete.bind(this))
        )
      );
      // External edits (git pull, other tools) only fire change — was never wired.
      context.subscriptions.push(
        watcher.onDidChange(
          sentryReportingCallback(this.onDidChange.bind(this))
        )
      );
    });
  }

  /**
   * Queue a changed note for incremental meta reindex (debounced).
   */
  onDidChange(fsPath: string): void {
    const ctx = "FileWatcher:onDidChange";
    if (this.pause) {
      this.L.info({ ctx, fsPath, msg: "paused" });
      return;
    }
    if (!fsPath.endsWith(".md")) {
      return;
    }
    // Ignore engine-driven writes that already updated the index
    const recentEvents = HistoryService.instance().lookBack();
    if (
      _.find(recentEvents, (event) => {
        return _.every([
          event?.uri?.fsPath === fsPath,
          event.source === "engine",
          _.includes(["create", "delete", "rename", "update"], event.action),
        ]);
      })
    ) {
      this.L.debug({ ctx, fsPath, msg: "engine event, ignoring" });
      return;
    }
    this._pendingChanges.add(fsPath);
    this._flushChanges?.();
  }

  private async flushPendingChanges(): Promise<void> {
    const ctx = "FileWatcher:flushPendingChanges";
    if (this.pause || this._pendingChanges.size === 0) {
      return;
    }
    const paths = Array.from(this._pendingChanges);
    this._pendingChanges.clear();
    this.L.info({ ctx, count: paths.length, msg: "reindex changed notes" });
    for (const fsPath of paths) {
      try {
        await this.reindexNoteFromDisk(fsPath);
      } catch (err: any) {
        this.L.info({ ctx, fsPath, msg: "reindex skip", err });
      }
    }
  }

  /** Same path as create: file2Note → links → writeNote metaOnly. */
  private async reindexNoteFromDisk(fsPath: string): Promise<void> {
    const ctx = "FileWatcher:reindexNoteFromDisk";
    const fname = path.basename(fsPath, ".md");
    const { vaults, engine, wsRoot } = ExtensionProvider.getDWorkspace();
    const vault = VaultUtils.getVaultByFilePath({
      vaults,
      fsPath,
      wsRoot,
    });
    const resp = file2Note(fsPath, vault);
    if (ErrorUtils.isErrorResp(resp)) {
      this.L.info({ ctx, fsPath, msg: "unreadable, skip" });
      return;
    }
    let note: NoteProps = resp.data;
    const maybeNote = (await engine.findNotesMeta({ fname, vault }))[0];
    if (maybeNote) {
      note = NoteUtils.hydrate({ noteRaw: note, noteHydrated: maybeNote });
      delete note["stub"];
      delete note["schemaStub"];
    }
    await EngineUtils.refreshNoteLinksAndAnchors({
      note,
      fmChangeOnly: false,
      engine,
      config: DConfig.readConfigSync(engine.wsRoot),
    });
    await engine.writeNote(note, { metaOnly: true });
    this.L.debug({ ctx, fsPath, msg: "reindexed" });
  }

  async onDidCreate(fsPath: string): Promise<void> {
    const ctx = "FileWatcher:onDidCreate";
    if (this.pause) {
      this.L.info({ ctx, fsPath, msg: "paused" });
      return;
    }
    this.L.info({ ctx, fsPath });
    const fname = path.basename(fsPath, ".md");

    // check if ignore
    const recentEvents = HistoryService.instance().lookBack();
    this.L.debug({ ctx, recentEvents, fname });
    let note: NoteProps;
    if (
      _.find(recentEvents, (event) => {
        return _.every([
          event?.uri?.fsPath === fsPath,
          event.source === "engine",
          event.action === "create",
        ]);
      })
    ) {
      this.L.debug({ ctx, fsPath, msg: "create by engine, ignoring" });
      return;
    }

    try {
      this.L.debug({ ctx, fsPath, msg: "pre-add-to-engine" });
      const { vaults, engine, wsRoot } = ExtensionProvider.getDWorkspace();
      const vault = VaultUtils.getVaultByFilePath({
        vaults,
        fsPath,
        wsRoot,
      });
      const resp = file2Note(fsPath, vault);
      if (ErrorUtils.isErrorResp(resp)) {
        throw resp.error;
      }
      note = resp.data;

      // check if note exist as
      const maybeNote = (await engine.findNotesMeta({ fname, vault }))[0];
      if (maybeNote) {
        note = NoteUtils.hydrate({ noteRaw: note, noteHydrated: maybeNote });
        delete note["stub"];
        delete note["schemaStub"];
        //TODO recognise vscode's create new file menu option to create a note.
      }

      await EngineUtils.refreshNoteLinksAndAnchors({
        note,
        fmChangeOnly: false,
        engine,
        config: DConfig.readConfigSync(engine.wsRoot),
      });
      await engine.writeNote(note, { metaOnly: true });
    } catch (err: any) {
      this.L.error({ ctx, error: err });
      throw err;
    }
  }

  async onDidDelete(fsPath: string) {
    const ctx = "FileWatcher:onDidDelete";
    if (this.pause) {
      return;
    }
    this.L.info({ ctx, fsPath });
    const fname = path.basename(fsPath, ".md");

    // check if we should ignore
    const recentEvents = HistoryService.instance().lookBack(5);
    this.L.debug({ ctx, recentEvents, fname });
    if (
      _.find(recentEvents, (event) => {
        return _.every([
          event?.uri?.fsPath === fsPath,
          event.source === "engine",
          _.includes(["delete", "rename"], event.action),
        ]);
      })
    ) {
      this.L.debug({
        ctx,
        fsPath,
        msg: "recent action by engine, ignoring",
      });
      return;
    }
    try {
      const { vaults, engine, wsRoot } = ExtensionProvider.getDWorkspace();
      const vault = VaultUtils.getVaultByFilePath({
        vaults,
        fsPath,
        wsRoot,
      });
      this.L.debug({ ctx, fsPath, msg: "preparing to delete" });
      const nodeToDelete = (await engine.findNotesMeta({ fname, vault }))[0];
      if (_.isUndefined(nodeToDelete)) {
        throw new Error(`${fname} not found`);
      }
      await engine.deleteNote(nodeToDelete.id, { metaOnly: true });
      HistoryService.instance().add({
        action: "delete",
        source: "watcher",
        uri: vscode.Uri.parse(fsPath),
      });
      AnalyticsUtils.track(ContextualUIEvents.ContextualUIDelete);
    } catch (err) {
      this.L.info({ ctx, fsPath, err });
      // NOTE: ignore, many legitimate reasons why this might happen
      // this.L.error({ ctx, err: JSON.stringify(err) });
    }
  }
}

export class PluginFileWatcher implements FileWatcherAdapter {
  private watcher: vscode.FileSystemWatcher;
  constructor(pattern: vscode.GlobPattern) {
    this.watcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      false,
      false,
      false
    );
  }

  onDidCreate(callback: (filePath: string) => void) {
    return this.watcher.onDidCreate((uri) => callback(uri.fsPath));
  }

  onDidDelete(callback: (filePath: string) => void) {
    return this.watcher.onDidDelete((uri) => callback(uri.fsPath));
  }

  onDidChange(callback: (filePath: string) => void) {
    return this.watcher.onDidChange((uri) => callback(uri.fsPath));
  }
}
