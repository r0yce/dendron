import {
  DLink,
  DNodeUtils,
  DNoteHeaderAnchor,
  extractNoteChangeEntryCounts,
  NoteChangeEntry,
  NoteProps,
  NoteQuickInput,
} from "@dendronhq/common-all";
import { Heading, HistoryEvent, Node } from "@dendronhq/engine-server";
import { RemarkUtils } from "@dendronhq/unified";
import _ from "lodash";
import { Disposable } from "vscode";
import {
  ILookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3Interface";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { NoteLookupProviderUtils } from "../components/lookup/NoteLookupProviderUtils";
import { NotePickerUtils } from "../components/lookup/NotePickerUtils";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { AutoCompleter } from "../utils/autoCompleter";
import { findReferences, FoundRefT } from "../utils/md";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import {
  appendHeaderToDestination,
  findAnchorNamesToUpdate,
  prepareMoveHeaderDestination,
  removeHeaderBlockFromOriginBody,
} from "./moveHeaderHelpers";
import {
  updateLinksInNote as updateLinksInNoteHelper,
  updateMoveHeaderReferences,
} from "./moveHeaderLinks";
import {
  moveHeaderErrors,
  validateAndProcessMoveHeaderInput,
} from "./moveHeaderValidate";

type CommandInput =
  | {
      nonInteractive?: boolean | undefined;
      useSameVault?: boolean | undefined;
    }
  | undefined;
type CommandOpts = {
  dest?: NoteProps | undefined;
  origin: NoteProps;
  nodesToMove: Node[];
  engine: IEngineAPIService;
} & CommandInput;
type CommandOutput = {
  changed: NoteChangeEntry[];
} & CommandOpts;

export class MoveHeaderCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.MOVE_HEADER.key;

  private noNodesToMoveError = moveHeaderErrors.noNodesToMove;
  private noDestError = moveHeaderErrors.noDest;

  private async validateAndProcessInput(engine: IEngineAPIService) {
    return validateAndProcessMoveHeaderInput({ engine });
  }

  /**
   * Helper for {@link MoveHeaderCommand.gatherInputs}
   * Prompts user to do a lookup on the desired destination.
   * @param opts
   * @returns
   */
  private promptForDestination(
    lookupController: ILookupControllerV3,
    opts: CommandInput
  ) {
    const extension = ExtensionProvider.getExtension();
    const lookupProvider = extension.noteLookupProviderFactory.create(
      this.key,
      {
        allowNewNote: true,
        noHidePickerOnAccept: false,
      }
    );

    lookupController.show({
      title: "Select note to move header to",
      placeholder: "note",
      provider: lookupProvider,
      initialValue: NotePickerUtils.getInitialValueFromOpenEditor(),
      nonInteractive: opts?.nonInteractive,
    });
    return lookupController;
  }

  /**
   * Get the destination note given a quickpick and the selected item.
   * @param opts
   * @returns
   */
  async prepareDestination(opts: {
    engine: IEngineAPIService;
    quickpick: DendronQuickPickerV2;
    selectedItems: readonly NoteQuickInput[];
  }) {
    return prepareMoveHeaderDestination(opts);
  }

  async gatherInputs(opts: CommandInput): Promise<CommandOpts | undefined> {
    // validate and process input
    const engine = ExtensionProvider.getEngine();
    const { proc, origin, targetHeader, targetHeaderIndex } =
      await this.validateAndProcessInput(engine);

    // extract nodes that need to be moved
    const originTree = proc.parse(origin.body);
    const nodesToMove = RemarkUtils.extractHeaderBlock(
      originTree,
      targetHeader.depth,
      targetHeaderIndex
    );

    if (nodesToMove.length === 0) {
      throw this.noNodesToMoveError;
    }

    const lcOpts: LookupControllerV3CreateOpts = {
      nodeType: "note",
      disableVaultSelection: opts?.useSameVault,
      vaultSelectCanToggle: false,
    };
    const lc =
      ExtensionProvider.getExtension().lookupControllerFactory.create(lcOpts);
    return new Promise((resolve) => {
      let disposable: Disposable;
      NoteLookupProviderUtils.subscribe({
        id: this.key,
        controller: lc,
        logger: this.L,
        onDone: async (event: HistoryEvent) => {
          const data = event.data as NoteLookupProviderSuccessResp;
          const quickpick: DendronQuickPickerV2 = lc.quickPick;
          const dest = await this.prepareDestination({
            engine,
            quickpick,
            selectedItems: data.selectedItems,
          });
          resolve({
            dest,
            origin,
            nodesToMove,
            engine,
          });
          disposable?.dispose();
          VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, false);
        },
      });
      this.promptForDestination(lc, opts);

      VSCodeUtils.setContext(DendronContext.NOTE_LOOK_UP_ACTIVE, true);

      disposable = AutoCompletableRegistrar.OnAutoComplete(() => {
        if (lc.quickPick) {
          lc.quickPick.value = AutoCompleter.getAutoCompletedValue(
            lc.quickPick
          );

          lc.provider.onUpdatePickerItems({
            picker: lc.quickPick,
          });
        }
      });
    });
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * Given a list of nodes to move, appends them to the destination
   * @param engine
   * @param dest
   * @param nodesToMove
   */
  private async appendHeaderToDestination(opts: {
    engine: IEngineAPIService;
    dest: NoteProps;
    origin: NoteProps;
    nodesToMove: Node[];
  }): Promise<void> {
    return appendHeaderToDestination(opts);
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * given a copy of origin, and the modified content of origin,
   * find the difference and return the updated anchor names
   * @param originDeepCopy
   * @param modifiedOriginContent
   * @returns anchorNamesToUpdate
   */
  private findAnchorNamesToUpdate(
    originDeepCopy: NoteProps,
    modifiedOriginContent: string
  ): string[] {
    return findAnchorNamesToUpdate(originDeepCopy, modifiedOriginContent);
  }

  async updateLinksInNote(opts: {
    note: NoteProps;
    engine: IEngineAPIService;
    linksToUpdate: DLink[];
    dest: NoteProps;
  }) {
    return updateLinksInNoteHelper(opts);
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * Given a list of found references, update those references
   * so that they point to the correct header in a destination note.
   * @param foundReferences
   * @param anchorNamesToUpdate
   * @param engine
   * @param origin
   * @param dest
   * @returns updated
   */
  async updateReferences(
    foundReferences: FoundRefT[],
    anchorNamesToUpdate: string[],
    engine: IEngineAPIService,
    origin: NoteProps,
    dest: NoteProps
  ): Promise<NoteChangeEntry[]> {
    return updateMoveHeaderReferences({
      foundReferences,
      anchorNamesToUpdate,
      engine,
      origin,
      dest,
      logCtx: `${this.key}:updateReferences`,
      logger: this.L,
    });
  }

  /**
   * Helper for {@link MoveHeaderCommand.execute}
   * Given a origin note and a list of nodes to move,
   * remove the nodes from the origin's note body
   * and return the modified origin content rendered as string
   * @param origin origin note
   * @param nodesToMove nodes that will be moved
   * @param engine
   * @returns
   */
  async removeBlocksFromOrigin(
    origin: NoteProps,
    nodesToMove: Node[],
    engine: IEngineAPIService
  ) {
    const modifiedOriginContent = removeHeaderBlockFromOriginBody({
      originBody: origin.body,
      nodesToMove,
    });
    origin.body = modifiedOriginContent;
    await engine.writeNote(origin);
    return modifiedOriginContent;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "MoveHeaderCommand";
    this.L.info({ ctx, opts });
    const { origin, nodesToMove, engine } = opts;
    const dest = opts.dest as NoteProps;

    if (_.isUndefined(dest)) {
      // we failed to get a destination. exit.
      throw this.noDestError;
    }

    // deep copy the origin before mutating it
    const originDeepCopy = _.cloneDeep(origin);

    // remove blocks from origin
    const modifiedOriginContent = await this.removeBlocksFromOrigin(
      origin,
      nodesToMove,
      engine
    );

    // append header to destination
    await this.appendHeaderToDestination({
      engine,
      dest,
      origin: originDeepCopy,
      nodesToMove,
    });

    delayedUpdateDecorations();

    // update all references to old block
    const anchorNamesToUpdate = this.findAnchorNamesToUpdate(
      originDeepCopy,
      modifiedOriginContent
    );
    const foundReferences = await findReferences(origin.fname);
    const updated = await this.updateReferences(
      foundReferences,
      anchorNamesToUpdate,
      engine,
      origin,
      dest
    );

    return { ...opts, changed: updated };
  }

  trackProxyMetrics({
    out,
    noteChangeEntryCounts,
  }: {
    out: CommandOutput;
    noteChangeEntryCounts: {
      createdCount: number;
      deletedCount: number;
      updatedCount: number;
    };
  }) {
    const extension = ExtensionProvider.getExtension();
    const engine = extension.getEngine();
    const { vaults } = engine;

    // only look at origin note
    const { origin } = out;

    const headers = _.toArray(origin.anchors).filter((anchor) => {
      return anchor !== undefined && anchor.type === "header";
    }) as DNoteHeaderAnchor[];

    const numOriginHeaders = headers.length;
    const originHeaderDepths = headers.map((header) => header.depth);
    const maxOriginHeaderDepth = _.max(originHeaderDepths);
    const meanOriginHeaderDepth = _.mean(originHeaderDepths);
    const movedHeaders = out.nodesToMove.filter((node) => {
      return node.type === "heading";
    }) as Heading[];
    const numMovedHeaders = movedHeaders.length;
    const movedHeaderDepths = movedHeaders.map((header) => header.depth);
    const maxMovedHeaderDepth = _.max(movedHeaderDepths);
    const meanMovedHeaderDepth = _.mean(movedHeaderDepths);

    ProxyMetricUtils.trackRefactoringProxyMetric({
      props: {
        command: this.key,
        numVaults: vaults.length,
        traits: origin.traits || [],
        numChildren: origin.children.length,
        numLinks: origin.links.length,
        numChars: origin.body.length,
        noteDepth: DNodeUtils.getDepth(origin),
      },
      extra: {
        ...noteChangeEntryCounts,
        numOriginHeaders,
        maxOriginHeaderDepth,
        meanOriginHeaderDepth,
        numMovedHeaders,
        maxMovedHeaderDepth,
        meanMovedHeaderDepth,
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
      this.trackProxyMetrics({ out, noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }

    return noteChangeEntryCounts;
  }
}
