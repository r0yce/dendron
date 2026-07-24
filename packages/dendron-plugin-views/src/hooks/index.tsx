import { NoteProps } from "@dendronhq/common-all";
import {
  createLogger,
  engineHooks,
  engineSlice,
} from "@dendronhq/common-frontend";
import { Mermaid } from "mermaid";
import React from "react";
import { DendronProps, WorkspaceProps } from "../types";

export const useCurrentTheme = () => {
  const [currentTheme, setCurrentTheme] = React.useState<"light" | "dark">(
    "light"
  );
  React.useEffect(() => {
    if (window.currentTheme) {
      setCurrentTheme(window.currentTheme);
    }
    // @ts-ignore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.currentTheme]);
  return { currentTheme, setCurrentTheme };
};

export const useWorkspaceProps = (): [WorkspaceProps] => {
  const elem = window.document.getElementById("root")!;
  const url = elem.getAttribute("data-url")!;
  const ws = elem.getAttribute("data-ws")!;
  const isBrowser = elem.getAttribute("data-browser")! === "true";
  const theme = elem.getAttribute("data-browser")!;
  return [
    {
      url,
      ws,
      browser: isBrowser,
      theme,
    },
  ];
};

/**
 * Body of current note
 * @param param0 - if previewHTML is passed in, just return that HTML directly
 * and don't do any additional rendering.
 * @returns
 */
export const useRenderedNoteBody = ({
  engine,
  noteProps,
  workspace,
  previewHTML,
}: DendronProps & { noteProps?: NoteProps; previewHTML?: string }) => {
  const { id: noteId, contentHash } = noteProps || {
    id: undefined,
    contentHash: undefined,
  };

  let noteContent: string | undefined;

  if (previewHTML) {
    noteContent = previewHTML;
  } else {
    noteContent = noteId ? engine.notesRendered[noteId] : undefined;
  }
  const renderedNoteContentHash = React.useRef<string>();
  const dispatch = engineHooks.useEngineAppDispatch();

  React.useEffect(() => {
    if (!noteId) {
      return;
    }
    // if no "render to markdown" has happended or the note body changed
    if (
      !previewHTML &&
      (!noteContent || contentHash !== renderedNoteContentHash.current)
    ) {
      renderedNoteContentHash.current = contentHash;
      dispatch(
        engineSlice.renderNote({ ...workspace, id: noteId, note: noteProps })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, contentHash]);
  // }, [noteId, contentHash, dispatch, noteContent, workspace]);

  return [noteContent];
};

/**
 * Initialize mermaid if diagrams are present in the rendered body.
 * Lazy-loads the mermaid bundle so notes without diagrams don't pay the cost.
 *
 * https://mermaid-js.github.io/mermaid/#/
 */
export const useMermaid = ({
  themeType,
  mermaid,
  noteRenderedBody,
}: {
  themeType: "light" | "dark";
  /** Optional preloaded mermaid; if omitted, dynamically imported when needed. */
  mermaid?: Mermaid;
  noteRenderedBody?: string;
}) => {
  React.useEffect(() => {
    const logger = createLogger("useMermaid");
    let cancelled = false;

    const run = async () => {
      // Skip load entirely when no mermaid blocks in the HTML.
      if (
        noteRenderedBody &&
        !noteRenderedBody.includes("class=\"mermaid\"") &&
        !noteRenderedBody.includes("class='mermaid'") &&
        !noteRenderedBody.includes("class=mermaid")
      ) {
        return;
      }
      if (!noteRenderedBody) {
        return;
      }

      const mod =
        mermaid ||
        ((await import("mermaid")).default as unknown as Mermaid);
      if (cancelled) return;

      mod.initialize({
        startOnLoad: true,
        // Cast: mermaid Theme enum typings are unreliable at runtime.
        theme: (themeType === "light" ? "forest" : "dark") as any,
      });
      // @ts-ignore
      window._mermaid = mod;
      // @ts-ignore
      mod.init();
      logger.info({ msg: "init mermaid library", themeType });
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteRenderedBody, themeType]);
};

/**
 * Metadata about current note
 * @param param0
 * @returns
 */
export const useNoteProps = ({
  engine,
  noteId,
}: DendronProps & { noteId: string }) => {
  const maybeNote = engine.notes[noteId];
  if (!maybeNote) {
    throw Error(`note with id ${noteId} not found`);
  }
  return [maybeNote];
};
