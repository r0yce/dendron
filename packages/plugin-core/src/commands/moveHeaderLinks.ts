/**
 * Link / reference update helpers for MoveHeaderCommand.
 */
import {
  asyncLoopOneAtATime,
  DendronConfig,
  DLink,
  DNoteLink,
  ErrorUtils,
  isNotUndefined,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { DConfig, file2Note, vault2Path } from "@dendronhq/common-server";
import { LinkUtils } from "@dendronhq/unified";
import _ from "lodash";
import path from "path";
import { Location } from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { FoundRefT, hasAnchorsToUpdate } from "../utils/md";

/** Pure filter: links in note body that target origin + named anchors. */
export function findLinksToUpdate(opts: {
  note: NoteProps;
  origin: NoteProps;
  anchorNamesToUpdate: string[];
  config: DendronConfig;
}): DLink[] {
  const { note, origin, anchorNamesToUpdate, config } = opts;
  const links = LinkUtils.findLinksFromBody({
    note,
    config,
  }).filter((link) => {
    return (
      link.to?.fname?.toLowerCase() === origin.fname.toLowerCase() &&
      link.to?.anchorHeader &&
      anchorNamesToUpdate.includes(link.to.anchorHeader)
    );
  });

  return _.orderBy(
    links,
    (link: DLink) => link.position?.start.offset,
    "desc"
  );
}

export async function getNoteByLocation(
  location: Location,
  engine: IEngineAPIService
): Promise<NoteProps | undefined> {
  const fsPath = location.uri.fsPath;
  const fname = NoteUtils.normalizeFname(path.basename(fsPath));
  const vault = ExtensionProvider.getWSUtils().getVaultFromUri(location.uri);
  return (await engine.findNotes({ fname, vault }))[0];
}

export async function updateLinksInNote(opts: {
  note: NoteProps;
  engine: IEngineAPIService;
  linksToUpdate: DLink[];
  dest: NoteProps;
}): Promise<NoteProps> {
  const { note, engine, linksToUpdate, dest } = opts;
  const notesWithSameName = await engine.findNotesMeta({ fname: dest.fname });
  return _.reduce(
    linksToUpdate,
    (acc: NoteProps, linkToUpdate: DLink) => {
      const oldLink = LinkUtils.dlink2DNoteLink(linkToUpdate);
      const isXVault = oldLink.data.xvault || notesWithSameName.length > 1;
      const newLink = {
        ...oldLink,
        from: {
          ...oldLink.from,
          fname: dest.fname,
          vaultName: VaultUtils.getName(dest.vault),
        },
        data: {
          xvault: isXVault,
        },
      } as DNoteLink;
      const newBody = LinkUtils.updateLink({
        note: acc!,
        oldLink,
        newLink,
      });
      acc.body = newBody;
      return acc;
    },
    note
  );
}

export async function updateMoveHeaderReferences(opts: {
  foundReferences: FoundRefT[];
  anchorNamesToUpdate: string[];
  engine: IEngineAPIService;
  origin: NoteProps;
  dest: NoteProps;
  logCtx: string;
  logger: { error: (p: any) => void };
}): Promise<NoteChangeEntry[]> {
  const {
    foundReferences,
    anchorNamesToUpdate,
    engine,
    origin,
    dest,
    logCtx,
    logger,
  } = opts;
  let noteChangeEntries: NoteChangeEntry[] = [];
  const refsToProcess = (
    await Promise.all(
      foundReferences
        .filter((ref) => !ref.isCandidate)
        .filter((ref) => hasAnchorsToUpdate(ref, anchorNamesToUpdate))
        .map((ref) => getNoteByLocation(ref.location, engine))
    )
  ).filter(isNotUndefined);
  const config = DConfig.readConfigSync(engine.wsRoot);

  await asyncLoopOneAtATime(refsToProcess, async (note) => {
    try {
      const vaultPath = vault2Path({
        vault: note.vault,
        wsRoot: engine.wsRoot,
      });
      const resp = file2Note(
        path.join(vaultPath, note.fname + ".md"),
        note!.vault
      );
      if (ErrorUtils.isErrorResp(resp)) {
        throw new Error();
      }
      const _note = resp.data;
      const linksToUpdate = findLinksToUpdate({
        note: _note,
        origin,
        anchorNamesToUpdate,
        config,
      });
      const modifiedNote = await updateLinksInNote({
        note: _note,
        engine,
        linksToUpdate,
        dest,
      });
      note.body = modifiedNote.body;
      const writeResp = await engine.writeNote(note);
      if (writeResp.data) {
        noteChangeEntries = noteChangeEntries.concat(writeResp.data);
      }
    } catch (error) {
      logger.error({ ctx: logCtx, error });
    }
  });
  return noteChangeEntries;
}


