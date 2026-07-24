/**
 * Schema QuickPick result fetch helpers.
 */
import { DNodeUtils, SchemaProps, SchemaUtils } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { CREATE_NEW_SCHEMA_DETAIL } from "./constants";
import { NotePickerUtils, PAGINATE_LIMIT } from "./NotePickerUtils";
import { enhanceNotesForQuickInput } from "./notePickerEnhance";
import { sliceForPaginationLimit } from "./pickerPagination";
import { DendronQuickPickerV2 } from "./types";
import { PickerUtilsV2 } from "./utils";

export class SchemaPickerUtils {
  static async fetchPickerResultsWithCurrentValue({
    picker,
  }: {
    picker: DendronQuickPickerV2;
  }) {
    const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    const resp = await engine.querySchema(picker.value);
    if (resp.data && resp.data.length > 0) {
      const schemaRoot = resp.data[0]!;
      const node = SchemaUtils.getModuleRoot(schemaRoot);
      if (node && node.fname === picker.value) {
        return [
          DNodeUtils.enhancePropForQuickInputV3({
            wsRoot,
            props: node,
            schema: node.schema
              ? (await engine.getSchema(node.schema.moduleId)).data
              : undefined,
            vaults,
          }),
        ];
      }
    }
    return [
      NotePickerUtils.createNoActiveItem({
        fname: picker.value,
        detail: CREATE_NEW_SCHEMA_DETAIL,
      }),
    ];
  }

  static async fetchPickerResults(opts: {
    picker: DendronQuickPickerV2;
    qs: string;
  }) {
    const ctx = "SchemaPickerUtils:fetchPickerResults";
    const start = process.hrtime();
    const { picker, qs } = opts;
    const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    const resp = await engine.querySchema(qs);
    let nodes: SchemaProps[] = [];
    if (resp.data) {
      nodes = resp.data.map((ent) => SchemaUtils.getModuleRoot(ent));
    }

    const pageSlice = sliceForPaginationLimit(nodes, PAGINATE_LIMIT);
    if (pageSlice.hasMore && pageSlice.allResults) {
      picker.allResults = pageSlice.allResults;
      picker.offset = pageSlice.offset;
      picker.moreResults = true;
      nodes = pageSlice.page;
    } else {
      PickerUtilsV2.resetPaginationOpts(picker);
      nodes = pageSlice.page;
    }

    const updatedItems = await enhanceNotesForQuickInput({
      nodes,
      engine,
      wsRoot,
      vaults,
      ...(picker.alwaysShowAll !== undefined
        ? { alwaysShow: picker.alwaysShowAll }
        : {}),
    });
    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "engine.querySchema", profile });
    return updatedItems;
  }
}
