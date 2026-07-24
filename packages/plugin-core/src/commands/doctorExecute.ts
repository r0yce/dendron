/**
 * DoctorCommand.execute action switch (modularized).
 */
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
} from "@dendronhq/common-all";
import {
  BackfillService,
  DoctorActionsEnum,
  DoctorService,
} from "@dendronhq/engine-server";
import { DConfig } from "@dendronhq/common-server";
import _ from "lodash";
import { Uri, ViewColumn, window } from "vscode";
import {
  INCOMPATIBLE_EXTENSIONS,
  KNOWN_KEYBINDING_CONFLICTS,
} from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { delayedUpdateDecorations } from "../features/windowDecorations";
import { KeybindingUtils } from "../KeybindingUtils";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import {
  PluginDoctorActionsEnum,
  shouldDoctorReloadWorkspaceAfterDoctorAction,
  shouldDoctorReloadWorkspaceBeforeDoctorAction,
} from "./doctorActions";
import { IncompatibleExtensionInstallStatus } from "./doctorPreviews";

type DoctorCommandOpts = {
  action: DoctorActionsEnum | PluginDoctorActionsEnum;
  scope: string;
  data?: {
    installStatus?: IncompatibleExtensionInstallStatus[];
    note?: NoteProps;
  };
};

type Finding = { issue: string; fix?: string };

export async function executeDoctorCommand(deps: {
  opts: DoctorCommandOpts;
  extension: IDendronExtension;
  logger: { info: (p: any) => void };
  reload: () => Promise<any>;
  showMissingNotePreview: (c: NoteProps[]) => Promise<void>;
  showBrokenLinkPreview: (b: any, e: DEngineClient) => Promise<void>;
  showIncompatibleExtensionPreview: (o: {
    installStatus: IncompatibleExtensionInstallStatus[];
  }) => Promise<any>;
  showFixInvalidFileNamePreview: (o: any) => Promise<void>;
}): Promise<{ data: Finding[]; extra: any }> {
  const {
    opts,
    extension,
    logger,
    reload,
    showMissingNotePreview,
    showBrokenLinkPreview,
    showIncompatibleExtensionPreview,
    showFixInvalidFileNamePreview,
  } = deps;

  const ctx = "DoctorCommand:execute";
  window.showInformationMessage("Calling the doctor.");
  const { wsRoot, config } = extension.getDWorkspace();
  const findings: Finding[] = [];
  let extra: any;
  if (_.isUndefined(wsRoot)) {
    throw new DendronError({ message: "rootDir undefined" });
  }
  if (_.isUndefined(config)) {
    throw new DendronError({ message: "no config found" });
  }

  if (extension.fileWatcher) {
    extension.fileWatcher.pause = true;
  }
  let note;
  if (opts.data?.note) {
    note = opts.data.note;
  } else {
    const document = VSCodeUtils.getActiveTextEditor()?.document;
    if (
      isNotUndefined(document) &&
      isNotUndefined(await extension.wsUtils.getNoteFromDocument(document))
    ) {
      await document.save();
    }
    logger.info({ ctx, msg: "pre:Reload" });

    if (shouldDoctorReloadWorkspaceBeforeDoctorAction(opts.action)) {
      await reload();
    }

    if (opts.scope === "file") {
      const document = VSCodeUtils.getActiveTextEditor()?.document;
      if (_.isUndefined(document)) {
        throw new DendronError({ message: "No note open." });
      }
      note = await extension.wsUtils.getNoteFromDocument(document);
    }
  }

  const engine = extension.getEngine();

  switch (opts.action) {
    case PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS: {
      const installStatus =
        opts.data?.installStatus ||
        INCOMPATIBLE_EXTENSIONS.map((ext) => ({
          id: ext,
          installed: VSCodeUtils.isExtensionInstalled(ext),
        }));
      await showIncompatibleExtensionPreview({ installStatus });
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
        overwriteFields: ["id"],
      } as any);
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
        await showMissingNotePreview(uniqueCandidates);
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
        if (extension.fileWatcher) {
          extension.fileWatcher.pause = true;
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
      if (extension.fileWatcher) {
        extension.fileWatcher.pause = false;
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
      await showBrokenLinkPreview(out.resp, engine);
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
          await showFixInvalidFileNamePreview({ canRename, cantRename });
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
              `Invalid filenames fixed.${maybeReminder}`,
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
      } as any);
      ds.dispose();
    }
  }

  if (extension.fileWatcher) {
    extension.fileWatcher.pause = false;
  }

  if (shouldDoctorReloadWorkspaceAfterDoctorAction(opts.action)) {
    await reload();
    delayedUpdateDecorations();
  }

  return { data: findings, extra };
}
