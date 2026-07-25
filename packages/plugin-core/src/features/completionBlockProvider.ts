/**
 * Block-anchor completion provider ([[# / [[^ / [[note#).
 */
import {
  DNoteAnchor,
  ERROR_SEVERITY,
  genUUIDInsecure,
  isNotUndefined,
  NotePropsMeta,
  VaultUtils,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { AnchorUtils, DendronASTTypes, LinkUtils } from "@dendronhq/unified";
import _ from "lodash";
import {
  CancellationToken,
  CompletionItem,
  Position,
  Range,
  TextDocument,
  TextEdit,
} from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { WSUtils } from "../WSUtils";
import {
  computeBlockCompletionRange,
  findMatchAtCharacter,
  padWithZero,
  PARTIAL_WIKILINK_WITH_ANCHOR_REGEX,
} from "./completionHelpers";

export async function provideBlockCompletionItems(
  document: TextDocument,
  position: Position,
  token?: CancellationToken,
): Promise<CompletionItem[] | undefined> {
  const ctx = "provideBlockCompletionItems";

  // No-op if we're not in a Dendron Workspace
  if (!DendronExtension.isActive()) {
    return;
  }

  // This gets triggered when the user types ^, which won't necessarily happen inside a wikilink.
  // So check that the user is actually in a wikilink before we try.
  const line = document.lineAt(position.line);
  const found = findMatchAtCharacter(
    line.text,
    position.character,
    PARTIAL_WIKILINK_WITH_ANCHOR_REGEX,
  );
  if (
    _.isUndefined(found) ||
    _.isUndefined(found.index) ||
    _.isUndefined(found.groups) ||
    token?.isCancellationRequested
  )
    return;
  Logger.debug({ ctx, found });

  const timestampStart = process.hrtime();
  const engine = ExtensionProvider.getEngine();

  let otherFile = false;
  let note: NotePropsMeta | undefined;
  if (found.groups?.note) {
    // This anchor will be to another note, e.g. [[note#
    // `groups.note` may have vault name, so let's try to parse that
    const link = LinkUtils.parseLinkV2({ linkString: found.groups.note });
    const vault = link?.vaultName
      ? VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname: link?.vaultName,
        })
      : undefined;
    // If we couldn't find the linked note, don't do anything
    if (_.isNull(link) || _.isUndefined(link.value)) return;
    note = (
      await engine.findNotesMeta(
        {
          fname: link.value,
          vault: vault ?? undefined,
        } as any /* 4-axis boundary: FindNoteOpts.vault required (common-all) vs DVault | undefined from local; exactOptionalPropertyTypes. TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry + ADR 0001 */,
      )
    )[0];
    otherFile = true;
  } else {
    // This anchor is to the same file, e.g. [[#
    note = await WSUtils.getNoteFromDocument(document);
  }

  if (_.isUndefined(note) || token?.isCancellationRequested) return;
  Logger.debug({ ctx, fname: note.fname });

  // If there is [[^ or [[^^ , remove that because it's not a valid wikilink
  const removeTrigger = isNotUndefined(found.groups.trigger)
    ? new TextEdit(
        new Range(
          position.line,
          found.index + 2,
          position.line,
          found.index + 2 + found.groups.trigger.length,
        ),
        "",
      )
    : undefined;

  let filterByAnchorType: "header" | "block" | undefined;
  // When triggered by [[#^, only show existing block anchors
  let insertValueOnly = false;
  if (isNotUndefined(found.groups?.anchor)) {
    filterByAnchorType = "block";
    // There is already #^ which we are not removing, so don't duplicate it when inserting the text
    insertValueOnly = true;
  } else if (isNotUndefined(found.groups?.hash)) {
    filterByAnchorType = "header";
    // There is already # which we are not removing, so don't duplicate it when inserting the text
    insertValueOnly = true;
  }

  const blocks = await ExtensionProvider.getEngine().getNoteBlocks(
    {
      id: note.id,
      filterByAnchorType: filterByAnchorType ?? undefined,
    } as any /* 4-axis boundary: GetNoteBlocksOpts.filterByAnchorType required vs | undefined; exactOptional. TODO: Monorepo 4-axis + di-container + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry + ADR 0001 */,
  );
  if (
    _.isUndefined(blocks.data) ||
    blocks.error?.severity === ERROR_SEVERITY.FATAL
  ) {
    Logger.error(
      {
        ctx,
        error: blocks.error || undefined,
        msg: `Unable to get blocks for autocomplete`,
      } as any /* 4-axis boundary: Logger.error Partial with error?: IDendronError vs | undefined under exactOptionalPropertyTypes. TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry. */,
    );
    return;
  }
  Logger.debug({ ctx, blockCount: blocks.data.length });

  const { start, end } = computeBlockCompletionRange({
    foundIndex: found.index,
    groups: found.groups as Record<string, string | undefined>,
  });
  const range = new Range(position.line, start, position.line, end);
  Logger.debug({ ctx, start: range.start, end: range.end });

  const completions = blocks.data
    .map((block, index) => {
      const edits: TextEdit[] = [];
      if (removeTrigger) edits.push(removeTrigger);
      let anchor: DNoteAnchor | undefined = block.anchor;
      if (_.isUndefined(anchor)) {
        // We can't insert edits into other files, so we can't suggest blocks without existing anchors
        if (otherFile) return;
        anchor = {
          type: "block",
          // Using the "insecure" generator avoids blocking for entropy to become available. This slightly increases the
          // chance of conflicting IDs, but that's okay since we'll only insert one of these completions. (Could also put
          // the same id for all options, but it's unclear if VSCode might reuse these completions)
          value: genUUIDInsecure(),
        };
        const blockPosition = VSCodeUtils.point2VSCodePosition(
          block.position.end,
        );
        edits.push(
          new TextEdit(
            new Range(blockPosition, blockPosition),
            // To represent a whole list, the anchor must be after the list with 1 empty line between
            block.type === DendronASTTypes.LIST
              ? `\n\n${AnchorUtils.anchor2string(anchor)}\n`
              : // To represent any other block, the anchor can be placed at the end of the block
                ` ${AnchorUtils.anchor2string(anchor)}`,
          ),
        );
      }
      return {
        label: block.text,
        // The region that will get replaced when inserting the block.
        range,
        insertText: insertValueOnly
          ? anchor.value
          : `#${AnchorUtils.anchor2string(anchor)}`,
        // If the block didn't have an anchor, we need to insert it ourselves
        additionalTextEdits: edits,
        sortText: padWithZero(index),
      };
    })
    .filter(isNotUndefined);
  const duration = getDurationMilliseconds(timestampStart);
  Logger.debug({ ctx, completionCount: completions.length, duration });
  return completions;
}
