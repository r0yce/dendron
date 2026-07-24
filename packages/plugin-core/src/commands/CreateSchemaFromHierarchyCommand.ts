import {
  DVault,
  NotePropsMeta,
  NoteUtils,
  SchemaModuleProps,
  SchemaUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import * as fs from "fs";
import * as _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { PluginSchemaUtils } from "../pluginSchemaUtils";
import { PluginVaultUtils } from "../pluginVaultUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import {
  Hierarchy,
  HierarchyLevel,
  SchemaCandidate,
  StopReason,
  determineAfterSelect,
  determineAfterUnselect,
  hasSelected,
  hasUnselected,
} from "./hierarchySchemaModels";
import { makeHierarchySchemaBody } from "./hierarchySchemaCreator";

export {
  Hierarchy,
  HierarchyLevel,
  StopReason,
  createCandidatesMapByFname,
  isDescendentOf,
  determineAfterSelect,
  determineAfterUnselect,
  hasSelected,
  hasUnselected,
  findCheckedItem,
  findUncheckedItem,
} from "./hierarchySchemaModels";
export type { SchemaCandidate } from "./hierarchySchemaModels";

type CommandOpts = {
  candidates?: readonly SchemaCandidate[] | undefined;
  schemaName?: string | undefined;
  hierarchyLevel?: HierarchyLevel | undefined;
  uri?: Uri | undefined;
  isHappy: boolean;
  stopReason?: StopReason | undefined;
};

type CommandOutput = {
  successfullyCreated: boolean;
};

function getUriFromSchema(schema: SchemaModuleProps) {
  const vaultPath = vault2Path({
    vault: schema.vault,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  return Uri.file(
    SchemaUtils.getPath({ root: vaultPath, fname: schema.fname })
  );
}

function getSchemaUri(vault: DVault, schemaName: string) {
  const vaultPath = vault2Path({
    vault,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  return Uri.file(
    SchemaUtils.getPath({ root: vaultPath, fname: schemaName })
  );
}

type HierarchyLevelRes = {
  hierarchyLevel?: HierarchyLevel;
  stopReason?: StopReason;
};
type PatternsFromCandidateRes = {
  pickedCandidates?: readonly SchemaCandidate[] | undefined;
  stopReason?: StopReason | undefined;
};

/**
 * Encapsulates methods that are responsible for user interaction when
 * asking user for input data.
 * */
export class UserQueries {
  static async promptUserForSchemaFileName(
    hierarchyLevel: HierarchyLevel,
    vault: DVault
  ): Promise<string | undefined> {
    let alreadyExists = false;
    let schemaName: string | undefined;

    do {
      // eslint-disable-next-line no-await-in-loop
      schemaName = await VSCodeUtils.showInputBox({
        value: hierarchyLevel.getDefaultSchemaName(),
      });

      if (!schemaName) {
        // Cancelled.
        return schemaName;
      }

      alreadyExists = fs.existsSync(getSchemaUri(vault, schemaName).fsPath);
      if (alreadyExists) {
        vscode.window.showInformationMessage(
          `Schema with name '${schemaName}' already exists. Please choose a different name.`
        );
      }
    } while (alreadyExists);

    return schemaName;
  }

  static async promptUserToSelectHierarchyLevel(
    currDocFsPath: string
  ): Promise<HierarchyLevelRes> {
    const hierarchy = new Hierarchy(path.basename(currDocFsPath, ".md"));

    if (hierarchy.depth() <= 1) {
      // We require some depth to the hierarchy to be able to choose a variance
      // pattern within in it. More info within Hierarchy object.
      await vscode.window.showErrorMessage(
        `Pick a note with note depth greater than 1.`
      );

      return { stopReason: StopReason.NOTE_DID_NOT_HAVE_REQUIRED_DEPTH };
    }

    const topId = hierarchy.topId()!;
    if (await PluginSchemaUtils.doesSchemaExist(topId)) {
      // To avoid unpredictable conflicts of schemas: for now we will not allow
      // creation schemas for hierarchies that already have existing top
      // level schema id. Instead we will pop up error message with navigation
      // action to the existing schema.
      const msgGoToSchema = "Go to schema";
      const action = await vscode.window.showErrorMessage(
        `Schema with top level id: '${topId}' already exists.`,
        msgGoToSchema
      );
      if (action === msgGoToSchema) {
        const schema = await PluginSchemaUtils.getSchema(topId);
        if (schema.data) {
          await VSCodeUtils.openFileInEditor(getUriFromSchema(schema.data));
        }
      }

      return { stopReason: StopReason.SCHEMA_WITH_TOP_ID_ALREADY_EXISTS };
    }

    const hierarchyLevel: HierarchyLevel | undefined =
      await VSCodeUtils.showQuickPick(hierarchy.getSchemaebleLevels(), {
        title: "Select hierarchy level that will vary within note hierarchies.",
      });

    if (_.isUndefined(hierarchyLevel)) {
      return { stopReason: StopReason.DID_NOT_PICK_HIERARCHY_LEVEL };
    } else {
      return { hierarchyLevel };
    }
  }

  static promptUserToPickPatternsFromCandidates(
    labeledCandidates: SchemaCandidate[]
  ): Promise<PatternsFromCandidateRes> {
    let hasResolved = false;
    return new Promise((resolve) => {
      // There are limitations with .showQuickPick() for our use case (like checking/unchecking items)
      // hence we are using lower level createQuickPick().
      const quickPick = vscode.window.createQuickPick<SchemaCandidate>();
      quickPick.canSelectMany = true;
      quickPick.items = labeledCandidates;
      quickPick.selectedItems = quickPick.items;

      // By the time we get to onDidChangeSelection function quickPick.selectedItems
      // is already changed, hence we will keep our own copy of what was previously selected.
      let prevSelected: readonly SchemaCandidate[] = quickPick.selectedItems;

      quickPick.onDidChangeSelection(() => {
        const currSelected = quickPick.selectedItems;

        if (hasUnselected(prevSelected, currSelected)) {
          quickPick.selectedItems = determineAfterUnselect(
            prevSelected,
            currSelected
          );
        } else if (hasSelected(prevSelected, currSelected)) {
          quickPick.selectedItems = determineAfterSelect(
            prevSelected,
            currSelected,
            labeledCandidates
          );
        }

        prevSelected = quickPick.selectedItems;
      });
      quickPick.onDidHide(() => {
        if (!hasResolved) {
          resolve({ stopReason: StopReason.CANCELLED_PATTERN_SELECTION });
          hasResolved = true;
        }
        quickPick.dispose();
      });
      quickPick.onDidAccept(() => {
        if (quickPick.selectedItems.length === 0) {
          vscode.window.showErrorMessage(
            `Must select at least one pattern for schema creation.`
          );

          resolve({ stopReason: StopReason.UNSELECTED_ALL_PATTERNS });
        } else {
          resolve({ pickedCandidates: quickPick.selectedItems });
        }

        hasResolved = true;
        quickPick.hide();
      });
      quickPick.show();
    });
  }

  // Pure selection helpers re-exported via hierarchySchemaModels for tests.
  static determineAfterSelect = determineAfterSelect;
  static determineAfterUnselect = determineAfterUnselect;
  static hasSelected = hasSelected;
  static hasUnselected = hasUnselected;
}

/**
 * Responsible for forming the schema body from the hierarchical files that user chose. */
export class SchemaCreator {
  static makeSchemaBody = makeHierarchySchemaBody;
}

export class CreateSchemaFromHierarchyCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_SCHEMA_FROM_HIERARCHY.key;

  async sanityCheck() {
    const activeTextEditor = VSCodeUtils.getActiveTextEditor();

    if (
      _.isUndefined(activeTextEditor) ||
      !NoteUtils.isNote(activeTextEditor.document.uri)
    ) {
      return "No note document open. Must have note document open for Create Schema from Hierarchy command.";
    }

    return;
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const activeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (!activeTextEditor) {
      // Error message will be displayed from the sanityCheck function.
      return;
    }

    const currDocumentFSPath = activeTextEditor.document.uri.fsPath;
    const vault = PluginVaultUtils.getVaultByNotePath({
      fsPath: currDocumentFSPath,
    });
    const hierLvlOpts = await UserQueries.promptUserToSelectHierarchyLevel(
      currDocumentFSPath
    );
    if (hierLvlOpts.hierarchyLevel === undefined) {
      // User must have cancelled the command or the note was deemed not valid for
      // schema from hierarchy creation.
      return { isHappy: false, stopReason: hierLvlOpts.stopReason };
    }

    const candidates = await this.getHierarchyCandidates(
      hierLvlOpts.hierarchyLevel
    );
    const patternsOpts =
      await UserQueries.promptUserToPickPatternsFromCandidates(candidates);
    if (_.isUndefined(patternsOpts.pickedCandidates)) {
      return { isHappy: false, stopReason: patternsOpts.stopReason };
    }

    const schemaName = await UserQueries.promptUserForSchemaFileName(
      hierLvlOpts.hierarchyLevel,
      vault
    );
    if (schemaName === undefined || schemaName.length === 0) {
      // User must have cancelled the command, get out.
      return {
        isHappy: false,
        stopReason: StopReason.DID_NOT_PICK_SCHEMA_FILE_NAME,
      };
    }

    const uri = getSchemaUri(vault, schemaName);

    const commandOpts: CommandOpts = {
      candidates: patternsOpts.pickedCandidates,
      schemaName,
      hierarchyLevel: hierLvlOpts.hierarchyLevel,
      uri,
      isHappy: true,
    };
    return commandOpts;
  }

  private async getHierarchyCandidates(
    hierarchyLevel: HierarchyLevel
  ): Promise<SchemaCandidate[]> {
    const { engine } = ExtensionProvider.getDWorkspace();
    const engineNotes = await engine.findNotesMeta({ excludeStub: false });
    const noteCandidates = _.filter(engineNotes, (n) =>
      hierarchyLevel.isCandidateNote(n.fname)
    );

    const candidates: SchemaCandidate[] = this.formatSchemaCandidates(
      noteCandidates,
      hierarchyLevel
    );

    return this.filterDistinctLabel(candidates);
  }

  private filterDistinctLabel(candidates: SchemaCandidate[]) {
    const distinct: SchemaCandidate[] = [];
    new Map(candidates.map((cand) => [cand.label, cand])).forEach((value) => {
      distinct.push(value);
    });

    return distinct;
  }

  formatSchemaCandidates(
    noteCandidates: NotePropsMeta[],
    hierarchyLevel: HierarchyLevel
  ): SchemaCandidate[] {
    return noteCandidates
      .map((note) => {
        const tokens = note.fname.split(".");

        const patternStr = [
          ...tokens.slice(0, hierarchyLevel.idx),
          "*",
          ...tokens.slice(hierarchyLevel.idx + 1),
        ].join(".");

        return {
          label: patternStr,
          detail: `Will match notes like ${note.fname}`,
          note,
        };
      })
      .sort((a, b) => {
        if (a.note.fname === b.note.fname) {
          return 0;
        }
        return a.note.fname < b.note.fname ? -1 : 1;
      });
  }

  async execute({
    candidates,
    hierarchyLevel,
    uri,
    isHappy,
  }: CommandOpts): Promise<CommandOutput> {
    if (!isHappy) {
      return { successfullyCreated: false };
    }

    const schemaBody = SchemaCreator.makeSchemaBody({
      candidates: candidates!,
      hierarchyLevel: hierarchyLevel!,
    });

    fs.writeFileSync(uri!.fsPath, schemaBody);

    await ExtensionProvider.getExtension().schemaSyncService.saveSchema({
      uri: uri!,
      isBrandNewFile: true,
    });

    await VSCodeUtils.openFileInEditor(uri!);
    return { successfullyCreated: true };
  }

  addAnalyticsPayload(opts?: CommandOpts, out?: CommandOutput): any {
    if (out && out.successfullyCreated) {
      return { successfullyCreated: true };
    } else if (opts && opts.stopReason) {
      return {
        stopReason: opts.stopReason,
        successfullyCreated: false,
      };
    } else {
      return { successfullyCreated: false };
    }
  }
}
