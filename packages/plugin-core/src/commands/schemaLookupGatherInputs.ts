/**
 * Build controller + provider + QuickPick for schema lookup.
 */
import { VSCodeEvents } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { ILookupProviderV3 } from "../components/lookup/LookupProviderV3Interface";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";

export type SchemaLookupGatherRunOpts = {
  initialValue?: string;
  noConfirm?: boolean;
};

export type SchemaLookupGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean | undefined;
};

export async function gatherSchemaLookupInputs(opts: {
  runOpts?: SchemaLookupGatherRunOpts | undefined;
}): Promise<SchemaLookupGatherOutput> {
  const start = process.hrtime();
  const ctx = "SchemaLookupCommand:gatherInput";
  Logger.info({ ctx, opts: opts.runOpts, msg: "enter" });
  const copts = opts.runOpts || {};
  const extension = ExtensionProvider.getExtension();
  const controller = extension.lookupControllerFactory.create({
    nodeType: "schema",
  });
  const provider = extension.schemaLookupProviderFactory.create(
    "schemaLookup",
    {
      allowNewNote: true,
      noHidePickerOnAccept: false,
    },
  );

  const { quickpick } = await controller.prepareQuickPick({
    title: "Lookup Schema",
    placeholder: "schema",
    provider,
    initialValue: copts.initialValue,
    nonInteractive: copts.noConfirm,
    alwaysShow: true,
  });

  AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Gather, {
    duration: getDurationMilliseconds(start),
  });

  return {
    controller,
    provider,
    quickpick,
    noConfirm: copts.noConfirm,
  };
}
