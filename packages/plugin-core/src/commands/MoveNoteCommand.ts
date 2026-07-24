import {
  DendronError,
  DEngineClient,
  extractNoteChangeEntryCounts,
  NoteChangeEntry,
  NoteProps,
  RefactoringCommandUsedPayload,
  RenameNoteOpts,
  StatisticsUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryEvent } from "@dendronhq/engine-server";
import _ from "lodash";
import _md from "markdown-it";
import path from "path";
import { Disposable, ProgressLocation, Uri, ViewColumn, window } from "vscode";
import { MultiSelectBtn } from "../components/lookup/buttons";
import { LookupControllerV3CreateOpts } from "../components/lookup/LookupControllerV3Interface";
import {
  OldNewLocation,
  ProviderAcceptHooks,
} from "../components/lookup/utils";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { FileItem } from "../external/fileutils/FileItem";
import { VSCodeUtils } from "../vsCodeUtils";
import { ProceedCancel, QuickPickUtil } from "../utils/quickPick";
import { BasicCommand } from "./base";
import { ExtensionProvider } from "../ExtensionProvider";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";
import { IDendronExtension } from "../dendronExtensionInterface";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { AutoCompleter } from "../utils/autoCompleter";
import {
  buildMultiMovePreviewMarkdown,
  getDesiredMoves as getDesiredMovesHelper,
  isMultiMove,
  moveNotesSequential,
} from "./moveNoteOps";

type CommandInput = any;

const md = _md();

export type CommandOpts = {
  moves: RenameNoteOpts[];
  /**
   * Show notification message
   */
  silent?: boolean;
  /**
   * Close and open current file
   */
  closeAndOpenFile?: boolean;
  /**
   * Pause all watchers
   */
  noPauseWatcher?: boolean;
  nonInteractive?: boolean;
  initialValue?: string;
  vaultName?: string;
  /**
   * If set to true, don't allow toggling vaults
   * Used in RenameNoteCommand
   */
  useSameVault?: boolean;
  /** Defaults to true. */
  allowMultiselect?: boolean;
  /** set a custom title for the quick input. Used for rename note */
  title?: string;
};

export type CommandOutput = {
  changed: NoteChangeEntry[];
};

export class MoveNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.MOVE_NOTE.key;
  private extension: IDendronExtension;
  _proxyMetricPayload:
    | (RefactoringCommandUsedPayload & {
        extra: {
          [key: string]: any;
        };
      })
    | undefined;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandInput | undefined> {
    const extension = ExtensionProvider.getExtension();
    const engine = extension.getEngine();
    const vault = opts?.vaultName
      ? VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname: opts.vaultName,
        })
      : undefined;

    const lookupCreateOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: opts?.useSameVault,
      // If vault selection is enabled we alwaysPrompt selection mode,
      // hence disable toggling.
      vaultSelectCanToggle: false,
      // allow users to select multiple notes to move
      extraButtons: [MultiSelectBtn.create({ pressed: false })],
    };
    if (vault) {
      lookupCreateOpts.buttons = [];
    }
    const lc = extension.lookupControllerFactory.create(lookupCreateOpts);

    const provider = extension.noteLookupProviderFactory.create("move", {
      allowNewNote: true,
      forceAsIsPickerValueUsage: true,
    });
    provider.registerOnAcceptHook(ProviderAcceptHooks.oldNewLocationHook);
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md",
    );

    return new Promise((resolve) => {
      let disposable: Disposable;

      NoteLookupProviderUtils.subscribe({
        id: "move",
        controller: lc,
        logger: this.L,
        onDone: async (event: HistoryEvent) => {
          const data =
            event.data as NoteLookupProviderSuccessResp<OldNewLocation>;
          if (data.cancel) {
            resolve(undefined);
            return;
          }
          await this.prepareProxyMetricPayload(data);
          const opts: CommandOpts = {
            moves: this.getDesiredMoves(data),
          };
          resolve(opts);

          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
        onError: (event: HistoryEvent) => {
          const error = event.data.error as DendronError;
          window.showErrorMessage(error.message);
          resolve(undefined);
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      lc.show({
        title: opts?.title || "Move note",
        placeholder: "foo",
        provider,
        initialValue: opts?.initialValue || initialValue,
        nonInteractive: opts?.nonInteractive,
      });

      VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

      disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
        if (lc.quickPick) {
          lc.quickPick.value = AutoCompleter.getAutoCompletedValue(
            lc.quickPick,
          );

          lc.provider.onUpdatePickerItems({
            picker: lc.quickPick,
          });
        }
      });
    });
  }

  private async prepareProxyMetricPayload(
    data: NoteLookupProviderSuccessResp<OldNewLocation>,
  ) {
    const ctx = `${this.key}:prepareProxyMetricPayload`;
    const engine = ExtensionProvider.getEngine();
    let items: NoteProps[];
    if (data.selectedItems.length === 1) {
      // single move. find note from resp
      const hookResp = data.onAcceptHookResp[0];
      if (!hookResp) {
        items = [];
      } else {
        const { oldLoc } = hookResp;
        const { fname, vaultName: vname } = oldLoc;
        if (fname !== undefined && vname !== undefined) {
          const vault = VaultUtils.getVaultByName({
            vaults: engine.vaults,
            vname,
          });
          const note = (await engine.findNotes({ fname, vault }))[0]!;
          items = [note];
        } else {
          items = [];
        }
      }
    } else {
      const notes = data.selectedItems.map(
        (item): NoteProps => _.omit(item, ["label", "detail", "alwaysShow"]),
      );
      items = notes;
    }

    const basicStats = StatisticsUtils.getBasicStatsFromNotes(items);
    if (basicStats === undefined) {
      this.L.error({ ctx, message: "failed to get basic stats from notes." });
      return;
    }

    const { numChildren, numLinks, numChars, noteDepth, ...rest } = basicStats;

    const traitsAcc = items.flatMap((item) =>
      item.traits && item.traits.length > 0 ? item.traits : [],
    );
    const traitsSet = new Set(traitsAcc);

    this._proxyMetricPayload = {
      command: this.key,
      numVaults: engine.vaults.length,
      traits: [...traitsSet],
      numChildren,
      numLinks,
      numChars,
      noteDepth,
      extra: {
        numProcessed: items.length,
        ...rest,
      },
    };
  }

  private getDesiredMoves(
    data: NoteLookupProviderSuccessResp<OldNewLocation>,
  ): RenameNoteOpts[] {
    return getDesiredMovesHelper(data);
  }

  async execute(opts: CommandOpts): Promise<{ changed: NoteChangeEntry[] }> {
    const ctx = "MoveNoteCommand:execute";

    opts = _.defaults(opts, {
      closeAndOpenFile: true,
      allowMultiselect: true,
    });

    const { engine, wsRoot } = this.extension.getDWorkspace();

    if (this.extension.fileWatcher && !opts.noPauseWatcher) {
      this.extension.fileWatcher.pause = true;
    }
    try {
      this.L.info({ ctx, opts });

      if (isMultiMove(opts.moves)) {
        await this.showMultiMovePreview(opts.moves);
        const result = await QuickPickUtil.showProceedCancel();

        if (result !== ProceedCancel.PROCEED) {
          window.showInformationMessage("cancelled");
          return { changed: [] };
        }
      }

      const changed = await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "Refactoring...",
          cancellable: false,
        },
        async () => {
          const allChanges = await this.moveNotes(engine, opts.moves);
          return allChanges;
        },
      );

      if (opts.closeAndOpenFile) {
        // During bulk move we will only open a single file that was moved to avoid
        // cluttering user tabs with all moved files.
        const firstMove = opts.moves[0];
        if (firstMove) {
          await closeCurrentFileOpenMovedFile(engine, firstMove, wsRoot);
        }
      }
      return { changed };
    } finally {
      if (this.extension.fileWatcher && !opts.noPauseWatcher) {
        setTimeout(() => {
          if (this.extension.fileWatcher) {
            this.extension.fileWatcher.pause = false;
          }
          this.L.info({ ctx, msg: "exit" });
        }, 3000);
      }
    }
  }

  /** Performs the actual move of the notes. */
  private async moveNotes(
    engine: DEngineClient,
    moves: RenameNoteOpts[],
  ): Promise<NoteChangeEntry[]> {
    return moveNotesSequential(engine, moves);
  }

  private async showMultiMovePreview(moves: RenameNoteOpts[]) {
    const panel = window.createWebviewPanel(
      "noteMovePreview",
      "Move Notes Preview",
      ViewColumn.One,
      {},
    );
    panel.webview.html = md.render(buildMultiMovePreviewMarkdown(moves));
  }

  trackProxyMetrics({
    opts,
    noteChangeEntryCounts,
  }: {
    opts: CommandOpts;
    noteChangeEntryCounts: {
      createdCount: number;
      deletedCount: number;
      updatedCount: number;
    };
  }) {
    if (this._proxyMetricPayload === undefined) {
      // something went wrong during prep. don't track.
      return;
    }
    const { extra, ...props } = this._proxyMetricPayload;

    ProxyMetricUtils.trackRefactoringProxyMetric({
      props,
      extra: {
        ...extra,
        ...noteChangeEntryCounts,
        isMultiMove: isMultiMove(opts.moves),
      },
    });
  }

  addAnalyticsPayload(opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined
        ? { ...extractNoteChangeEntryCounts(out.changed) }
        : {
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
          };
    try {
      this.trackProxyMetrics({ opts, noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }

    return noteChangeEntryCounts;
  }
}

async function closeCurrentFileOpenMovedFile(
  engine: DEngineClient,
  moveOpts: RenameNoteOpts,
  wsRoot: string,
) {
  const vault = VaultUtils.getVaultByName({
    vaults: engine.vaults,
    vname: moveOpts.newLoc.vaultName!,
  })!;

  const vpath = vault2Path({ wsRoot, vault });
  const newUri = Uri.file(path.join(vpath, moveOpts.newLoc.fname + ".md"));
  await VSCodeUtils.closeCurrentFileEditor();
  await VSCodeUtils.openFileInEditor(new FileItem(newUri));
}
