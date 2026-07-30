/**
 * Pure preview navigation history stack (no vscode).
 * Node-smokeable.
 */

export type PreviewHistoryState = {
  history: string[];
  historyIndex: number;
};

export const PREVIEW_HISTORY_MAX = 50;

export function createPreviewHistoryState(): PreviewHistoryState {
  return { history: [], historyIndex: -1 };
}

/**
 * Push note onto history unless navigating with back/forward, or already at tip.
 * Drops any forward stack when navigating to a new note.
 */
export function pushPreviewHistory(
  state: PreviewHistoryState,
  noteId: string,
  opts?: { navigatingHistory?: boolean; max?: number }
): PreviewHistoryState {
  if (opts?.navigatingHistory) {
    return state;
  }
  const max = opts?.max ?? PREVIEW_HISTORY_MAX;
  let history = state.history.slice();
  let historyIndex = state.historyIndex;

  if (historyIndex >= 0 && history[historyIndex] === noteId) {
    return state;
  }
  // Drop any forward stack when navigating to a new note
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  history.push(noteId);
  if (history.length > max) {
    history.shift();
  }
  historyIndex = history.length - 1;
  return { history, historyIndex };
}

/** Move index back one step; returns note id to show, or undefined. */
export function goBackPreviewHistory(
  state: PreviewHistoryState
): { state: PreviewHistoryState; noteId?: string } {
  if (state.historyIndex <= 0) {
    return { state };
  }
  const historyIndex = state.historyIndex - 1;
  const noteId = state.history[historyIndex];
  return {
    state: { history: state.history, historyIndex },
    ...(noteId !== undefined ? { noteId } : {}),
  };
}

/** Move index forward one step; returns note id to show, or undefined. */
export function goForwardPreviewHistory(
  state: PreviewHistoryState
): { state: PreviewHistoryState; noteId?: string } {
  if (state.historyIndex >= state.history.length - 1) {
    return { state };
  }
  const historyIndex = state.historyIndex + 1;
  const noteId = state.history[historyIndex];
  return {
    state: { history: state.history, historyIndex },
    ...(noteId !== undefined ? { noteId } : {}),
  };
}

export function clearPreviewHistory(): PreviewHistoryState {
  return createPreviewHistoryState();
}
