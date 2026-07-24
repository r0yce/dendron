/**
 * Accept Create New (without explicit template pick) from note lookup.
 */
import {
  EngagementEvents,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";
import { TemplateUtils } from "@dendronhq/common-server";
import { window } from "vscode";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { toCSNoteProps, toDEngineClient } from "../utils/typeBridge";
import { WSUtilsV2 } from "../WSUtilsV2";
import { resolveVaultForNewNote } from "./noteLookupVault";
import { prepareStubLookupItem } from "./noteLookupPrepareStub";
import { NoteLookupAcceptReturn } from "./noteLookupAcceptTypes";

export async function acceptNewLookupItem(opts: {
  item: NoteQuickInput;
  picker: DendronQuickPickerV2;
  fname: string;
  /** Analytics source (usually command key). */
  analyticsSource: string;
}): Promise<NoteLookupAcceptReturn | undefined> {
  const ctx = "acceptNewLookupItem";
  const { item, picker, fname, analyticsSource } = opts;
  const engine = ExtensionProvider.getEngine();
  let nodeNew: NoteProps;

  if (item.stub) {
    Logger.info({ ctx, msg: "create stub" });
    nodeNew = await prepareStubLookupItem({ item, engine });
  } else {
    const vault = await resolveVaultForNewNote({ fname, picker });
    if (vault === undefined) {
      // User cancelled vault selection.
      return;
    }
    nodeNew = await NoteUtils.createWithSchema({
      noteOpts: {
        fname,
        vault,
        title: item.title,
        traits: item.traits,
      },
      engine,
    });
    if (picker.selectionProcessFunc !== undefined) {
      nodeNew = (await picker.selectionProcessFunc(nodeNew)) as NoteProps;
    }
  }

  const templateAppliedResp = await TemplateUtils.findAndApplyTemplate({
    note: toCSNoteProps(nodeNew),
    engine: toDEngineClient(engine),
    pickNote: (async (choices: NoteProps[]) => {
      const resp = await WSUtilsV2.instance().promptForNoteAsync({
        notes: choices,
        quickpickTitle:
          "Select which template to apply or press [ESC] to not apply a template",
        nonStubOnly: true,
      });
      if (resp?.data) {
        return { data: toCSNoteProps(resp.data) };
      }
      return resp;
    }) as Parameters<typeof TemplateUtils.findAndApplyTemplate>[0]["pickNote"],
  });

  if (templateAppliedResp.error) {
    window.showWarningMessage(
      `Warning: Problem with ${nodeNew.fname} schema. ${templateAppliedResp.error.message}`,
    );
  } else if (templateAppliedResp.data) {
    AnalyticsUtils.track(EngagementEvents.TemplateApplied, {
      source: analyticsSource,
      ...TemplateUtils.genTrackPayload(toCSNoteProps(nodeNew)),
    });
  }

  if (picker.onCreate) {
    const nodeModified = await picker.onCreate(nodeNew);
    if (nodeModified) nodeNew = nodeModified;
  }
  const resp = await engine.writeNote(nodeNew);
  if (resp.error) {
    Logger.error({ ctx, error: resp.error });
    return;
  }

  const uri = NoteUtils.getURI({
    note: nodeNew,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  return { uri, node: nodeNew, resp };
}
