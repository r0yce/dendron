/**
 * Schema lookup command — thin shell over modular helpers.
 *
 * - gather: `schemaLookupGatherInputs`
 * - enrich: `lookupCommandEnrichInputs`
 * - accept: `schemaLookupAcceptItem` (+ Existing/New)
 * - execute: `schemaLookupExecute`
 *
 * Dual-build: F5 loads tsc `out/src/extension.js` (not webpack `dist/`).
 */
import {
  DendronError,
  ERROR_STATUS,
  SchemaQuickInput,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import _ from "lodash";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { DENDRON_COMMANDS } from "../constants";
import { AnalyticsUtils } from "../utils/analytics";
import { BaseCommand } from "./base";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { ILookupProviderV3 } from "../components/lookup/LookupProviderV3Interface";
import { enrichSchemaLookupInputs } from "./lookupCommandEnrichInputs";
import { acceptSchemaLookupItem } from "./schemaLookupAcceptItem";
import { acceptExistingSchemaLookupItem } from "./schemaLookupAcceptExisting";
import { acceptNewSchemaLookupItem } from "./schemaLookupAcceptNew";
import { SchemaLookupAcceptReturn } from "./schemaLookupAcceptTypes";
import {
  gatherSchemaLookupInputs,
  SchemaLookupGatherOutput,
} from "./schemaLookupGatherInputs";
import { executeSchemaLookupSelection } from "./schemaLookupExecute";

type CommandRunOpts = {
  initialValue?: string;
  noConfirm?: boolean;
};

type CommandGatherOutput = SchemaLookupGatherOutput;

type CommandOpts = {
  selectedItems: readonly SchemaQuickInput[];
} & CommandGatherOutput;

export type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
};

type OnDidAcceptReturn = SchemaLookupAcceptReturn;

export class SchemaLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  key = DENDRON_COMMANDS.LOOKUP_SCHEMA.key;
  protected _controller: ILookupControllerV3 | undefined;
  protected _provider: ILookupProviderV3 | undefined;

  constructor() {
    super("SchemaLookupCommand");
  }

  protected get controller(): ILookupControllerV3 {
    if (_.isUndefined(this._controller)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "controller not set",
      });
    }
    return this._controller;
  }

  protected get provider(): ILookupProviderV3 {
    if (_.isUndefined(this._provider)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "provider not set",
      });
    }
    return this._provider;
  }

  async gatherInputs(opts?: CommandRunOpts): Promise<CommandGatherOutput> {
    const gathered = await gatherSchemaLookupInputs({ runOpts: opts });
    this._controller = gathered.controller;
    this._provider = gathered.provider;
    return gathered;
  }

  async enrichInputs(
    opts: CommandGatherOutput,
  ): Promise<CommandOpts | undefined> {
    const start = process.hrtime();
    const resultPromise = enrichSchemaLookupInputs({
      historyId: "schemaLookup",
      gather: opts,
      logCtx: "SchemaLookupCommand",
      logger: this.L,
      mapDone: (data) => ({
        selectedItems: data.selectedItems as readonly SchemaQuickInput[],
        ...opts,
      }),
    });
    AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Show, {
      duration: getDurationMilliseconds(start),
    });
    return resultPromise;
  }

  async acceptItem(
    item: SchemaQuickInput,
  ): Promise<OnDidAcceptReturn | undefined> {
    return acceptSchemaLookupItem({
      item,
      picker: this.controller.quickPick,
    });
  }

  async acceptExistingSchemaItem(
    item: SchemaQuickInput,
  ): Promise<OnDidAcceptReturn | undefined> {
    return acceptExistingSchemaLookupItem(item);
  }

  async acceptNewSchemaItem(): Promise<OnDidAcceptReturn | undefined> {
    return acceptNewSchemaLookupItem({ picker: this.controller.quickPick });
  }

  async execute(opts: CommandOpts) {
    await executeSchemaLookupSelection({
      quickpick: opts.quickpick,
      controller: opts.controller,
    });
    return opts;
  }

  cleanUp() {
    if (this._controller) {
      this._controller.onHide();
    }
  }
}
