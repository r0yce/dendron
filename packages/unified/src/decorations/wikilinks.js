"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decorateWikilink = void 0;
exports.linkedNoteType = linkedNoteType;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const remark_1 = require("../remark");
const noteRefsV2_1 = require("../remark/noteRefsV2");
const taskNotes_1 = require("./taskNotes");
const utils_1 = require("./utils");
const RE_ALIAS = /(?<beforeAlias>\[\[)(?<alias>[^|]+)\|/;
const decorateWikilink = async (opts) => {
    const { node: wikiLink, engine, note, noteText, config } = opts;
    const { position } = wikiLink;
    const fname = wikiLink.value;
    const vaultName = wikiLink.data.vaultName;
    const { type, errors } = await linkedNoteType({
        fname,
        anchorStart: wikiLink.data.anchorHeader,
        vaultName,
        note,
        engine,
        vaults: config.workspace?.vaults ?? [],
    });
    const wikilinkRange = (0, common_all_1.position2VSCodeRange)(position);
    const decorations = [];
    // Highlight the alias part
    const linkText = (0, common_all_1.getTextRange)(noteText, wikilinkRange);
    const aliasMatch = linkText.match(RE_ALIAS);
    if (aliasMatch &&
        aliasMatch.groups?.beforeAlias &&
        aliasMatch.groups?.alias) {
        const { beforeAlias, alias } = aliasMatch.groups;
        decorations.push({
            type: utils_1.DECORATION_TYPES.alias,
            range: {
                start: {
                    line: wikilinkRange.start.line,
                    character: wikilinkRange.start.character + beforeAlias.length,
                },
                end: {
                    line: wikilinkRange.start.line,
                    character: wikilinkRange.start.character + beforeAlias.length + alias.length,
                },
            },
        });
    }
    // Wikilinks to a part of a task are not tasks themselves, so skip links like [[task.thing#part]]. Also skip broken wikilinks, they have no notes.
    if (!wikiLink.data.anchorHeader && type !== utils_1.DECORATION_TYPES.brokenWikilink) {
        const taskDecoration = await (0, taskNotes_1.decorateTaskNote)({
            range: wikilinkRange,
            fname,
            vaultName,
            engine,
            config,
        });
        if (taskDecoration)
            decorations.push(taskDecoration);
    }
    // Highlight the wikilink itself
    decorations.push({
        type,
        range: wikilinkRange,
        data: {
            link: wikiLink,
        },
    });
    return { decorations, errors };
};
exports.decorateWikilink = decorateWikilink;
function checkIfAnchorIsValid({ anchor, allAnchors, }) {
    // if there's no anchor, there's nothing that could be invalid
    if (!anchor)
        return true;
    // if it's a ^begin or ^end, it's valid;
    if (anchor && (0, noteRefsV2_1.isBeginBlockAnchorId)(anchor.slice(1)))
        return true;
    if (anchor && (0, noteRefsV2_1.isEndBlockAnchorId)(anchor.slice(1)))
        return true;
    // wildcard header anchor or line anchor. These are hard to check, so let's just say they exist.
    if (anchor && /^[*L]/.test(anchor))
        return true;
    // otherwise, check that the anchor actually exists inside the note
    return allAnchors.includes(anchor.toLowerCase());
}
async function linkedNoteType({ fname, anchorStart, anchorEnd, vaultName, note, engine, vaults, }) {
    const ctx = "linkedNoteType";
    // const { vaults } = engine;
    const vault = vaultName
        ? common_all_1.VaultUtils.getVaultByName({ vname: vaultName, vaults })
        : undefined;
    // Vault specified, but can't find it.
    if (vaultName && !vault)
        return {
            type: utils_1.DECORATION_TYPES.brokenWikilink,
            errors: [],
        };
    let matchingNotes;
    // Same-file links have `fname` undefined or empty string
    if (!fname && note) {
        matchingNotes = note ? [note] : [];
    }
    else if (fname) {
        try {
            matchingNotes = await engine.findNotesMeta({ fname, vault });
        }
        catch (err) {
            return {
                type: utils_1.DECORATION_TYPES.brokenWikilink,
                errors: [
                    new common_all_1.DendronError({
                        message: "error when looking for note",
                        payload: {
                            ctx,
                            fname,
                            vaultName,
                            err,
                        },
                    }),
                ],
            };
        }
    }
    else {
        matchingNotes = [note];
    }
    // Checking web URLs is not feasible, and checking wildcard references would be hard.
    // Let's just highlight them as existing for now.
    if (fname && ((0, common_all_1.containsNonDendronUri)(fname) || fname.endsWith("*")))
        return { type: utils_1.DECORATION_TYPES.wikiLink, errors: [] };
    // It's hard to check the anchors for non-note files because we don't parse
    // them ahead of time. If we can find the file, just say the link is good
    // without checking anchors.
    // TODO: Re-enable check once we can refactor out common-server dependency:
    // if (fname && matchingNotes.length === 0) {
    // const nonNoteFile = await findNonNoteFile({
    //   fpath: fname,
    //   vaults: engine.vaults,
    //   wsRoot: engine.wsRoot,
    // });
    // if (nonNoteFile) return { type: DECORATION_TYPES.wikiLink, errors: [] };
    // return { type: DECORATION_TYPES.wikiLink, errors: [] };
    // }
    // For regular notes, we can efficiently check the anchors.
    if (anchorStart || anchorEnd) {
        const allAnchors = lodash_1.default.flatMap(matchingNotes, (note) => Object.values(note.anchors))
            .filter(common_all_1.isNotUndefined)
            .map(remark_1.AnchorUtils.anchor2string);
        if (!checkIfAnchorIsValid({ anchor: anchorStart, allAnchors }))
            return { type: utils_1.DECORATION_TYPES.brokenWikilink, errors: [] };
        if (!checkIfAnchorIsValid({ anchor: anchorEnd, allAnchors }))
            return { type: utils_1.DECORATION_TYPES.brokenWikilink, errors: [] };
    }
    if (matchingNotes.length > 0) {
        // There are no anchors specified in the link, but we did find matching notes
        return {
            type: utils_1.DECORATION_TYPES.wikiLink,
            errors: [],
            noteMeta: matchingNotes[0],
        };
    }
    // No matching notes, and not a non-note file or web URL. This is just a broken link then.
    return { type: utils_1.DECORATION_TYPES.brokenWikilink, errors: [] };
}
//# sourceMappingURL=wikilinks.js.map