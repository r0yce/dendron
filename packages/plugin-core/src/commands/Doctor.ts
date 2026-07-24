/**
 * Doctor command — gather action/scope, delegate execute to doctorExecute.
 *
 * Modular: `doctorActions`, `doctorPreviews`, `doctorExecute`.
 */
import {
  DendronError,
  DEngineClient,
  NoteProps,
  ValidateFnameResp,
} from "@dendronhq/common-all";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import _ from "lodash";
import { QuickInputButton, QuickPick, QuickPickItem, window } from "vscode";
import {
  ChangeScopeBtn,
  DoctorBtn,
  IDoctorQuickInputButton,
} from "../components/doctor/buttons";
import { DoctorScopeType } from "../components/doctor/types";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";
import { IDendronExtension } from "../dendronExtensionInterface";
import { QuickPickHierarchySelector } from "../components/lookup/HierarchySelector";
import { PluginDoctorActionsEnum } from "./doctorActions";
import {
  IncompatibleExtensionInstallStatus,
  showBrokenLinkPreview as showBrokenLinkPreviewHelper,
  showFixInvalidFileNamePreview as showFixInvalidFileNamePreviewHelper,
  showIncompatibleExtensionPreview as showIncompatibleExtensionPreviewHelper,
  showMissingNotePreview as showMissingNotePreviewHelper,
} from "./doctorPreviews";
import { executeDoctorCommand } from "./doctorExecute";

export { PluginDoctorActionsEnum } from "./doctorActions";

type Finding = {
  issue: string;
  fix?: string;
};

type CommandOptsData = {
  installStatus?: IncompatibleExtensionInstallStatus[];
  note?: NoteProps;
};

type CommandOpts = {
  action: DoctorActionsEnum | PluginDoctorActionsEnum;
  scope: DoctorScopeType;
  data?: CommandOptsData;
};

type CommandOutput = {
  data: Finding[];
  extra: any;
};

type CreateQuickPickOpts = {
  title: string;
  placeholder: string;
  items: DoctorQuickInput[];
  /**
   * QuickPick.ignoreFocusOut prop
   */
  ignoreFocusOut?: boolean;
  nonInteractive?: boolean;
  buttons?: DoctorBtn[];
};

type DoctorQuickInput = {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

type DoctorQuickPickItem = QuickPick<DoctorQuickInput>;

export class DoctorCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.DOCTOR.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  getHierarchy() {
    return new QuickPickHierarchySelector().getHierarchy();
  }

  createQuickPick(opts: CreateQuickPickOpts) {
    const { title, placeholder, ignoreFocusOut, items } = _.defaults(opts, {
      ignoreFocusOut: true,
    });
    const quickPick =
      VSCodeUtils.createQuickPick<DoctorQuickInput>() as DoctorQuickPickItem;
    quickPick.title = title;
    quickPick.placeholder = placeholder;
    quickPick.ignoreFocusOut = ignoreFocusOut;
    quickPick.items = items;
    quickPick.buttons = opts.buttons! as unknown as QuickInputButton[];

    return quickPick;
  }

  onTriggerButton = async (quickpick: DoctorQuickPickItem) => {
    if (!quickpick) {
      return;
    }
    const button = quickpick.buttons[0] as unknown as IDoctorQuickInputButton;
    button.pressed = !button.pressed;
    button.type = button.type === "workspace" ? "file" : "workspace";
    quickpick.buttons = [button as unknown as QuickInputButton];
    quickpick.title = `Doctor (${button.type})`;
  };

  async gatherInputs(inputs: CommandOpts): Promise<CommandOpts | undefined> {
    // If inputs are already provided, don't ask the user.
    if (inputs && inputs.action && inputs.scope) return inputs;
    // eslint-disable-next-line no-async-promise-executor
    const out = new Promise<CommandOpts | undefined>(async (resolve) => {
      const doctorActionQuickPickItems = _.map(DoctorActionsEnum, (ent) => {
        return { label: ent };
      }) as QuickPickItem[];
      const pluginDoctorActionQuickPickItems = _.map(
        PluginDoctorActionsEnum,
        (ent) => {
          return { label: ent };
        },
      ) as QuickPickItem[];
      const allDoctorActionQuickPickItems = doctorActionQuickPickItems.concat(
        pluginDoctorActionQuickPickItems,
      );

      const changeScopeButton = ChangeScopeBtn.create(false);
      const quickPick = this.createQuickPick({
        title: "Doctor",
        placeholder: "Select a Doctor Action.",
        items: allDoctorActionQuickPickItems,
        buttons: [changeScopeButton],
      });
      const scope = (quickPick.buttons[0] as unknown as IDoctorQuickInputButton)
        .type;
      quickPick.title = `Doctor (${scope})`;
      quickPick.onDidAccept(async () => {
        quickPick.hide();
        const doctorAction = quickPick.selectedItems[0]!.label;
        const doctorScope = (
          quickPick.buttons[0] as unknown as IDoctorQuickInputButton
        ).type;
        return resolve({
          action: doctorAction as DoctorActionsEnum | PluginDoctorActionsEnum,
          scope: doctorScope,
        });
      });
      quickPick.onDidTriggerButton(() => this.onTriggerButton(quickPick));
      quickPick.show();
    });
    return out;
  }

  async showMissingNotePreview(candidates: NoteProps[]) {
    return showMissingNotePreviewHelper(candidates);
  }

  async showBrokenLinkPreview(
    brokenLinks: {
      file: string;
      vault: string;
      links: {
        value: string;
        line: number;
        column: number;
      }[];
    }[],
    engine: DEngineClient,
  ) {
    return showBrokenLinkPreviewHelper(brokenLinks, engine);
  }

  async showIncompatibleExtensionPreview(opts: {
    installStatus: IncompatibleExtensionInstallStatus[];
  }) {
    return showIncompatibleExtensionPreviewHelper(opts);
  }

  async showFixInvalidFileNamePreview(opts: {
    canRename: {
      cleanedFname: string;
      canRename: boolean;
      note: NoteProps;
      resp: ValidateFnameResp;
    }[];
    cantRename: {
      cleanedFname: string;
      canRename: boolean;
      note: NoteProps;
      resp: ValidateFnameResp;
    }[];
  }) {
    return showFixInvalidFileNamePreviewHelper(opts);
  }

  private async reload() {
    const engine = await new ReloadIndexCommand().execute();
    if (_.isUndefined(engine)) {
      throw new DendronError({ message: "no engine found." });
    }
    return engine;
  }

  addAnalyticsPayload(opts: CommandOpts, out: CommandOutput) {
    let payload = {
      action: opts.action,
      scope: opts.scope,
    };
    if (out.extra) {
      switch (opts.action) {
        case DoctorActionsEnum.FIX_INVALID_FILENAMES: {
          payload = {
            ...payload,
            ...out.extra,
          };
          break;
        }
        default: {
          break;
        }
      }
    }
    return payload;
  }

  async execute(opts: CommandOpts) {
    return executeDoctorCommand({
      opts,
      extension: this.extension,
      logger: this.L,
      reload: () => this.reload(),
      showMissingNotePreview: (c) => this.showMissingNotePreview(c),
      showBrokenLinkPreview: (b, e) => this.showBrokenLinkPreview(b, e),
      showIncompatibleExtensionPreview: (o) =>
        this.showIncompatibleExtensionPreview(o),
      showFixInvalidFileNamePreview: (o) =>
        this.showFixInvalidFileNamePreview(o),
    });
  }

  async showResponse(findings: CommandOutput) {
    findings.data.forEach((f) => {
      window.showInformationMessage(`issue: ${f.issue}. fix: ${f.fix}`);
    });
    window.showInformationMessage(`Doctor finished checkup 🍭`);
  }
}
