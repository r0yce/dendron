/**
 * Accept Create New with Template from note lookup.
 */
import { NoteProps, NoteQuickInput, NoteUtils } from "@dendronhq/common-all";
import { TemplateUtils } from "@dendronhq/common-server";
import { window } from "vscode";
import { CREATE_NEW_LABEL } from "../components/lookup/constants";
import { QuickPickTemplateSelector } from "../components/lookup/QuickPickTemplateSelector";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { toCSNoteProps, toDEngineClient } from "../utils/typeBridge";
import { shouldRunSelection2LinkOnTemplateCreate } from "./noteLookupAcceptHelpers";
import { NoteLookupAcceptReturn } from "./noteLookupAcceptTypes";
import { resolveVaultForNewNote } from "./noteLookupVault";

/**
 * Prompt for a template note; reject the Create New sentinel.
 */
export async function pickTemplateForNewNote(opts: {
  logger:
    | typeof Logger
    | { error: Function; info?: Function; debug?: Function };
}): Promise<NoteProps | undefined> {
  const selector = new QuickPickTemplateSelector();
  const templateNote = await selector.getTemplate({
    logger: opts.logger as any,
    providerId: "createNewWithTemplate",
  });

  // note lookup provider treats empty selection as create-new; block that here.
  if (templateNote && templateNote.id === CREATE_NEW_LABEL) {
    return;
  }
  return templateNote;
}

export async function acceptNewWithTemplateLookupItem(opts: {
  item: NoteQuickInput;
  picker: DendronQuickPickerV2;
  fname: string;
  logger: typeof Logger | { error: Function };
}): Promise<NoteLookupAcceptReturn | undefined> {
  const ctx = "acceptNewWithTemplateLookupItem";
  const { item, picker, fname, logger } = opts;
  const engine = ExtensionProvider.getEngine();
  const vault = await resolveVaultForNewNote({ fname, picker });
  if (vault === undefined) {
    return;
  }
  let nodeNew: NoteProps = NoteUtils.create({
    fname,
    vault,
    title: item.title,
  });
  const templateNote = await pickTemplateForNewNote({ logger });
  if (templateNote) {
    TemplateUtils.applyTemplate({
      templateNote: toCSNoteProps(templateNote),
      targetNote: toCSNoteProps(nodeNew),
      engine: toDEngineClient(engine),
    });
  } else {
    window.showInformationMessage(
      `No template selected. Cancelling note creation.`,
    );
    return;
  }

  if (shouldRunSelection2LinkOnTemplateCreate(picker)) {
    nodeNew = (await picker.selectionProcessFunc!(nodeNew)) as NoteProps;
  }
  const resp = await engine.writeNote(nodeNew);
  if (resp.error) {
    Logger.error({ ctx, error: resp.error });
    return;
  }

  const uri = NoteUtils.getURI({
    note: nodeNew,
    wsRoot: engine.wsRoot,
  });
  return { uri, node: nodeNew, resp };
}
