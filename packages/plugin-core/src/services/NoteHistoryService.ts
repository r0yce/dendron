import { NotePropsMeta } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";

type HistoryEntry = {
  fname: string;
  vaultFsPath: string;
  noteId: string;
};

/**
 * Sprint 4: stack of recently opened Dendron notes for back/forward navigation.
 */
export class NoteHistoryService {
  private static _history: HistoryEntry[] = [];
  private static _index = -1;
  private static _navigating = false;
  private static _disposable: vscode.Disposable | undefined;
  private static readonly MAX = 80;

  static init(context: vscode.ExtensionContext): void {
    if (this._disposable) return;
    this._disposable = vscode.window.onDidChangeActiveTextEditor(async (ed) => {
      if (this._navigating || !ed) return;
      try {
        const note =
          await ExtensionProvider.getExtension().wsUtils.tryGetNoteFromDocument(
            ed.document
          );
        if (note) {
          this.push(note);
        }
      } catch (err) {
        Logger.debug({ ctx: "NoteHistoryService", err });
      }
    });
    context.subscriptions.push(this._disposable);
  }

  static push(note: NotePropsMeta): void {
    const entry: HistoryEntry = {
      fname: note.fname,
      vaultFsPath: note.vault.fsPath,
      noteId: note.id,
    };
    if (
      this._index >= 0 &&
      this._history[this._index]?.noteId === entry.noteId
    ) {
      return;
    }
    if (this._index < this._history.length - 1) {
      this._history = this._history.slice(0, this._index + 1);
    }
    this._history.push(entry);
    if (this._history.length > this.MAX) {
      this._history.shift();
    }
    this._index = this._history.length - 1;
  }

  static canGoBack(): boolean {
    return this._index > 0;
  }

  static canGoForward(): boolean {
    return this._index >= 0 && this._index < this._history.length - 1;
  }

  static peekBack(): HistoryEntry | undefined {
    if (!this.canGoBack()) return undefined;
    return this._history[this._index - 1];
  }

  static peekForward(): HistoryEntry | undefined {
    if (!this.canGoForward()) return undefined;
    return this._history[this._index + 1];
  }

  static async goBack(
    open: (entry: HistoryEntry) => Promise<void>
  ): Promise<void> {
    if (!this.canGoBack()) return;
    this._index -= 1;
    const entry = this._history[this._index];
    if (!entry) return;
    this._navigating = true;
    try {
      await open(entry);
    } finally {
      this._navigating = false;
    }
  }

  static async goForward(
    open: (entry: HistoryEntry) => Promise<void>
  ): Promise<void> {
    if (!this.canGoForward()) return;
    this._index += 1;
    const entry = this._history[this._index];
    if (!entry) return;
    this._navigating = true;
    try {
      await open(entry);
    } finally {
      this._navigating = false;
    }
  }
}
