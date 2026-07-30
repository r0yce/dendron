/**
 * Pure helpers for WorkspaceWatcher note save bookkeeping.
 * Node-smokeable.
 */
import { NoteUtils } from "@dendronhq/common-all";

/**
 * Decide if will-save should patch `updated:` given content + content-changed gate.
 */
export function planFrontmatterUpdatedReplace(opts: {
  content: string;
  nowMillis: number;
  contentChanged: boolean;
}): { replaceText: string; matchIndex: number; matchLength: number } | undefined {
  const { content, nowMillis, contentChanged } = opts;
  const match = NoteUtils.RE_FM_UPDATED.exec(content);
  if (!match || !contentChanged) {
    return undefined;
  }
  return {
    replaceText: `updated: ${nowMillis}`,
    matchIndex: match.index,
    matchLength: match[0].length,
  };
}

/** Persistent history note fname for a calendar day. */
export function buildPersistentHistoryFname(dateYMD: string): string {
  return `dendron.hist.${dateYMD}`;
}

/** One line to append into the daily history note. */
export function buildPersistentHistoryLine(opts: {
  minuteAndSecond: string;
  fname: string;
}): string {
  return `- ${opts.minuteAndSecond} : [[${opts.fname}]]`;
}

/** Skip history write for dendron.hist.* notes themselves. */
export function shouldWritePersistentHistory(opts: {
  enablePersistentHistory: boolean | undefined;
  mainVault: string | undefined;
  fname: string;
}): boolean {
  const { enablePersistentHistory, mainVault, fname } = opts;
  return Boolean(
    enablePersistentHistory && mainVault && !fname.startsWith("dendron.hist")
  );
}
