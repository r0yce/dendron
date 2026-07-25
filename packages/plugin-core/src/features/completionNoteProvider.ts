/**
 * Note / tag completion providers (wikilink, hashtag, usertag).
 */
import {
  assertUnreachable,
  DEngineClient,
  NoteLookupUtils,
  NoteProps,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
  VaultUtils,
} from "@dendronhq/common-all";
import { DConfig, getDurationMilliseconds } from "@dendronhq/common-server";
import {
  DendronASTDest,
  HashTagUtils,
  MDUtilsV5,
  ProcFlavor,
  UserTagUtils,
} from "@dendronhq/unified";
import _ from "lodash";
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  MarkdownString,
  Position,
  Range,
  TextDocument,
} from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { sentryReportingCallback } from "../utils/analytics";
import { WSUtils } from "../WSUtils";
import {
  computeNoteCompletionRange,
  findMatchAtCharacter,
  NOTE_AUTOCOMPLETEABLE_REGEX,
} from "./completionHelpers";

async function noteToCompletionItem({
  note,
  range,
  lblTransform,
  insertTextTransform,
  sortTextTransform,
}: {
  note: NoteProps;
  range: Range;
  lblTransform?: (note: NoteProps) => string;
  insertTextTransform?: (note: NoteProps) => Promise<string>;
  sortTextTransform?: (note: NoteProps) => string | undefined;
}): Promise<CompletionItem> {
  const label = lblTransform ? lblTransform(note) : note.fname;
  const insertText = insertTextTransform
    ? await insertTextTransform(note)
    : note.fname;
  const sortText = sortTextTransform ? sortTextTransform(note) : undefined;
  const item: CompletionItem = {
    label,
    insertText,
    sortText: sortText ?? undefined,
    kind: CompletionItemKind.File,
    detail: VaultUtils.getName(note.vault),
    range,
  } as CompletionItem; // 4-axis boundary: vscode CompletionItem sortText?: string vs our sortTextTransform producing string | undefined under exactOptionalPropertyTypes (see user's pasted 312-error cluster + ConvertLink precedent). TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry.
  return item;
}

async function provideCompletionsForTag({
  type,
  engine,
  found,
  range,
}: {
  found: RegExpMatchArray | null;
  type: "hashtag" | "usertag";
  engine: DEngineClient;
  range: Range;
}) {
  let prefix = "";
  let tagValue = "";
  switch (type) {
    case "hashtag": {
      prefix = TAGS_HIERARCHY;
      tagValue = HashTagUtils.extractTagFromMatch(found) || "";
      break;
    }
    case "usertag": {
      prefix = USERS_HIERARCHY;
      tagValue = UserTagUtils.extractTagFromMatch(found) || "";
      break;
    }
    default: {
      assertUnreachable(type);
    }
  }
  const qsRaw = `${prefix}.${tagValue}`;
  const notes = await NoteLookupUtils.lookup({
    qsRaw,
    engine,
  });
  return Promise.all(
    notes.map((note) =>
      noteToCompletionItem({
        note,
        range,
        lblTransform: (note) => `${note.fname.slice(prefix.length)}`,
        insertTextTransform: (note) =>
          Promise.resolve(`${note.fname.slice(prefix.length)}`),
      }),
    ),
  );
}

export const provideCompletionItems = sentryReportingCallback(
  async (
    document: TextDocument,
    position: Position,
  ): Promise<CompletionList | undefined> => {
    const ctx = "provideCompletionItems";
    const startTime = process.hrtime();
    // No-op if we're not in a Dendron Workspace
    if (!ExtensionProvider.getExtension().isActive()) {
      return;
    }

    const line = document.lineAt(position).text;
    Logger.info({ ctx, position, msg: "enter" });

    const found = findMatchAtCharacter(
      line,
      position.character,
      NOTE_AUTOCOMPLETEABLE_REGEX,
    );

    // if no match found, exit early
    if (
      _.isUndefined(found) ||
      _.isUndefined(found.index) ||
      _.isUndefined(found.groups)
    )
      return;

    Logger.debug({ ctx, regexMatch: found });

    // if match is hash, delegate to block auto complete
    if (
      (found.groups.hash || found.groups.hashNoSpace) &&
      found.index + (found.groups.beforeAnchor?.length || 0) >
        position.character
    ) {
      Logger.info({ ctx, msg: "letting block autocomplete take over" });
      return;
    }

    const { start, end } = computeNoteCompletionRange({
      foundIndex: found.index,
      groups: found.groups as Record<string, string | undefined>,
    });
    const range = new Range(position.line, start, position.line, end);

    const engine = ExtensionProvider.getEngine();
    const { wsRoot } = engine;
    let completionItems: CompletionItem[];
    const completionsIncomplete = true;
    const currentVault = WSUtils.getVaultFromDocument(document);

    if (found?.groups?.hashTag) {
      completionItems = await provideCompletionsForTag({
        type: "hashtag",
        engine,
        found,
        range,
      });
    } else if (found?.groups?.userTag) {
      completionItems = await provideCompletionsForTag({
        type: "usertag",
        engine,
        found,
        range,
      });
    } else {
      let qsRaw: string;
      if (found?.groups?.note) {
        qsRaw = found?.groups?.note;
      } else if (found?.groups?.noteNoSpace) {
        qsRaw = found?.groups?.noteNoSpace;
      } else {
        qsRaw = "";
      }
      const insertTextTransform = async (note: NoteProps) => {
        let resp = note.fname;
        if (found?.groups?.noBracket !== undefined) {
          resp += "]]";
        }
        if (
          currentVault &&
          !VaultUtils.isEqual(currentVault, note.vault, wsRoot)
        ) {
          const sameNameNotes = (
            await engine.findNotesMeta({ fname: note.fname })
          ).length;
          if (sameNameNotes > 1) {
            // There are multiple notes with the same name in multiple vaults,
            // and this note is in a different vault than the current note.
            // To generate a link to this note, we have to do an xvault link.
            resp = `${VaultUtils.toURIPrefix(note.vault)}/${resp}`;
          }
        }
        return resp;
      };

      const notes = await NoteLookupUtils.lookup({
        qsRaw,
        engine,
      });

      completionItems = await Promise.all(
        notes.map((note) =>
          noteToCompletionItem({
            note,
            range,
            insertTextTransform,
            sortTextTransform: (note) => {
              if (
                currentVault &&
                !VaultUtils.isEqual(currentVault, note.vault, wsRoot)
              ) {
                // For notes from other vaults than the current note, sort them after notes from the current vault.
                // x will get sorted after numbers, so these will appear after notes without x
                return `x${note.fname}`;
              }
              return;
            },
          }),
        ),
      );
    }

    const duration = getDurationMilliseconds(startTime);
    const completionList = new CompletionList(
      completionItems,
      completionsIncomplete,
    );
    Logger.debug({
      ctx,
      completionItemsLength: completionList.items.length,
      incomplete: completionList.isIncomplete,
      duration,
    });
    return completionList;
  },
);

/**
 * Debounced version of {@link provideCompletionItems}.
 *
 * We trigger on both leading and trailing edge of the debounce window because:
 * 1. without the leading edge we lose focus to the Intellisense
 * 2. without the trailing edge we may miss some keystrokes from the users at the end.
 *
 * related discussion: https://github.com/dendronhq/dendron/pull/3116#discussion_r902075154
 */
export const debouncedProvideCompletionItems = _.debounce(
  provideCompletionItems,
  100,
  { leading: true, trailing: true },
);

export const resolveCompletionItem = sentryReportingCallback(
  async (
    item: CompletionItem,
    token: CancellationToken,
  ): Promise<CompletionItem | undefined> => {
    const ctx = "resolveCompletionItem";
    const { label: fname, detail: vname } = item;
    if (
      !_.isString(fname) ||
      !_.isString(vname) ||
      token.isCancellationRequested
    )
      return;

    const engine = ExtensionProvider.getEngine();
    const { vaults, wsRoot } = engine;
    const vault = VaultUtils.getVaultByName({ vname, vaults });
    if (_.isUndefined(vault)) {
      Logger.info({ ctx, msg: "vault not found", fname, vault, wsRoot });
      return;
    }

    const note = (await engine.findNotesMeta({ fname, vault }))[0];

    if (_.isUndefined(note)) {
      Logger.info({ ctx, msg: "note not found", fname, vault, wsRoot });
      return;
    }

    try {
      // Render a preview of this note
      const proc = MDUtilsV5.procRemarkFull(
        {
          noteToRender: note,
          dest: DendronASTDest.MD_REGULAR,
          vault: note.vault,
          fname: note.fname,
          config: DConfig.readConfigSync(engine.wsRoot, true),
          wsRoot,
        },
        {
          flavor: ProcFlavor.HOVER_PREVIEW,
        },
      );
      const rendered = await proc.process(
        `![[${VaultUtils.toURIPrefix(note.vault)}/${note.fname}]]`,
      );
      if (token.isCancellationRequested) return;
      item.documentation = new MarkdownString(rendered.toString());
      Logger.debug({ ctx, msg: "rendered note" });
    } catch (err) {
      // Failed creating preview of the note
      Logger.info({ ctx, err, msg: "failed to render note" });
      return;
    }

    return item;
  },
);
