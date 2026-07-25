/**
 * User interaction prompts for CreateSchemaFromHierarchyCommand.
 */
import { DVault } from "@dendronhq/common-all";
import * as fs from "fs";
import * as _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { PluginSchemaUtils } from "../pluginSchemaUtils";
import { VSCodeUtils } from "../vsCodeUtils";
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
import { SchemaModuleProps, SchemaUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";

type HierarchyLevelRes = {
  hierarchyLevel?: HierarchyLevel;
  stopReason?: StopReason;
};
type PatternsFromCandidateRes = {
  pickedCandidates?: readonly SchemaCandidate[] | undefined;
  stopReason?: StopReason | undefined;
};

function getUriFromSchema(schema: SchemaModuleProps) {
  const vaultPath = vault2Path({
    vault: schema.vault,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  return Uri.file(
    SchemaUtils.getPath({ root: vaultPath, fname: schema.fname }),
  );
}

function getSchemaUri(vault: DVault, schemaName: string) {
  const vaultPath = vault2Path({
    vault,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  return Uri.file(SchemaUtils.getPath({ root: vaultPath, fname: schemaName }));
}

/**
 * Encapsulates methods that are responsible for user interaction when
 * asking user for input data.
 * */
export class UserQueries {
  static async promptUserForSchemaFileName(
    hierarchyLevel: HierarchyLevel,
    vault: DVault,
  ): Promise<string | undefined> {
    let schemaName: string | undefined;
    let alreadyExists: boolean;

    do {
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
          `Schema with name '${schemaName}' already exists. Please choose a different name.`,
        );
      }
    } while (alreadyExists);

    return schemaName;
  }

  static async promptUserToSelectHierarchyLevel(
    currDocFsPath: string,
  ): Promise<HierarchyLevelRes> {
    const hierarchy = new Hierarchy(path.basename(currDocFsPath, ".md"));

    if (hierarchy.depth() <= 1) {
      // We require some depth to the hierarchy to be able to choose a variance
      // pattern within in it. More info within Hierarchy object.
      await vscode.window.showErrorMessage(
        `Pick a note with note depth greater than 1.`,
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
        msgGoToSchema,
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
    labeledCandidates: SchemaCandidate[],
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
            currSelected,
          );
        } else if (hasSelected(prevSelected, currSelected)) {
          quickPick.selectedItems = determineAfterSelect(
            prevSelected,
            currSelected,
            labeledCandidates,
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
            `Must select at least one pattern for schema creation.`,
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

export { SchemaCandidate };
