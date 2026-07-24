import {
  DendronError,
  DEngineClient,
  ExtensionEvents,
  extractNoteChangeEntryCounts,
  isNotUndefined,
  KeybindingConflictDetectedSource,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  ValidateFnameResp,
} from "@dendronhq/common-all";
import {
  DoctorService,
  DoctorActionsEnum,
  BackfillService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import {
  QuickInputButton,
  QuickPick,
  QuickPickItem,
  Uri,
  ViewColumn,
  window,
} from "vscode";
import {
  ChangeScopeBtn,
  DoctorBtn,
  IDoctorQuickInputButton,
} from "../components/doctor/buttons";
import { DoctorScopeType } from "../components/doctor/types";
import {
  INCOMPATIBLE_EXTENSIONS,
  DENDRON_COMMANDS,
  KNOWN_KEYBINDING_CONFLICTS,
} from "../constants";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";
import { AnalyticsUtils } from "../utils/analytics";
import { IDendronExtension } from "../dendronExtensionInterface";
import { KeybindingUtils } from "../KeybindingUtils";
import { QuickPickHierarchySelector } from "../components/lookup/HierarchySelector";
import { DConfig } from "@dendronhq/common-server";
import {
  PluginDoctorActionsEnum,
  shouldDoctorReloadWorkspaceAfterDoctorAction,
  shouldDoctorReloadWorkspaceBeforeDoctorAction,
} from "./doctorActions";
import {
  IncompatibleExtensionInstallStatus,
  showBrokenLinkPreview as showBrokenLinkPreviewHelper,
  showFixInvalidFileNamePreview as showFixInvalidFileNamePreviewHelper,
  showIncompatibleExtensionPreview as showIncompatibleExtensionPreviewHelper,
  showMissingNotePreview as showMissingNotePreviewHelper,
} from "./doctorPreviews";

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
        }
      ) as QuickPickItem[];
      const allDoctorActionQuickPickItems = doctorActionQuickPickItems.concat(
        pluginDoctorActionQuickPickItems
      );

      const changeScopeButton = ChangeScopeBtn.create(false);
      const quickPick = this.createQuickPick({
        title: "Doctor",
        placeholder: "Select a Doctor Action.",
        items: allDoctorActionQuickPickItems,
        buttons: [changeScopeButton],
      });
      const scope = (quickPick.buttons[0] as unknown as IDoctorQuickInputButton).type;
      quickPick.title = `Doctor (${scope})`;
      quickPick.onDidAccept(async () => {
        quickPick.hide();
        const doctorAction = quickPick.selectedItems[0]!.label;
        const doctorScope = (quickPick.buttons[0] as unknown as IDoctorQuickInputButton)
          .type;
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
    engine: DEngineClient
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
    const ctx = "DoctorCommand:execute";
    window.showInformationMessage("Calling the doctor.");
    const { wsRoot, config } = this.extension.getDWorkspace();
    const findings: Finding[] = [];
    let extra: any;
    if (_.isUndefined(wsRoot)) {
      throw new DendronError({ message: "rootDir undefined" });
    }
    if (_.isUndefined(config)) {
      throw new DendronError({ message: "no config found" });
    }

    if (this.extension.fileWatcher) {
      this.extension.fileWatcher.pause = true;
    }
    // Make sure to save any changes in the file because Doctor reads them from
    // disk, and won't see changes that haven't been saved.
    let note;
    if (opts.data?.note) {
      note = opts.data.note;
    } else {
      const document = VSCodeUtils.getActiveTextEditor()?.document;
      if (
        isNotUndefined(document) &&
        isNotUndefined(
          await this.extension.wsUtils.getNoteFromDocument(document)
        )
      ) {
        await document.save();
      }
      this.L.info({ ctx, msg: "pre:Reload" });

      if (shouldDoctorReloadWorkspaceBeforeDoctorAction(opts.action)) {
        await this.reload();
      }

      if (opts.scope === "file") {
        const document = VSCodeUtils.getActiveTextEditor()?.document;
        if (_.isUndefined(document)) {
          throw new DendronError({ message: "No note open." });
        }
        note = await this.extension.wsUtils.getNoteFromDocument(document);
      }
    }

    const engine = this.extension.getEngine();

    switch (opts.action) {
      case PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS: {
        const installStatus =
          opts.data?.installStatus ||
          INCOMPATIBLE_EXTENSIONS.map((ext) => {
            return {
              id: ext,
              installed: VSCodeUtils.isExtensionInstalled(ext),
            };
          });
        await this.showIncompatibleExtensionPreview({ installStatus });
        break;
      }
      case PluginDoctorActionsEnum.FIX_KEYBINDING_CONFLICTS: {
        const conflicts = KeybindingUtils.getConflictingKeybindings({
          knownConflicts: KNOWN_KEYBINDING_CONFLICTS,
        });
        if (conflicts.length > 0) {
          await KeybindingUtils.showKeybindingConflictPreview({ conflicts });
          AnalyticsUtils.track(ExtensionEvents.KeybindingConflictDetected, {
            source: KeybindingConflictDetectedSource.doctor,
          });
        } else {
          window.showInformationMessage(`There are no keybinding conflicts!`);
        }
        break;
      }
      case DoctorActionsEnum.FIX_FRONTMATTER: {
        await new BackfillService().updateNotes({
          engine,
          note,
          // fix notes with broken ids if necessary
          overwriteFields: ["id"],
        } as any /* TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes (BackfillServiceOpts from engine-server); Batch 6 debug launch sweep 2026-05-31 (per Strict-Fixer plan + user mandate "finish the remaining clusters until 0 then full test + Clean Host smoke + merge"); see 4-axis + di-container + ADR 0001 */);
        break;
      }
      case DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES: {
        let notes: NoteProps[];
        if (_.isUndefined(note)) {
          notes = await engine.findNotes({ excludeStub: true });
        } else {
          notes = [note];
        }
        const ds = new DoctorService();
        const uniqueCandidates = ds.getBrokenLinkDestinations(notes, engine);
        if (uniqueCandidates.length > 0) {
          // show preview before creating
          await this.showMissingNotePreview(uniqueCandidates);
          const options = ["proceed", "cancel"];
          const shouldProceed = await VSCodeUtils.showQuickPick(options, {
            placeHolder: "proceed",
            ignoreFocusOut: true,
          });
          if (shouldProceed !== "proceed") {
            window.showInformationMessage("cancelled");
            break;
          }
          window.showInformationMessage("creating missing links...");
          if (this.extension.fileWatcher) {
            this.extension.fileWatcher.pause = true;
          }
          await ds.executeDoctorActions({
            action: opts.action,
            candidates: notes,
            engine,
            exit: false,
          });
        } else {
          window.showInformationMessage(`There are no missing links!`);
        }
        ds.dispose();
        if (this.extension.fileWatcher) {
          this.extension.fileWatcher.pause = false;
        }
        break;
      }
      case DoctorActionsEnum.FIND_BROKEN_LINKS: {
        let notes;
        if (_.isUndefined(note)) {
          notes = await engine.findNotes({ excludeStub: true });
        } else {
          notes = [note];
        }
        const ds = new DoctorService();
        const out = await ds.executeDoctorActions({
          action: opts.action,
          candidates: notes,
          engine,
          exit: false,
          quiet: true,
        });
        ds.dispose();
        if (out.resp.length === 0) {
          window.showInformationMessage(`There are no broken links!`);
          break;
        }
        await this.showBrokenLinkPreview(out.resp, engine);
        break;
      }
      case DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS:
      case DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS: {
        const ds = new DoctorService();
        const out = await ds.executeDoctorActions({
          action: opts.action,
          engine,
        });

        if (out.error) {
          window.showErrorMessage(out.error.message);
        }

        if (out.resp) {
          const OPEN_CONFIG = "Open dendron.yml and Backup";
          const message =
            opts.action === DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS
              ? `Deprecated configs removed. Backup of dendron.yml created in ${out.resp.backupPath}`
              : `Missing defaults added. Backup of dendron.yml created in ${out.resp.backupPath}`;
          window
            .showInformationMessage(message, OPEN_CONFIG)
            .then(async (resp) => {
              if (resp === OPEN_CONFIG) {
                const configPath = DConfig.configPath(wsRoot);
                const configUri = Uri.file(configPath);
                await VSCodeUtils.openFileInEditor(configUri);

                const backupUri = Uri.file(out.resp.backupPath);
                await VSCodeUtils.openFileInEditor(backupUri, {
                  column: ViewColumn.Beside,
                });
              }
            });
          break;
        } else {
          // nothing happened.
          const message =
            opts.action === DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS
              ? "There are no deprecated configs. Exiting."
              : "There are no missing defaults. Exiting";
          window.showInformationMessage(message);
        }

        ds.dispose();
        break;
      }
      case DoctorActionsEnum.FIX_INVALID_FILENAMES: {
        const ds = new DoctorService();
        const notes = await engine.queryNotes({ qs: "*", originalQS: "*" });
        if (notes.length !== 0) {
          const notesById = NoteDictsUtils.createNotePropsByIdDict(notes);
          const notesByFname =
            NoteFnameDictUtils.createNotePropsByFnameDict(notesById);
          const noteDicts: NoteDicts = { notesById, notesByFname };
          const { canRename, cantRename, stats } = ds.findInvalidFileNames({
            notes,
            noteDicts,
          });

          extra = stats;
          let changes: NoteChangeEntry[] = [];
          if (canRename.length > 0 || cantRename.length > 0) {
            await this.showFixInvalidFileNamePreview({ canRename, cantRename });
            if (canRename.length > 0) {
              const options = ["proceed", "cancel"];
              const shouldProceed = await VSCodeUtils.showQuickPick(options, {
                placeHolder: "proceed",
                ignoreFocusOut: true,
              });
              if (shouldProceed !== "proceed") {
                window.showInformationMessage("cancelled");
                break;
              }
              window.showInformationMessage("Fixing invalid filenames...");
              changes = await ds.fixInvalidFileNames({
                canRename,
                engine,
              });
              const maybeReminder =
                cantRename.length > 0
                  ? " Don't forget to manually rename invalid notes that cannot be automatically fixed."
                  : "";
              window.showInformationMessage(
                `Invalid filenames fixed.${maybeReminder}`
              );
            }
          } else {
            window.showInformationMessage("There are no invalid filenames!");
          }
          ds.dispose();
          const changeCounts = extractNoteChangeEntryCounts(changes);
          extra = {
            ...extra,
            ...changeCounts,
          };
        } else {
          window.showErrorMessage("Doctor failed. Please reload and try again");
        }
        break;
      }
      default: {
        const candidates: NoteProps[] | undefined = _.isUndefined(note)
          ? undefined
          : [note];
        const ds = new DoctorService();
        await ds.executeDoctorActions({
          action: opts.action,
          candidates,
          engine,
          exit: false,
        } as any /* TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes (DoctorServiceOpts from engine-server); Batch 6 debug launch sweep 2026-05-31 (per Strict-Fixer plan + user mandate "finish the remaining clusters until 0 then full test + Clean Host smoke + merge"); see 4-axis + di-container + ADR 0001 */);
        ds.dispose();
      }
    }

    if (this.extension.fileWatcher) {
      this.extension.fileWatcher.pause = false;
    }

    if (shouldDoctorReloadWorkspaceAfterDoctorAction(opts.action)) {
      await this.reload();
      // Decorations don't auto-update here, I think because the contents of the
      // note haven't updated within VSCode yet. Regenerate the decorations, but
      // do so after a delay so that VSCode can update the file contents. Not a
      // perfect solution, but the simplest.
      delayedUpdateDecorations();
    }

    return { data: findings, extra };
  }
  async showResponse(findings: CommandOutput) {
    findings.data.forEach((f) => {
      window.showInformationMessage(`issue: ${f.issue}. fix: ${f.fix}`);
    });
    window.showInformationMessage(`Doctor finished checkup 🍭`);
  }
}
