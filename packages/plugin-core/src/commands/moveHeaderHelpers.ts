/**
 * Pure / free helpers for MoveHeaderCommand (anchors, content slice, dest prep).
 */
import {
  DendronASTDest,
  DVault,
  getSlugger,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { Anchor, AnchorUtils, MDUtilsV5, RemarkUtils } from "@dendronhq/unified";
import _ from "lodash";
import { Node } from "@dendronhq/engine-server";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";

export function getMoveHeaderProc(engine: IEngineAPIService, note: NoteProps) {
  return MDUtilsV5.procRemarkFull({
    noteToRender: note,
    fname: note.fname,
    vault: note.vault,
    dest: DendronASTDest.MD_DENDRON,
    config: DConfig.readConfigSync(engine.wsRoot),
  });
}

/**
 * Given origin before/after content, return anchor names that disappeared.
 */
export function findAnchorNamesToUpdate(
  originDeepCopy: NoteProps,
  modifiedOriginContent: string
): string[] {
  const anchorsBefore = RemarkUtils.findAnchors(originDeepCopy.body);
  const anchorsAfter = RemarkUtils.findAnchors(modifiedOriginContent);
  const anchorsToUpdate = _.differenceWith(
    anchorsBefore,
    anchorsAfter,
    RemarkUtils.hasIdenticalChildren
  );
  return _.map(anchorsToUpdate, (anchor: Anchor) => {
    const slugger = getSlugger();
    const payload = AnchorUtils.anchorNode2anchor(anchor, slugger);
    return payload![0];
  });
}

/**
 * Slice moved block text from origin body and append to destination.
 */
export async function appendHeaderToDestination(opts: {
  engine: IEngineAPIService;
  dest: NoteProps;
  origin: NoteProps;
  nodesToMove: Node[];
}): Promise<void> {
  const { engine, dest, origin, nodesToMove } = opts;
  const startOffset = nodesToMove[0]!.position?.start.offset;
  const endOffset = _.last(nodesToMove)!.position?.end.offset;

  const originBody = origin.body;
  const destContentToAppend = originBody.slice(startOffset, endOffset);

  dest.body = `${dest.body}\n\n${destContentToAppend}`;
  await engine.writeNote(dest);
}

/**
 * Resolve destination note from lookup selection (create-new aware).
 */
export async function prepareMoveHeaderDestination(opts: {
  engine: IEngineAPIService;
  quickpick: DendronQuickPickerV2;
  selectedItems: readonly NoteQuickInput[];
}): Promise<NoteProps | undefined> {
  const { engine, quickpick, selectedItems } = opts;
  const vault =
    (quickpick.vault as DVault) || PickerUtilsV2.getVaultForOpenEditor();
  if (_.isUndefined(selectedItems)) {
    return undefined;
  }
  const selected = selectedItems[0]!;
  const isCreateNew = PickerUtilsV2.isCreateNewNotePicked(selected);
  if (isCreateNew) {
    const fname = selected.fname;
    const maybeNote = (await engine.findNotes({ fname, vault }))[0]!;
    if (_.isUndefined(maybeNote)) {
      return NoteUtils.create({ fname, vault });
    }
    return maybeNote;
  }
  return selected as NoteProps;
}

/**
 * Remove moved block range from origin body string.
 */
export function removeHeaderBlockFromOriginBody(opts: {
  originBody: string;
  nodesToMove: Node[];
}): string {
  const { originBody, nodesToMove } = opts;
  const startOffset = nodesToMove[0]!.position?.start.offset ?? 0;
  const endOffset = _.last(nodesToMove)!.position?.end.offset ?? originBody.length;
  return originBody.slice(0, startOffset) + originBody.slice(endOffset);
}
