/**
 * Helpers for MoveNoteCommand multi-move planning and preview.
 */
import {
  DendronError,
  DEngineClient,
  NoteChangeEntry,
  RenameNoteOpts,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { NoteLookupProviderSuccessResp } from "../components/lookup/LookupProviderV3Interface";
import { OldNewLocation } from "../components/lookup/utils";
import { UNKNOWN_ERROR_MSG } from "../logger";

export function isMoveNecessary(move: RenameNoteOpts): boolean {
  return (
    move.oldLoc.vaultName !== move.newLoc.vaultName ||
    move.oldLoc.fname.toLowerCase() !== move.newLoc.fname.toLowerCase()
  );
}

export function isMultiMove(moves: RenameNoteOpts[]): boolean {
  return moves.length > 1;
}

export function getDesiredMoves(
  data: NoteLookupProviderSuccessResp<OldNewLocation>,
): RenameNoteOpts[] {
  if (data.selectedItems.length === 1) {
    return data.onAcceptHookResp;
  }
  if (data.selectedItems.length > 1) {
    const newVaultName = data.onAcceptHookResp[0]!.newLoc.vaultName;
    return data.selectedItems.map((item) => {
      return {
        oldLoc: {
          fname: item.fname,
          vaultName: VaultUtils.getName(item.vault),
        },
        newLoc: {
          fname: item.fname,
          vaultName: newVaultName,
        },
      };
    });
  }
  throw new DendronError({
    message: `MoveNoteCommand: No items are selected. ${UNKNOWN_ERROR_MSG}`,
  });
}

export async function moveNotesSequential(
  engine: DEngineClient,
  moves: RenameNoteOpts[],
): Promise<NoteChangeEntry[]> {
  const necessaryMoves = moves.filter((move) => isMoveNecessary(move));
  const allChanges: NoteChangeEntry[] = [];
  for (const move of necessaryMoves) {
    // eslint-disable-next-line no-await-in-loop
    const changes = await engine.renameNote(move);
    allChanges.push(...(changes.data as NoteChangeEntry[]));
  }
  return allChanges;
}

export function buildMultiMovePreviewMarkdown(moves: RenameNoteOpts[]): string {
  const destVault = moves[0]!.newLoc.vaultName;
  const contentLines = [
    "# Move notes preview",
    "",
    `## The following files will be moved to vault: ${destVault}`,
  ];
  const necessaryMoves = moves.filter((m) => isMoveNecessary(m));
  const movesBySourceVaultName = _.groupBy(necessaryMoves, "oldLoc.vaultName");

  _.forEach(
    movesBySourceVaultName,
    (movesForVault: RenameNoteOpts[], sourceVault: string) => {
      contentLines.push(`| From vault: ${sourceVault} to ${destVault} |`);
      contentLines.push(`|------------------------|`);
      movesForVault.forEach((move) => {
        contentLines.push(`| ${path.basename(move.oldLoc.fname)} |`);
      });
      contentLines.push("---");
    },
  );

  const sameVaultMoves = moves.filter((m) => !isMoveNecessary(m));
  if (sameVaultMoves.length) {
    contentLines.push(`|The following are already in vault: ${destVault}|`);
    contentLines.push(`|-----------------------------------------------|`);
    sameVaultMoves.forEach((m) => {
      contentLines.push(`| ${path.basename(m.oldLoc.fname)} |`);
    });
  }
  return contentLines.join("\n");
}
