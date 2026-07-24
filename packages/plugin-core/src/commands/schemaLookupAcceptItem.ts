/**
 * Dispatch create-new / existing accept for schema lookup.
 */
import { SchemaQuickInput, VSCodeEvents } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { AnalyticsUtils } from "../utils/analytics";
import { acceptExistingSchemaLookupItem } from "./schemaLookupAcceptExisting";
import { acceptNewSchemaLookupItem } from "./schemaLookupAcceptNew";
import { SchemaLookupAcceptReturn } from "./schemaLookupAcceptTypes";

export async function acceptSchemaLookupItem(opts: {
  item: SchemaQuickInput;
  picker: DendronQuickPickerV2;
}): Promise<SchemaLookupAcceptReturn | undefined> {
  const { item, picker } = opts;
  const start = process.hrtime();
  const isNew = PickerUtilsV2.isCreateNewNotePicked(item);
  const result = isNew
    ? await acceptNewSchemaLookupItem({ picker })
    : await acceptExistingSchemaLookupItem(item);

  AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Accept, {
    duration: getDurationMilliseconds(start),
    isNew,
  });
  return result;
}
