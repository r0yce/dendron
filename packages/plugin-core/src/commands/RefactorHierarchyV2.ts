import {
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DVault,
  extractNoteChangeEntryCounts,
  RefactoringCommandUsedPayload,
  StatisticsUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import _md from "markdown-it";
import { ProgressLocation, Uri, ViewColumn, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { RenameNoteOutputV2a, RenameNoteV2aCommand } from "./RenameNoteV2a";
import { ExtensionProvider } from "../ExtensionProvider";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";
import {
  buildRefactorOverwriteErrorMarkdown,
  filterCapturedNotesForRefactor,
  findExistingRefactorTargets,
  getRefactorRenamePathOps,
} from "./refactorHierarchyOps";
import {
  announceRefactorScope,
  buildRefactorSuccessPreviewMarkdown,
  promptRefactorConfirmation,
  promptRefactorMatchText,
  promptRefactorReplaceText,
  showRefactorPreviewPanel,
} from "./refactorHierarchyPrompts";
import { promptRefactorScope } from "./refactorHierarchyScope";

const md = _md();

type CommandOpts = {
  scope?: NoteLookupProviderSuccessResp;
  match: string;
  replace: string;
  noConfirm?: boolean;
};

export type CommandOutput = RenameNoteOutputV2a & {
  operations: RenameOperation[];
};

type RenameOperation = {
  vault: DVault;
  oldUri: Uri;
  newUri: Uri;
};

export class RefactorHierarchyCommandV2 extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.REFACTOR_HIERARCHY.key;
  _proxyMetricPayload:
    | (RefactoringCommandUsedPayload & {
        extra: {
          [key: string]: any;
        };
      })
    | undefined;

  entireWorkspaceQuickPickItem = {
    label: "Entire Workspace",
    detail: "Scope refactor to entire workspace",
    alwaysShow: true,
  } as DNodePropsQuickInputV2;

  async promptScope(): Promise<NoteLookupProviderSuccessResp | undefined> {
    return promptRefactorScope({
      commandKey: this.key,
      entireWorkspaceItem: this.entireWorkspaceQuickPickItem,
      logger: this.L,
    });
  }

  async promptMatchText() {
    return promptRefactorMatchText();
  }

  async promptReplaceText() {
    return promptRefactorReplaceText();
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const scope = await this.promptScope();
    if (_.isUndefined(scope)) {
      window.showInformationMessage("No scope provided.");
      return;
    }
    announceRefactorScope({
      entireWorkspaceItem: this.entireWorkspaceQuickPickItem,
      selectedItems: scope.selectedItems,
    });

    const match = await this.promptMatchText();
    if (_.isUndefined(match)) {
      window.showErrorMessage("No match text provided.");
      return;
    }
    window.showInformationMessage(`Matching: ${match}`);

    const replace = await this.promptReplaceText();
    if (_.isUndefined(replace) || replace.trim() === "") {
      window.showErrorMessage("No replace text provided.");
      return;
    }
    window.showInformationMessage(`Replacing with: ${replace}`);

    return {
      scope,
      match,
      replace,
    };
  }

  showPreview(operations: RenameOperation[]) {
    const content = buildRefactorSuccessPreviewMarkdown(operations);
    showRefactorPreviewPanel({
      viewType: "refactorPreview",
      title: "Refactor Preview",
      markdown: md.render(content),
      preserveFocus: true,
    });
  }

  async showError(operations: RenameOperation[]) {
    const content = buildRefactorOverwriteErrorMarkdown(operations);
    const panel = window.createWebviewPanel(
      "refactorPreview",
      "Refactor Preview",
      ViewColumn.One,
      {},
    );
    panel.webview.html = md.render(content);
  }

  async getCapturedNotes(opts: {
    scope: NoteLookupProviderSuccessResp | undefined;
    matchRE: RegExp;
    engine: DEngineClient;
  }) {
    const { scope, matchRE, engine } = opts;

    const scopedItems =
      _.isUndefined(scope) ||
      scope.selectedItems[0] === this.entireWorkspaceQuickPickItem
        ? await engine.findNotes({ excludeStub: false })
        : scope.selectedItems.map(
            (item) =>
              _.omit(item, ["label", "detail", "alwaysShow"]) as DNodeProps,
          );

    return filterCapturedNotesForRefactor({
      scopedItems,
      matchRE,
      wsRoot: engine.wsRoot,
    });
  }

  getRenameOperations(opts: {
    capturedNotes: DNodeProps[];
    matchRE: RegExp;
    replace: string;
    wsRoot: string;
  }) {
    return getRefactorRenamePathOps(opts).map((op) => ({
      oldUri: Uri.file(op.oldPath),
      newUri: Uri.file(op.newPath),
      vault: op.vault,
    }));
  }

  async hasExistingFiles(opts: { operations: RenameOperation[] }) {
    const filesThatExist = findExistingRefactorTargets(opts.operations);
    if (!_.isEmpty(filesThatExist)) {
      await this.showError(filesThatExist);
      window.showErrorMessage(
        "refactored files would overwrite existing files",
      );
      return true;
    }
    return false;
  }

  async runOperations(opts: {
    operations: RenameOperation[];
    renameCmd: RenameNoteV2aCommand;
  }) {
    const { operations, renameCmd } = opts;
    const ctx = "RefactorHierarchy:runOperations";
    const out = await _.reduce<
      (typeof operations)[0],
      Promise<RenameNoteOutputV2a>
    >(
      operations,
      async (resp, op) => {
        const acc = await resp;
        this.L.info({
          ctx,
          orig: op.oldUri.fsPath,
          replace: op.newUri.fsPath,
        });
        const resp2 = await renameCmd.execute({
          files: [op],
          silent: true,
          closeCurrentFile: false,
          openNewFile: false,
          noModifyWatcher: true,
        });
        acc.changed = resp2.changed.concat(acc.changed);
        return acc;
      },
      Promise.resolve({
        changed: [],
      }),
    );
    return out;
  }

  async promptConfirmation(noConfirm?: boolean) {
    return promptRefactorConfirmation(noConfirm);
  }

  prepareProxyMetricPayload(capturedNotes: DNodeProps[]) {
    const ctx = `${this.key}:prepareProxyMetricPayload`;
    const engine = ExtensionProvider.getEngine();

    const basicStats = StatisticsUtils.getBasicStatsFromNotes(capturedNotes);
    if (basicStats === undefined) {
      this.L.error({ ctx, message: "failed to get basic stats from notes." });
      return;
    }

    const { numChildren, numLinks, numChars, noteDepth, ...rest } = basicStats;

    const traitsAcc = capturedNotes.flatMap((note) =>
      note.traits && note.traits.length > 0 ? note.traits : [],
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
        numProcessed: capturedNotes.length,
        ...rest,
      },
    };
  }

  async execute(opts: CommandOpts): Promise<any> {
    const ctx = "RefactorHierarchy:execute";
    const { scope, match, replace, noConfirm } = opts;
    this.L.info({ ctx, opts, msg: "enter" });
    const ext = ExtensionProvider.getExtension();
    const { engine } = ExtensionProvider.getDWorkspace();
    const matchRE = new RegExp(match);
    const capturedNotes = await this.getCapturedNotes({
      scope,
      matchRE,
      engine,
    });

    this.prepareProxyMetricPayload(capturedNotes);

    const operations = this.getRenameOperations({
      capturedNotes,
      matchRE,
      replace,
      wsRoot: engine.wsRoot,
    });

    if (await this.hasExistingFiles({ operations })) {
      return;
    }

    this.showPreview(operations);

    const shouldProceed = await this.promptConfirmation(noConfirm);
    if (!shouldProceed) {
      window.showInformationMessage("Cancelled");
      return;
    }

    if (ext.fileWatcher) {
      ext.fileWatcher.pause = true;
    }
    const renameCmd = new RenameNoteV2aCommand();
    const out = await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Refactoring...",
        cancellable: false,
      },
      async () => {
        const out = await this.runOperations({ operations, renameCmd });
        return out;
      },
    );
    return { ...out, operations };
  }

  async showResponse(res: CommandOutput) {
    if (_.isUndefined(res)) {
      window.showInformationMessage("No note refactored.");
      return;
    }
    window.showInformationMessage("Done refactoring.");
    const { changed } = res;
    if (changed.length > 0) {
      window.showInformationMessage(
        `Dendron updated ${
          _.uniqBy(changed, (ent) => ent.note.fname).length
        } files`,
      );
    }
  }

  trackProxyMetrics({
    noteChangeEntryCounts,
  }: {
    noteChangeEntryCounts: {
      createdCount: number;
      deletedCount: number;
      updatedCount: number;
    };
  }) {
    if (this._proxyMetricPayload === undefined) {
      return;
    }

    const { extra, ...props } = this._proxyMetricPayload;

    ProxyMetricUtils.trackRefactoringProxyMetric({
      props,
      extra: {
        ...extra,
        ...noteChangeEntryCounts,
      },
    });
  }

  addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined
        ? { ...extractNoteChangeEntryCounts(out.changed) }
        : {
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
          };
    try {
      this.trackProxyMetrics({ noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }
    return noteChangeEntryCounts;
  }
}
