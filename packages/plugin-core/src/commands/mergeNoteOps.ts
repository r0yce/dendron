/**
 * Merge note body + backlink update helpers.
 */
import {
  asyncLoopOneAtATime as asyncLoop,
  NoteChangeEntry,
  NoteProps,
} from "@dendronhq/common-all";
import { LinkUtils } from "@dendronhq/unified";
import type { DEngineClient } from "@dendronhq/common-all";

/** Pure: append source body under a heading into dest body. */
export function mergeNoteBodies(opts: {
  sourceNote: NoteProps;
  destNote: NoteProps;
}): string {
  const { sourceNote, destNote } = opts;
  return `${destNote.body}\n---\n\n# ${sourceNote.title}\n\n${sourceNote.body}`;
}

export async function appendNoteToDest(opts: {
  sourceNote: NoteProps;
  destNote: NoteProps;
  engine: DEngineClient;
  logger: { error: (e: any) => void };
}): Promise<NoteChangeEntry[]> {
  const { sourceNote, destNote, engine, logger } = opts;
  destNote.body = mergeNoteBodies({ sourceNote, destNote });
  const writeResp = await engine.writeNote(destNote);
  if (!writeResp.error) {
    return writeResp.data || [];
  }
  logger.error(writeResp.error);
  return [];
}

export async function updateLinkInNoteForMerge(opts: {
  id: string;
  sourceNote: NoteProps;
  destNote: NoteProps;
  engine: DEngineClient;
  logCtx: string;
  logger: { error: (p: any) => void };
}): Promise<NoteChangeEntry[]> {
  const { id, sourceNote, destNote, engine, logCtx, logger } = opts;
  const getNoteResp = await engine.getNote(id);
  if (getNoteResp.error) {
    throw getNoteResp.error;
  }
  const noteToUpdate = getNoteResp.data;
  if (noteToUpdate !== undefined) {
    const linksToUpdate = noteToUpdate.links
      .filter((link) => link.value === sourceNote.fname)
      .map((link) => LinkUtils.dlink2DNoteLink(link));

    const resp = await LinkUtils.updateLinksInNote({
      linksToUpdate,
      note: noteToUpdate,
      destNote,
      engine,
    });

    if (resp.data) {
      return resp.data;
    }
    logger.error({ ctx: logCtx, message: "No links found to update" });
    return [];
  }
  logger.error({ ctx: logCtx, message: "No note found" });
  return [];
}

export async function updateBacklinksForMerge(opts: {
  sourceNote: NoteProps;
  destNote: NoteProps;
  engine: DEngineClient;
  logCtx: string;
  logger: { error: (p: any) => void };
}): Promise<NoteChangeEntry[]> {
  const { sourceNote, destNote, engine, logCtx, logger } = opts;
  const sourceBacklinks = sourceNote.links.filter((link) => {
    return link.type === "backlink";
  });

  const noteIDsToUpdate = Array.from(
    new Set(
      sourceBacklinks
        .map((backlink) => backlink.from.id)
        .filter((ent): ent is string => ent !== undefined),
    ),
  );

  let noteChangeEntries: NoteChangeEntry[] = [];
  await asyncLoop(noteIDsToUpdate, async (id) => {
    try {
      const changed = await updateLinkInNoteForMerge({
        sourceNote,
        destNote,
        id,
        engine,
        logCtx: `${logCtx}:updateLinkInNote`,
        logger,
      });
      noteChangeEntries = noteChangeEntries.concat(changed);
    } catch (error) {
      logger.error({ ctx: logCtx, error });
    }
  });
  return noteChangeEntries;
}

export async function deleteSourceNote(opts: {
  sourceNote: NoteProps;
  engine: DEngineClient;
  logCtx: string;
  logger: { error: (p: any) => void };
}): Promise<NoteChangeEntry[]> {
  const { sourceNote, engine, logCtx, logger } = opts;
  try {
    const deleteResp = await engine.deleteNote(sourceNote.id);
    if (deleteResp.data) {
      return deleteResp.data;
    }
    return [];
  } catch (error) {
    logger.error({ ctx: logCtx, error });
    return [];
  }
}
