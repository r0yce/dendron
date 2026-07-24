/**
 * Dispatch create-new / existing / template accept for note lookup.
 */
import { NoteQuickInput, VSCodeEvents } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import _ from "lodash";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { acceptExistingLookupItem } from "./noteLookupAcceptExisting";
import { acceptNewLookupItem } from "./noteLookupAcceptNew";
import { acceptNewWithTemplateLookupItem } from "./noteLookupAcceptTemplate";
import { NoteLookupAcceptReturn } from "./noteLookupAcceptTypes";

export async function acceptLookupItem(opts: {
  item: NoteQuickInput;
  picker: DendronQuickPickerV2;
  fnameForNew: string;
  analyticsSource: string;
  logger: typeof Logger | { error: Function };
}): Promise<NoteLookupAcceptReturn | undefined> {
  const { item, picker, fnameForNew, analyticsSource, logger } = opts;
  const start = process.hrtime();
  const isNew = PickerUtilsV2.isCreateNewNotePicked(item);
  const isNewWithTemplate =
    PickerUtilsV2.isCreateNewNoteWithTemplatePicked(item);

  let result: Promise<NoteLookupAcceptReturn | undefined>;
  if (isNew) {
    if (isNewWithTemplate) {
      result = acceptNewWithTemplateLookupItem({
        item,
        picker,
        fname: fnameForNew,
        logger,
      });
    } else {
      result = acceptNewLookupItem({
        item,
        picker,
        fname: fnameForNew,
        analyticsSource,
      });
    }
  } else {
    result = acceptExistingLookupItem({ item, picker });
  }

  const resolved = await result;
  const profile = getDurationMilliseconds(start);
  AnalyticsUtils.track(VSCodeEvents.NoteLookup_Accept, {
    duration: profile,
    isNew,
    isNewWithTemplate,
  });
  const metaData = MetadataService.instance().getMeta();
  if (_.isUndefined(metaData.firstLookupTime)) {
    MetadataService.instance().setFirstLookupTime();
  }
  MetadataService.instance().setLastLookupTime();
  return resolved;
}
