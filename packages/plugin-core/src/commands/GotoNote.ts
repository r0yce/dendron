import {
  assertUnreachable,
  BacklinkUtils,
  DNoteAnchorBasic,
  getSlugger,
  InvalidFilenameReason,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
} from "@dendronhq/common-all";
import { FileExtensionUtils, TemplateUtils } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Position, Selection, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { getAnalyticsPayload } from "../utils/analytics";
import { PluginFileUtils } from "../utils/files";
import { maybeSendMeetingNoteTelemetry } from "../utils/MeetingTelemHelper";
import { toCSNoteProps, toDEngineClient } from "../utils/typeBridge";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { IWSUtilsV2 } from "../WSUtilsV2Interface";
import { BasicCommand } from "./base";
import {
  GotoFileType,
  GoToNoteCommandOpts,
  GoToNoteCommandOutput,
  TargetKind,
} from "./GoToNoteInterface";
import { processGotoNoteInputs } from "./gotoNoteProcessInputs";

export const findAnchorPos = (opts: {
  anchor: DNoteAnchorBasic;
  note: NotePropsMeta;
}): Position => {
  const { anchor: findAnchor, note } = opts;
  let key: string;
  switch (findAnchor.type) {
    case "line":
      return new Position(findAnchor.line - 1, 0);
    case "block":
      key = `^${findAnchor.value}`;
      break;
    case "header":
      key = getSlugger().slug(findAnchor.value);
      break;
    default:
      assertUnreachable(findAnchor);
  }

  const found = note.anchors[key];

  if (_.isUndefined(found)) return new Position(0, 0);
  return new Position(found.line, found.column);
};

/**
 * Open or create a note. See {@link GotoNoteCommand.execute} for details
 */
export class GotoNoteCommand extends BasicCommand<
  GoToNoteCommandOpts,
  GoToNoteCommandOutput
> {
  key = DENDRON_COMMANDS.GOTO_NOTE.key;
  private extension: IDendronExtension;
  private wsUtils: IWSUtilsV2;

  constructor(extension: IDendronExtension) {
    super();
    this.extension = extension;
    this.wsUtils = extension.wsUtils;
  }

  private async processInputs(opts: GoToNoteCommandOpts) {
    return processGotoNoteInputs({
      cmdOpts: opts,
      extension: this.extension,
      wsUtils: this.wsUtils,
    });
  }

  /**
   *
   * Warning about `opts`! If `opts.qs` is provided but `opts.vault` is empty,
   * it will default to the current vault. If `opts.qs` is not provided, it will
   * read the selection from the current document as a link to get it. If both
   * `opts.qs` and `opts.vault` is empty, both will be read from the selected link.
   *
   * @param opts.qs - query string. should correspond to {@link NoteProps.fname}
   * @param opts.vault - {@link DVault} for note
   * @param opts.anchor - a {@link DNoteAnchor} to navigate to
   * @returns
   */
  async execute(opts: GoToNoteCommandOpts): Promise<GoToNoteCommandOutput> {
    const ctx = "GotoNoteCommand";
    this.L.info({ ctx, opts, msg: "enter" });
    const { overrides } = opts;
    const client = this.extension.getEngine();
    const { wsRoot } = this.extension.getDWorkspace();

    const processedOpts = await this.processInputs(opts);
    if (processedOpts === null) return; // User cancelled a prompt, or did not have a valid link selected
    const { qs, vault } = processedOpts;

    // Non-note files use `qs` for full path, and set vault to null
    if (opts.kind === TargetKind.NON_NOTE && qs) {
      let type: GotoFileType;
      if (FileExtensionUtils.isTextFileExtension(path.extname(qs))) {
        // Text file, open inside of VSCode
        type = GotoFileType.TEXT;
        const editor = await VSCodeUtils.openFileInEditor(
          Uri.from({ scheme: "file", path: qs }),
          {
            column: opts.column,
          },
        );
        if (editor && opts.anchor) {
          await this.extension.wsUtils.trySelectRevealNonNoteAnchor(
            editor,
            opts.anchor,
          );
        }
      } else {
        // Binary file, open with default app
        type = GotoFileType.BINARY;
        await PluginFileUtils.openWithDefaultApp(qs);
      }

      return {
        kind: TargetKind.NON_NOTE,
        type,
        fullPath: qs,
      };
    }

    if (qs === undefined || vault === undefined) {
      // There was an error or the user cancelled a prompt
      return;
    }

    // Otherwise, it's a regular note
    let pos: undefined | Position;
    const out = await this.extension.pauseWatchers<GoToNoteCommandOutput>(
      async () => {
        const notes = await client.findNotes({ fname: qs, vault });
        let note: NoteProps;

        // If note doesn't exist, create note with schema
        if (notes.length === 0) {
          const fname = qs;
          // validate fname before creating new note
          const validationResp = NoteUtils.validateFname(fname);
          if (validationResp.isValid) {
            const newNote = await NoteUtils.createWithSchema({
              noteOpts: {
                fname,
                vault,
              },
              engine: client,
            });
            await TemplateUtils.findAndApplyTemplate({
              note: toCSNoteProps(newNote),
              engine: toDEngineClient(client),
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
              }) as Parameters<
                typeof TemplateUtils.findAndApplyTemplate
              >[0]["pickNote"],
            });
            note = _.merge(newNote, overrides || {});
            const { originNote } = opts;
            if (originNote) {
              this.addBacklinkPointingToOrigin({
                originNote,
                note,
              });
            }
            await client.writeNote(note);

            // check if we should send meeting note telemetry.
            const type = qs.startsWith("user.") ? "userTag" : "general";
            maybeSendMeetingNoteTelemetry(type);
          } else {
            // should not create note if fname is invalid.
            // let the user know and exit early.
            this.displayInvalidFilenameError({ fname, validationResp });
            return;
          }
        } else {
          note = notes[0]!;
          // If note exists and its a stub note, delete stub and create new note
          if (note.stub) {
            delete note.stub;
            note = _.merge(note, overrides || {});
            await client.writeNote(note);
          }
        }

        const npath = NoteUtils.getFullPath({
          note,
          wsRoot,
        });
        const uri = Uri.file(npath);
        const editor = await VSCodeUtils.openFileInEditor(uri, {
          column: opts.column,
        });
        this.L.info({ ctx, opts, msg: "exit" });
        if (opts.anchor && editor) {
          pos = findAnchorPos({ anchor: opts.anchor, note });
          editor.selection = new Selection(pos, pos);
          editor.revealRange(editor.selection);
        }
        return { kind: TargetKind.NOTE, note, pos, source: opts.source };
      },
    );
    return out;
  }

  addAnalyticsPayload(
    opts?: GoToNoteCommandOpts,
    resp?: GoToNoteCommandOutput,
  ) {
    const { source, type } = {
      type: undefined,
      ...opts,
      ...resp,
    };
    const payload = { ...getAnalyticsPayload(source), fileType: type };
    return payload;
  }

  private displayInvalidFilenameError(opts: {
    fname: string;
    validationResp: {
      isValid: boolean;
      reason: InvalidFilenameReason;
    };
  }) {
    const { fname, validationResp } = opts;
    const message = `Cannot create note ${fname}: ${validationResp.reason}`;
    window.showErrorMessage(message);
  }

  /**
   * Given an origin note and a newly created note,
   * add a backlink that points to the origin note
   * to newly created note's link metadata
   */
  private addBacklinkPointingToOrigin(opts: {
    originNote: NoteProps;
    note: NoteProps;
  }) {
    const { originNote, note } = opts;
    const originLinks = originNote.links;

    const linkToNote = originLinks.find(
      (link) => link.to?.fname === note.fname,
    );
    if (linkToNote) {
      const backlinkToOrigin = BacklinkUtils.createFromDLink(linkToNote);
      if (backlinkToOrigin) note.links.push(backlinkToOrigin);
    }
  }
}
