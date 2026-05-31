"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decorateHashTag = void 0;
exports.isDecorationHashTag = isDecorationHashTag;
exports.decorateTag = decorateTag;
const common_all_1 = require("@dendronhq/common-all");
const wikilinks_1 = require("./wikilinks");
function isDecorationHashTag(decoration) {
    return decoration.color !== undefined;
}
const decorateHashTag = (opts) => {
    const { node: hashtag, engine, config, note } = opts;
    const { position } = hashtag;
    return decorateTag({
        fname: hashtag.fname,
        engine,
        position,
        config,
        note,
    });
};
exports.decorateHashTag = decorateHashTag;
async function decorateTag({ fname, engine, position, lineOffset, config, note, }) {
    let color;
    const { color: foundColor, type: colorType } = common_all_1.NoteUtils.color({
        fname,
        note,
        // engine,
    });
    const enableRandomlyColoredTags = common_all_1.ConfigUtils.getPublishing(config).enableRandomlyColoredTags;
    if (colorType === "configured" || enableRandomlyColoredTags) {
        color = foundColor;
    }
    const { type, errors } = await (0, wikilinks_1.linkedNoteType)({
        fname,
        engine,
        vaults: config.workspace?.vaults ?? [],
    });
    const decoration = {
        type,
        range: (0, common_all_1.position2VSCodeRange)(position, { line: lineOffset }),
        color,
    };
    return { errors, decorations: [decoration] };
}
//# sourceMappingURL=hashTags.js.map