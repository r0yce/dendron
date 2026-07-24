/**
 * Validate editor selection and locate the target header for MoveHeader.
 */
import {
  DendronError,
  ERROR_SEVERITY,
  NoteProps,
} from "@dendronhq/common-all";
import { Heading } from "@dendronhq/engine-server";
import {
  DendronASTNode,
  DendronASTTypes,
  MdastUtils,
  Processor,
} from "@dendronhq/unified";
import _ from "lodash";
import { visit } from "unist-util-visit";
import { ExtensionProvider } from "../ExtensionProvider";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { VSCodeUtils } from "../vsCodeUtils";
import { getMoveHeaderProc } from "./moveHeaderHelpers";

export const moveHeaderErrors = {
  headerNotSelected: new DendronError({
    message: "You must first select the header you want to move.",
    severity: ERROR_SEVERITY.MINOR,
  }),
  noActiveNote: new DendronError({
    message: "No note open.",
    severity: ERROR_SEVERITY.MINOR,
  }),
  noNodesToMove: new DendronError({
    message:
      "There are no nodes to move. If your selection is valid, try again after reloading VSCode.",
    severity: ERROR_SEVERITY.MINOR,
  }),
  noDest: new DendronError({
    message: "No destination provided.",
    severity: ERROR_SEVERITY.MINOR,
  }),
};

export async function validateAndProcessMoveHeaderInput(opts: {
  engine: IEngineAPIService;
}): Promise<{
  proc: Processor;
  origin: NoteProps;
  targetHeader: Heading;
  targetHeaderIndex: number;
}> {
  const { engine } = opts;
  const { editor, selection } = VSCodeUtils.getSelection();

  if (!editor) throw moveHeaderErrors.noActiveNote;
  if (!selection) throw moveHeaderErrors.headerNotSelected;

  const line = editor.document.lineAt(selection.start.line).text;
  const maybeNote = await ExtensionProvider.getWSUtils().getNoteFromDocument(
    editor.document
  );
  if (!maybeNote) {
    throw moveHeaderErrors.noActiveNote;
  }

  const proc = getMoveHeaderProc(engine, maybeNote);
  const bodyAST: DendronASTNode = proc.parse(maybeNote.body) as DendronASTNode;
  const parsedLine = proc.parse(line);
  let targetHeader: Heading | undefined;
  let targetIndex: number | undefined;
  visit(parsedLine, [DendronASTTypes.HEADING], (heading: Heading, index) => {
    targetHeader = heading;
    targetIndex = index;
    return false;
  });
  if (!targetHeader || _.isUndefined(targetIndex)) {
    throw moveHeaderErrors.headerNotSelected;
  }

  const resp = MdastUtils.findHeader({
    nodes: bodyAST.children,
    match: targetHeader as Parameters<
      typeof MdastUtils.findHeader
    >[0]["match"],
  });
  if (!resp) {
    throw Error("did not find header");
  }
  return {
    proc,
    origin: maybeNote,
    targetHeader,
    targetHeaderIndex: resp.index,
  };
}
