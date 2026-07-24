import {
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DVault,
  LabelUtils,
  NoteLookupUtils,
  NoteProps,
  NoteQuickInput,
  TransformedQueryString,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { LinkUtils } from "@dendronhq/unified";
import _ from "lodash";
import path from "path";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import {
  CREATE_NEW_NOTE_DETAIL,
  CREATE_NEW_LABEL,
  CREATE_NEW_WITH_TEMPLATE_LABEL,
  CREATE_NEW_NOTE_WITH_TEMPLATE_DETAIL,
} from "./constants";
import { DendronQuickPickerV2 } from "./types";
import { getPickerValue } from "./pickerValue";
import { filterPickerResults, PickerUtilsV2 } from "./utils";

/** Max items shown in the quickpick at once (virtualized page). */
export const PAGINATE_LIMIT = 50;
/** Fetch a bit more than a page so pagination "more" works without a second round-trip. */
export const QUERY_FETCH_LIMIT = PAGINATE_LIMIT * 3;

export class NotePickerUtils {
  static async createItemsFromSelectedWikilinks(): Promise<
    DNodePropsQuickInputV2[] | undefined
  > {
    const engine = ExtensionProvider.getEngine();
    const { vaults, wsRoot } = engine;

    // get selection
    const { text } = VSCodeUtils.getSelection();
    if (text === undefined) {
      return;
    }
    const wikiLinks = LinkUtils.extractWikiLinks(text as string);

    // dedupe wikilinks by value
    const uniqueWikiLinks = _.uniqBy(wikiLinks, "value");

    const activeNote = await ExtensionProvider.getWSUtils().getActiveNote();
    if (!activeNote) {
      return;
    }

    // make a list of picker items from wikilinks
    const notesFromWikiLinks = await LinkUtils.getNotesFromWikiLinks({
      activeNote,
      wikiLinks: uniqueWikiLinks,
      engine,
    });
    const pickerItemsFromSelection = await Promise.all(
      notesFromWikiLinks.map(async (note: DNodeProps) =>
        DNodeUtils.enhancePropForQuickInputV3({
          props: note,
          schema: note.schema
            ? (
                await engine.getSchema(note.schema.moduleId)
              ).data
            : undefined,
          vaults,
          wsRoot,
        })
      )
    );
    return pickerItemsFromSelection;
  }

  static createNoActiveItem({
    fname,
    detail,
  }: {
    fname: string;
    detail: string;
  }): DNodePropsQuickInputV2 {
    const props = DNodeUtils.create({
      id: CREATE_NEW_LABEL,
      fname,
      type: "note",
      vault: { fsPath: "", name: "" } as DVault, // sentinel for CREATE_NEW UI item only (no real FS ops); 4-axis style boundary note + dated (final @ts burn 2026-06-01 per ts-expect-error-burner + strict-mode-fixer patterns). No @ts needed.
    });
    return {
      ...props,
      label: CREATE_NEW_LABEL,
      detail,
      alwaysShow: true,
    };
  }

  static createNewWithTemplateItem({
    fname,
  }: {
    fname: string;
  }): DNodePropsQuickInputV2 {
    const props = DNodeUtils.create({
      id: CREATE_NEW_WITH_TEMPLATE_LABEL,
      fname,
      type: "note",
      vault: { fsPath: "", name: "" } as DVault, // sentinel for CREATE_NEW_WITH_TEMPLATE UI item only (no real FS ops); 4-axis style boundary note + dated (final @ts burn 2026-06-01 per ts-expect-error-burner + strict-mode-fixer patterns). No @ts needed.
    });

    const label = LabelUtils.createLabelWithHighlight({
      value: CREATE_NEW_WITH_TEMPLATE_LABEL,
      highlight: {
        value: "$(beaker) [New] ",
        location: "prefix",
        expirationDate: new Date("2022-11-15"),
      },
    });

    return {
      ...props,
      label,
      detail: CREATE_NEW_NOTE_WITH_TEMPLATE_DETAIL,
      alwaysShow: true,
    };
  }

  static getInitialValueFromOpenEditor() {
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );
    return initialValue;
  }

  static getSelection(picker: DendronQuickPickerV2): NoteQuickInput[] {
    return [...picker.selectedItems];
  }

  static fetchRootQuickPickResults = async ({
    engine,
  }: {
    engine: DEngineClient;
  }) => {
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    const nodes = await NoteLookupUtils.fetchRootResultsFromEngine(engine);
    return Promise.all(
      nodes.map(async (ent) => {
        return DNodeUtils.enhancePropForQuickInput({
          wsRoot,
          props: ent,
          schema: ent.schema
            ? (await engine.getSchema(ent.schema.moduleId)).data
            : undefined,
          vaults,
        });
      })
    );
  };

  /**
   * Get picker results without input from the user
   */
  static async fetchPickerResultsNoInput({
    picker,
  }: {
    picker: DendronQuickPickerV2;
  }) {
    const engine = ExtensionProvider.getDWorkspace().engine;
    const resp = await NoteLookupUtils.lookup({
      qsRaw: picker.value,
      engine,
      showDirectChildrenOnly: picker.showDirectChildrenOnly,
    });

    if (resp.length) {
      const note = resp[0]!;
      const isPerfectMatch = note.fname === picker.value;
      if (isPerfectMatch) {
        return [await this.enhanceNoteForQuickInput({ note, engine })];
      }
    }
    return [
      NotePickerUtils.createNoActiveItem({
        fname: picker.value,
        detail: CREATE_NEW_NOTE_DETAIL,
      }),
    ];
  }

  private static async enhanceNoteForQuickInput(input: {
    note: NoteProps;
    engine: DEngineClient;
  }) {
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    return DNodeUtils.enhancePropForQuickInputV3({
      wsRoot,
      props: input.note,
      schema: input.note.schema
        ? (await input.engine.getSchema(input.note.schema.moduleId)).data
        : undefined,
      vaults,
    });
  }

  static async fetchPickerResults(opts: {
    picker: DendronQuickPickerV2;
    transformedQuery: TransformedQueryString;
    originalQS: string;
  }) {
    const ctx = "createPickerItemsFromEngine";
    const start = process.hrtime();
    const { picker, transformedQuery, originalQS } = opts;
    const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    // if we are doing a query, reset pagination options
    PickerUtilsV2.resetPaginationOpts(picker);

    let nodes = await engine.queryNotes({
      qs: transformedQuery.queryString,
      onlyDirectChildren: transformedQuery.onlyDirectChildren,
      originalQS,
      // Cap fuse/sqlite hits early — lookup only needs a page + small buffer
      limit: QUERY_FETCH_LIMIT,
    });

    if (nodes.length === 0) {
      return [];
    }

    // We need to filter our results to abide by different variations of our
    // transformed query. We should do filtering prior to doing pagination cut off.
    nodes = filterPickerResults({ itemsToFilter: nodes, transformedQuery });

    Logger.info({ ctx, msg: "post:queryNotes" });
    if (nodes.length > PAGINATE_LIMIT) {
      picker.allResults = nodes;
      picker.offset = PAGINATE_LIMIT;
      picker.moreResults = true;
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    } else {
      PickerUtilsV2.resetPaginationOpts(picker);
    }

    // Batch schema module loads (unique modules) — avoids N sequential getSchema calls
    const schemaModuleIds = _.uniq(
      nodes
        .map((ent) => ent.schema?.moduleId)
        .filter((id): id is string => !!id)
    );
    const schemaByModule = new Map<string, Awaited<
      ReturnType<DEngineClient["getSchema"]>
    >["data"]>();
    await Promise.all(
      schemaModuleIds.map(async (moduleId) => {
        const resp = await engine.getSchema(moduleId);
        if (resp.data) {
          schemaByModule.set(moduleId, resp.data);
        }
      })
    );

    const updatedItems = await Promise.all(
      nodes.map(async (ent) =>
        DNodeUtils.enhancePropForQuickInputV3({
          wsRoot,
          props: ent,
          schema: ent.schema?.moduleId
            ? schemaByModule.get(ent.schema.moduleId)
            : undefined,
          vaults,
          alwaysShow: picker.alwaysShowAll,
        })
      )
    );

    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "engine.query", profile });
    return updatedItems;
  }

  static getPickerValue = getPickerValue;
}
