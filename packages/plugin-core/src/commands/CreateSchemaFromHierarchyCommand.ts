/**
 * Create schema from note hierarchy command.
 */
import {
  DVault,
  NotePropsMeta,
  NoteUtils,
  SchemaUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import * as fs from "fs";
import * as _ from "lodash";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { PluginVaultUtils } from "../pluginVaultUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";
import {
  HierarchyLevel,
  SchemaCandidate,
  StopReason,
} from "./hierarchySchemaModels";
import { makeHierarchySchemaBody } from "./hierarchySchemaCreator";
import { UserQueries } from "./schemaHierarchyUserQueries";

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
export { UserQueries } from "./schemaHierarchyUserQueries";

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

function getSchemaUri(vault: DVault, schemaName: string) {
  const vaultPath = vault2Path({
    vault,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  return Uri.file(SchemaUtils.getPath({ root: vaultPath, fname: schemaName }));
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
    const hierLvlOpts =
      await UserQueries.promptUserToSelectHierarchyLevel(currDocumentFSPath);
    if (hierLvlOpts.hierarchyLevel === undefined) {
      // User must have cancelled the command or the note was deemed not valid for
      // schema from hierarchy creation.
      return { isHappy: false, stopReason: hierLvlOpts.stopReason };
    }

    const candidates = await this.getHierarchyCandidates(
      hierLvlOpts.hierarchyLevel,
    );
    const patternsOpts =
      await UserQueries.promptUserToPickPatternsFromCandidates(candidates);
    if (_.isUndefined(patternsOpts.pickedCandidates)) {
      return { isHappy: false, stopReason: patternsOpts.stopReason };
    }

    const schemaName = await UserQueries.promptUserForSchemaFileName(
      hierLvlOpts.hierarchyLevel,
      vault,
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
    hierarchyLevel: HierarchyLevel,
  ): Promise<SchemaCandidate[]> {
    const { engine } = ExtensionProvider.getDWorkspace();
    const engineNotes = await engine.findNotesMeta({ excludeStub: false });
    const noteCandidates = _.filter(engineNotes, (n) =>
      hierarchyLevel.isCandidateNote(n.fname),
    );

    const candidates: SchemaCandidate[] = this.formatSchemaCandidates(
      noteCandidates,
      hierarchyLevel,
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
    hierarchyLevel: HierarchyLevel,
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
