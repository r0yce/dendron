/**
 * After schema picker accept: accept first selection and open schema file(s).
 */
import { SchemaQuickInput } from "@dendronhq/common-all";
import _ from "lodash";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { acceptSchemaLookupItem } from "./schemaLookupAcceptItem";
import { SchemaLookupAcceptReturn } from "./schemaLookupAcceptTypes";

export async function executeSchemaLookupSelection(opts: {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
}): Promise<void> {
  try {
    const { quickpick } = opts;
    const selected = quickpick.selectedItems.slice(0, 1) as SchemaQuickInput[];
    const out = await Promise.all(
      selected.map((item) =>
        acceptSchemaLookupItem({ item, picker: quickpick }),
      ),
    );
    const outClean = out.filter(
      (ent) => !_.isUndefined(ent),
    ) as SchemaLookupAcceptReturn[];
    await _.reduce(
      outClean,
      async (acc, item) => {
        await acc;
        return quickpick.showNote!(item.uri);
      },
      Promise.resolve({}),
    );
  } finally {
    opts.controller.onHide();
  }
}
