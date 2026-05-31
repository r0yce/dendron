"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completionProvider = exports.activate = exports.resolveCompletionItem = exports.debouncedProvideCompletionItems = exports.provideCompletionItems = void 0;
exports.provideBlockCompletionItems = provideBlockCompletionItems;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const WSUtils_1 = require("../WSUtils");
function padWithZero(n) {
    if (n > 99)
        return String(n);
    if (n > 9)
        return `0${n}`;
    return `00${n}`;
}
// prettier-ignore
const NOTE_AUTOCOMPLETEABLE_REGEX = new RegExp("" +
    "(?<entireLink>" +
    // This may be a wikilink or reference
    "(?<beforeAnchor>" +
    "(?<beforeNote>" +
    // Should have the starting brackets
    "(?<reference>!)?\\[\\[" +
    // optional alias
    `(${common_all_1.ALIAS_NAME}(?=\\|)\\|)?` +
    ")" +
    // note name followed by brackets
    "(" +
    "(" +
    `(?<note>${common_all_1.LINK_NAME})?` +
    "(?<afterNote>" +
    // anchor
    "(?<hash>#+)(?<anchor>\\^)?" +
    // text of the header or anchor
    "[^\\[\\]]" +
    ")?" +
    // Must have ending brackets
    "\\]\\]" +
    ")|(?<noBracket>" +
    // Or, note name with no spaces and no brackets.
    // The distinction is needed to avoid consuming text following a link if there's no closing bracket.
    `(?<noteNoSpace>${common_all_1.LINK_NAME_NO_SPACES})?` +
    "(?<afterNoteNoSpace>" +
    // anchor
    "(?<hashNoSpace>#+)(?<anchorNoSpace>\\^)?" +
    // text of the header or anchor
    "[^\\[\\]]" +
    ")?" +
    ")" +
    // No ending brackets
    ")" +
    ")" +
    "|" + // or it may be a hashtag (potentially a hashtag that's empty)
    unified_1.HASHTAG_REGEX_LOOSE.source + "?" +
    "|" + // or it may be a user tag
    unified_1.USERTAG_REGEX_LOOSE.source + "?" +
    ")", "g");
async function noteToCompletionItem({ note, range, lblTransform, insertTextTransform, sortTextTransform, }) {
    const label = lblTransform ? lblTransform(note) : note.fname;
    const insertText = insertTextTransform
        ? await insertTextTransform(note)
        : note.fname;
    const sortText = sortTextTransform ? sortTextTransform(note) : undefined;
    const item = {
        label,
        insertText,
        sortText: sortText ?? undefined,
        kind: vscode_1.CompletionItemKind.File,
        detail: common_all_1.VaultUtils.getName(note.vault),
        range,
    }; // 4-axis boundary: vscode CompletionItem sortText?: string vs our sortTextTransform producing string | undefined under exactOptionalPropertyTypes (see user's pasted 312-error cluster + ConvertLink precedent). TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry.
    return item;
}
async function provideCompletionsForTag({ type, engine, found, range, }) {
    let prefix = "";
    let tagValue = "";
    switch (type) {
        case "hashtag": {
            prefix = common_all_1.TAGS_HIERARCHY;
            tagValue = unified_1.HashTagUtils.extractTagFromMatch(found) || "";
            break;
        }
        case "usertag": {
            prefix = common_all_1.USERS_HIERARCHY;
            tagValue = unified_1.UserTagUtils.extractTagFromMatch(found) || "";
            break;
        }
        default: {
            (0, common_all_1.assertUnreachable)(type);
        }
    }
    const qsRaw = `${prefix}.${tagValue}`;
    const notes = await common_all_1.NoteLookupUtils.lookup({
        qsRaw,
        engine,
    });
    return Promise.all(notes.map((note) => noteToCompletionItem({
        note,
        range,
        lblTransform: (note) => `${note.fname.slice(prefix.length)}`,
        insertTextTransform: (note) => Promise.resolve(`${note.fname.slice(prefix.length)}`),
    })));
}
exports.provideCompletionItems = (0, analytics_1.sentryReportingCallback)(async (document, position) => {
    const ctx = "provideCompletionItems";
    const startTime = process.hrtime();
    // No-op if we're not in a Dendron Workspace
    if (!ExtensionProvider_1.ExtensionProvider.getExtension().isActive()) {
        return;
    }
    const line = document.lineAt(position).text;
    logger_1.Logger.info({ ctx, position, msg: "enter" });
    // get all matches
    let found;
    const matches = line.matchAll(NOTE_AUTOCOMPLETEABLE_REGEX);
    for (const match of matches) {
        if (lodash_1.default.isUndefined(match.groups) || lodash_1.default.isUndefined(match.index))
            continue;
        const { entireLink } = match.groups;
        if (entireLink && match.index <= position.character && position.character <= match.index + entireLink.length) {
            found = match;
        }
    }
    // if no match found, exit early
    if (lodash_1.default.isUndefined(found) ||
        lodash_1.default.isUndefined(found.index) ||
        lodash_1.default.isUndefined(found.groups))
        return;
    logger_1.Logger.debug({ ctx, regexMatch: found });
    // if match is hash, delegate to block auto complete
    if ((found.groups.hash || found.groups.hashNoSpace) &&
        found.index + (found.groups.beforeAnchor?.length || 0) >
            position.character) {
        logger_1.Logger.info({ ctx, msg: "letting block autocomplete take over" });
        return;
    }
    // do autocomplete
    let start;
    let end;
    if (found.groups.hashTag || found.groups.userTag) {
        // This is a hashtag or user tag
        start = found.index + 1 /* for the # or @ symbol */;
        end =
            start +
                (found.groups.tagContents?.length ||
                    found.groups.userTagContents?.length ||
                    0);
    }
    else {
        // This is a wikilink or a reference
        start = found.index + (found.groups.beforeNote?.length || 0);
        end =
            start +
                (found.groups.note?.length || found.groups.noteNoSpace?.length || 0);
    }
    const range = new vscode_1.Range(position.line, start, position.line, end);
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const { wsRoot } = engine;
    let completionItems;
    const completionsIncomplete = true;
    const currentVault = WSUtils_1.WSUtils.getVaultFromDocument(document);
    if (found?.groups?.hashTag) {
        completionItems = await provideCompletionsForTag({
            type: "hashtag",
            engine,
            found,
            range,
        });
    }
    else if (found?.groups?.userTag) {
        completionItems = await provideCompletionsForTag({
            type: "usertag",
            engine,
            found,
            range,
        });
    }
    else {
        let qsRaw;
        if (found?.groups?.note) {
            qsRaw = found?.groups?.note;
        }
        else if (found?.groups?.noteNoSpace) {
            qsRaw = found?.groups?.noteNoSpace;
        }
        else {
            qsRaw = "";
        }
        const insertTextTransform = async (note) => {
            let resp = note.fname;
            if (found?.groups?.noBracket !== undefined) {
                resp += "]]";
            }
            if (currentVault &&
                !common_all_1.VaultUtils.isEqual(currentVault, note.vault, wsRoot)) {
                const sameNameNotes = (await engine.findNotesMeta({ fname: note.fname })).length;
                if (sameNameNotes > 1) {
                    // There are multiple notes with the same name in multiple vaults,
                    // and this note is in a different vault than the current note.
                    // To generate a link to this note, we have to do an xvault link.
                    resp = `${common_all_1.VaultUtils.toURIPrefix(note.vault)}/${resp}`;
                }
            }
            return resp;
        };
        const notes = await common_all_1.NoteLookupUtils.lookup({
            qsRaw,
            engine,
        });
        completionItems = await Promise.all(notes.map((note) => noteToCompletionItem({
            note,
            range,
            insertTextTransform,
            sortTextTransform: (note) => {
                if (currentVault &&
                    !common_all_1.VaultUtils.isEqual(currentVault, note.vault, wsRoot)) {
                    // For notes from other vaults than the current note, sort them after notes from the current vault.
                    // x will get sorted after numbers, so these will appear after notes without x
                    return `x${note.fname}`;
                }
                return;
            },
        })));
    }
    const duration = (0, common_server_1.getDurationMilliseconds)(startTime);
    const completionList = new vscode_1.CompletionList(completionItems, completionsIncomplete);
    logger_1.Logger.debug({
        ctx,
        completionItemsLength: completionList.items.length,
        incomplete: completionList.isIncomplete,
        duration,
    });
    return completionList;
});
/**
 * Debounced version of {@link provideCompletionItems}.
 *
 * We trigger on both leading and trailing edge of the debounce window because:
 * 1. without the leading edge we lose focus to the Intellisense
 * 2. without the trailing edge we may miss some keystrokes from the users at the end.
 *
 * related discussion: https://github.com/dendronhq/dendron/pull/3116#discussion_r902075154
 */
exports.debouncedProvideCompletionItems = lodash_1.default.debounce(exports.provideCompletionItems, 100, { leading: true, trailing: true });
exports.resolveCompletionItem = (0, analytics_1.sentryReportingCallback)(async (item, token) => {
    const ctx = "resolveCompletionItem";
    const { label: fname, detail: vname } = item;
    if (!lodash_1.default.isString(fname) ||
        !lodash_1.default.isString(vname) ||
        token.isCancellationRequested)
        return;
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const { vaults, wsRoot } = engine;
    const vault = common_all_1.VaultUtils.getVaultByName({ vname, vaults });
    if (lodash_1.default.isUndefined(vault)) {
        logger_1.Logger.info({ ctx, msg: "vault not found", fname, vault, wsRoot });
        return;
    }
    const note = (await engine.findNotesMeta({ fname, vault }))[0];
    if (lodash_1.default.isUndefined(note)) {
        logger_1.Logger.info({ ctx, msg: "note not found", fname, vault, wsRoot });
        return;
    }
    try {
        // Render a preview of this note
        const proc = unified_1.MDUtilsV5.procRemarkFull({
            noteToRender: note,
            dest: unified_1.DendronASTDest.MD_REGULAR,
            vault: note.vault,
            fname: note.fname,
            config: common_server_1.DConfig.readConfigSync(engine.wsRoot, true),
            wsRoot,
        }, {
            flavor: unified_1.ProcFlavor.HOVER_PREVIEW,
        });
        const rendered = await proc.process(`![[${common_all_1.VaultUtils.toURIPrefix(note.vault)}/${note.fname}]]`);
        if (token.isCancellationRequested)
            return;
        item.documentation = new vscode_1.MarkdownString(rendered.toString());
        logger_1.Logger.debug({ ctx, msg: "rendered note" });
    }
    catch (err) {
        // Failed creating preview of the note
        logger_1.Logger.info({ ctx, err, msg: "failed to render note" });
        return;
    }
    return item;
});
// prettier-ignore
const PARTIAL_WIKILINK_WITH_ANCHOR_REGEX = new RegExp("" +
    "(?<entireLink>" +
    // Should have the starting brackets
    "\\[\\[" +
    "(" +
    // Will then either look like [[^ or [[^anchor
    "(?<trigger>\\^)(?<afterTrigger>[\\w-]*)" +
    "|" + // or like [[alias|note#, or [[alias|note#anchor, or [[#, or [[#anchor
    "(?<beforeAnchor>" +
    // optional alias
    `(${common_all_1.ALIAS_NAME}(?=\\|)\\|)?` +
    // optional note
    `(?<note>${common_all_1.LINK_NAME})?` +
    // anchor
    "(?<hash>#+)(?<anchor>\\^)?" +
    ")" +
    // the text user typed to select the block
    `(?<afterAnchor>${common_all_1.LINK_NAME})?` +
    ")" +
    // May have ending brackets
    "\\]?\\]?" +
    ")", "g");
async function provideBlockCompletionItems(document, position, token) {
    const ctx = "provideBlockCompletionItems";
    // No-op if we're not in a Dendron Workspace
    if (!workspace_1.DendronExtension.isActive()) {
        return;
    }
    let found;
    // This gets triggered when the user types ^, which won't necessarily happen inside a wikilink.
    // So check that the user is actually in a wikilink before we try.
    const line = document.lineAt(position.line);
    // There may be multiple wikilinks in this line
    const matches = line.text.matchAll(PARTIAL_WIKILINK_WITH_ANCHOR_REGEX);
    for (const match of matches) {
        if (lodash_1.default.isUndefined(match.groups) || lodash_1.default.isUndefined(match.index))
            continue;
        const { entireLink } = match.groups;
        // If the current position is within this link, then we are trying to complete it
        if (entireLink && match.index <= position.character && position.character <= match.index + entireLink.length) {
            found = match;
        }
    }
    if (lodash_1.default.isUndefined(found) ||
        lodash_1.default.isUndefined(found.index) ||
        lodash_1.default.isUndefined(found.groups) ||
        token?.isCancellationRequested)
        return;
    logger_1.Logger.debug({ ctx, found });
    const timestampStart = process.hrtime();
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    let otherFile = false;
    let note;
    if (found.groups?.note) {
        // This anchor will be to another note, e.g. [[note#
        // `groups.note` may have vault name, so let's try to parse that
        const link = unified_1.LinkUtils.parseLinkV2({ linkString: found.groups.note });
        const vault = link?.vaultName
            ? common_all_1.VaultUtils.getVaultByName({
                vaults: engine.vaults,
                vname: link?.vaultName,
            })
            : undefined;
        // If we couldn't find the linked note, don't do anything
        if (lodash_1.default.isNull(link) || lodash_1.default.isUndefined(link.value))
            return;
        note = (await engine.findNotesMeta({ fname: link.value, vault: vault ?? undefined } /* 4-axis boundary: FindNoteOpts.vault required (common-all) vs DVault | undefined from local; exactOptionalPropertyTypes. TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry + ADR 0001 */))[0];
        otherFile = true;
    }
    else {
        // This anchor is to the same file, e.g. [[#
        note = await WSUtils_1.WSUtils.getNoteFromDocument(document);
    }
    if (lodash_1.default.isUndefined(note) || token?.isCancellationRequested)
        return;
    logger_1.Logger.debug({ ctx, fname: note.fname });
    // If there is [[^ or [[^^ , remove that because it's not a valid wikilink
    const removeTrigger = (0, common_all_1.isNotUndefined)(found.groups.trigger)
        ? new vscode_1.TextEdit(new vscode_1.Range(position.line, found.index + 2, position.line, found.index + 2 + found.groups.trigger.length), "")
        : undefined;
    let filterByAnchorType;
    // When triggered by [[#^, only show existing block anchors
    let insertValueOnly = false;
    if ((0, common_all_1.isNotUndefined)(found.groups?.anchor)) {
        filterByAnchorType = "block";
        // There is already #^ which we are not removing, so don't duplicate it when inserting the text
        insertValueOnly = true;
    }
    else if ((0, common_all_1.isNotUndefined)(found.groups?.hash)) {
        filterByAnchorType = "header";
        // There is already # which we are not removing, so don't duplicate it when inserting the text
        insertValueOnly = true;
    }
    const blocks = await ExtensionProvider_1.ExtensionProvider.getEngine().getNoteBlocks({
        id: note.id,
        filterByAnchorType: filterByAnchorType ?? undefined,
    } /* 4-axis boundary: GetNoteBlocksOpts.filterByAnchorType required vs | undefined; exactOptional. TODO: Monorepo 4-axis + di-container + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry + ADR 0001 */);
    if (lodash_1.default.isUndefined(blocks.data) ||
        blocks.error?.severity === common_all_1.ERROR_SEVERITY.FATAL) {
        logger_1.Logger.error({
            ctx,
            error: blocks.error || undefined,
            msg: `Unable to get blocks for autocomplete`,
        } /* 4-axis boundary: Logger.error Partial with error?: IDendronError vs | undefined under exactOptionalPropertyTypes. TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry. */);
        return;
    }
    logger_1.Logger.debug({ ctx, blockCount: blocks.data.length });
    // Calculate the replacement range. This must contain any text the user has typed for the block, but not the trigger symbols (#, ^, #^)
    // This is used to determine what the user has typed to narrow the options, and also to pick what will get replaced once the completion is picked.
    let start = found.index + 2; /* length of [[ */
    let end = start;
    if (found.groups.trigger) {
        // Skip the trigger ^
        start += found.groups.trigger.length;
        // Include the text user has typed after trigger
        end = start;
        if (found.groups.afterTrigger)
            end += found.groups.afterTrigger.length;
    }
    if (found.groups.beforeAnchor) {
        // Skip anchor # or #^
        start += found.groups.beforeAnchor.length;
        // Include the text user has typed after anchor
        end = start;
        if (found.groups.afterAnchor)
            end += found.groups.afterAnchor.length;
    }
    const range = new vscode_1.Range(position.line, start, position.line, end);
    logger_1.Logger.debug({ ctx, start: range.start, end: range.end });
    const completions = blocks.data
        .map((block, index) => {
        const edits = [];
        if (removeTrigger)
            edits.push(removeTrigger);
        let anchor = block.anchor;
        if (lodash_1.default.isUndefined(anchor)) {
            // We can't insert edits into other files, so we can't suggest blocks without existing anchors
            if (otherFile)
                return;
            anchor = {
                type: "block",
                // Using the "insecure" generator avoids blocking for entropy to become available. This slightly increases the
                // chance of conflicting IDs, but that's okay since we'll only insert one of these completions. (Could also put
                // the same id for all options, but it's unclear if VSCode might reuse these completions)
                value: (0, common_all_1.genUUIDInsecure)(),
            };
            const blockPosition = vsCodeUtils_1.VSCodeUtils.point2VSCodePosition(block.position.end);
            edits.push(new vscode_1.TextEdit(new vscode_1.Range(blockPosition, blockPosition), 
            // To represent a whole list, the anchor must be after the list with 1 empty line between
            block.type === unified_1.DendronASTTypes.LIST
                ? `\n\n${unified_1.AnchorUtils.anchor2string(anchor)}\n`
                : // To represent any other block, the anchor can be placed at the end of the block
                    ` ${unified_1.AnchorUtils.anchor2string(anchor)}`));
        }
        return {
            label: block.text,
            // The region that will get replaced when inserting the block.
            range,
            insertText: insertValueOnly
                ? anchor.value
                : `#${unified_1.AnchorUtils.anchor2string(anchor)}`,
            // If the block didn't have an anchor, we need to insert it ourselves
            additionalTextEdits: edits,
            sortText: padWithZero(index),
        };
    })
        .filter(common_all_1.isNotUndefined);
    const duration = (0, common_server_1.getDurationMilliseconds)(timestampStart);
    logger_1.Logger.debug({ ctx, completionCount: completions.length, duration });
    return completions;
}
const activate = (context) => {
    context.subscriptions.push(vscode_1.languages.registerCompletionItemProvider("markdown", {
        // we debounce this provider since we don't want lookup to be triggered on every keystroke.
        provideCompletionItems: exports.debouncedProvideCompletionItems,
    }, "[", // for wikilinks and references
    "#", // for hashtags
    "@", // for user tags
    "" // for new levels in the hieirarchy
    ));
    context.subscriptions.push(vscode_1.languages.registerCompletionItemProvider("markdown", {
        /**
         * we don't have to debounce this since it is not triggered on every keystroke
         * and is ligher than {@link provideCompletionItems} in general.
         */
        provideCompletionItems: provideBlockCompletionItems,
    }, "#", "^"));
};
exports.activate = activate;
exports.completionProvider = {
    activate: exports.activate,
};
//# sourceMappingURL=completionProvider.js.map