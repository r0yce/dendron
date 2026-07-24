import {
  DendronError,
  DVault,
  ERROR_STATUS,
  SchemaModuleProps,
  SchemaQuickInput,
  SchemaUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds, vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import { Uri } from "vscode";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { BaseCommand } from "./base";
import { ExtensionProvider } from "../ExtensionProvider";
import { ILookupControllerV3 } from "../components/lookup/LookupControllerV3Interface";
import { ILookupProviderV3 } from "../components/lookup/LookupProviderV3Interface";
import { enrichSchemaLookupInputs } from "./lookupCommandEnrichInputs";

type CommandRunOpts = {
  initialValue?: string;
  noConfirm?: boolean;
};

type CommandGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean | undefined;
  fuzzThreshold?: number | undefined;
};

type CommandOpts = {
  selectedItems: readonly SchemaQuickInput[];
} & CommandGatherOutput;

export type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: ILookupControllerV3;
  provider: ILookupProviderV3;
};

type OnDidAcceptReturn = {
  uri: Uri;
  node: SchemaModuleProps;
  resp?: any;
};

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
    const start = process.hrtime();
    const ctx = "SchemaLookupCommand:gatherInput";
    Logger.info({ ctx, opts, msg: "enter" });
    const copts: CommandRunOpts = opts || {};
    const extension = ExtensionProvider.getExtension();
    this._controller = extension.lookupControllerFactory.create({
      nodeType: "schema",
    });
    this._provider = extension.schemaLookupProviderFactory.create(
      "schemaLookup",
      {
        allowNewNote: true,
        noHidePickerOnAccept: false,
      },
    );
    const lc = this.controller;

    const { quickpick } = await lc.prepareQuickPick({
      title: "Lookup Schema",
      placeholder: "schema",
      provider: this.provider,
      initialValue: copts.initialValue,
      nonInteractive: copts.noConfirm,
      alwaysShow: true,
    });

    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Gather, {
      duration: profile,
    });

    return {
      controller: this.controller,
      provider: this.provider,
      quickpick,
      noConfirm: copts.noConfirm,
    };
  }

  async enrichInputs(
    opts: CommandGatherOutput,
  ): Promise<CommandOpts | undefined> {
    const start = process.hrtime();
    // Promise executor runs showQuickPick synchronously before we await selection.
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
    let result: Promise<OnDidAcceptReturn | undefined>;
    const start = process.hrtime();
    const isNew = PickerUtilsV2.isCreateNewNotePicked(item);
    if (isNew) {
      result = this.acceptNewSchemaItem();
    } else {
      result = this.acceptExistingSchemaItem(item);
    }
    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Accept, {
      duration: profile,
      isNew,
    });
    return result;
  }

  async acceptExistingSchemaItem(
    item: SchemaQuickInput,
  ): Promise<OnDidAcceptReturn | undefined> {
    const { wsRoot, engine } = ExtensionProvider.getDWorkspace();
    const vpath = vault2Path({
      vault: item.vault,
      wsRoot,
    });
    const schemaModule = await engine.getSchema(item.id);

    if (!schemaModule.data) {
      return;
    }
    const uri = Uri.file(
      SchemaUtils.getPath({
        root: vpath,
        fname: schemaModule.data.fname,
      }),
    );
    return { uri, node: schemaModule.data };
  }

  async acceptNewSchemaItem(): Promise<OnDidAcceptReturn | undefined> {
    const picker = this.controller.quickPick;
    const fname = picker.value;
    const ws = ExtensionProvider.getDWorkspace();
    const { engine } = ws;
    const vault: DVault = picker.vault
      ? picker.vault
      : PickerUtilsV2.getVaultForOpenEditor();
    const nodeSchemaModuleNew: SchemaModuleProps =
      SchemaUtils.createModuleProps({
        fname,
        vault,
      });
    const vpath = vault2Path({ vault, wsRoot: ws.wsRoot });
    const uri = Uri.file(SchemaUtils.getPath({ root: vpath, fname }));
    const resp = await engine.writeSchema(nodeSchemaModuleNew);

    return { uri, node: nodeSchemaModuleNew, resp };
  }

  async execute(opts: CommandOpts) {
    try {
      const { quickpick } = opts;
      const selected = quickpick.selectedItems.slice(
        0,
        1,
      ) as SchemaQuickInput[];
      const out = await Promise.all(
        selected.map((item) => {
          return this.acceptItem(item);
        }),
      );
      const outClean = out.filter(
        (ent) => !_.isUndefined(ent),
      ) as OnDidAcceptReturn[];
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
    return opts;
  }

  cleanUp() {
    if (this._controller) {
      this._controller.onHide();
    }
  }
}
