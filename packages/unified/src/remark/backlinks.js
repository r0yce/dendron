"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backlinks = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const mdast_builder_1 = require("mdast-builder");
const unist_builder_1 = __importDefault(require("unist-builder"));
const SiteUtils_1 = require("../SiteUtils");
const types_1 = require("../types");
const utilsv5_1 = require("../utilsv5");
// Plugin that adds backlinks at the end of each page if they exist
// eslint-disable-next-line func-names
const plugin = function () {
    const proc = this;
    function transformer(tree) {
        const root = tree;
        const { fname, dest, insideNoteRef, config, noteToRender, noteCacheForRenderDict, vaults, wsRoot, } = utilsv5_1.MDUtilsV5.getProcData(proc);
        // Don't show backlinks for the following cases:
        // - we are inside a note ref
        // - the destination isn't HTML
        // - the note can't be found
        // - enableChild links is toggled off
        // - enableBackLinks is set to false
        if (!fname || insideNoteRef) {
            return;
        }
        if (dest !== types_1.DendronASTDest.HTML) {
            return;
        }
        const note = noteToRender;
        if (lodash_1.default.isUndefined(note)) {
            return;
        }
        if (common_all_1.ConfigUtils.getEnableBackLinks(config, {
            note,
            shouldApplyPublishingRules: utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(proc),
        }) === false) {
            return;
        }
        let backlinksToPublish = lodash_1.default.uniqBy((note?.links || []).filter((ent) => ent.type === "backlink"), (ent) => ent.from.fname + (ent.from.vaultName || ""));
        // filter out invalid backlinks
        backlinksToPublish = lodash_1.default.filter(backlinksToPublish, (backlink) => {
            const vaultName = backlink.from.vaultName;
            const vault = common_all_1.VaultUtils.getVaultByName({
                vaults,
                vname: vaultName,
            });
            if (!noteCacheForRenderDict) {
                return false;
            }
            const note = common_all_1.NoteDictsUtils.findByFname({
                fname: backlink.from.fname,
                noteDicts: noteCacheForRenderDict,
                vault,
            })[0];
            // if note doesn't exist, don't include in backlinks
            if (!note) {
                return false;
            }
            // if note exists but it can't be published, don't include
            const out = SiteUtils_1.SiteUtils.canPublish({
                note,
                config,
                wsRoot,
                vaults,
            });
            return out;
        });
        if (!lodash_1.default.isEmpty(backlinksToPublish)) {
            root.children.push({
                type: "thematicBreak",
            });
            root.children.push((0, unist_builder_1.default)("strong", [{ type: "text", value: "Backlinks" }]));
            root.children.push((0, mdast_builder_1.list)("unordered", backlinksToPublish.map((mdLink) => {
                let alias;
                const notes = common_all_1.NoteDictsUtils.findByFname({
                    fname: mdLink.from.fname,
                    noteDicts: noteCacheForRenderDict,
                    vault: common_all_1.VaultUtils.getVaultByName({
                        vaults,
                        vname: mdLink.from.vaultName,
                    }),
                });
                const note = notes[0];
                if (note) {
                    alias =
                        note.title +
                            (vaults && vaults.length > 1
                                ? ` (${mdLink.from.vaultName})`
                                : "");
                }
                else {
                    alias = `Unable to find backlinked note ${mdLink.from.fname}.`;
                }
                return (0, mdast_builder_1.listItem)((0, mdast_builder_1.paragraph)({
                    type: types_1.DendronASTTypes.WIKI_LINK,
                    value: mdLink.from.fname,
                    data: {
                        alias,
                        vaultName: mdLink.from.vaultName,
                    },
                    children: [],
                }));
            })));
        }
        // end transformer
    }
    return transformer;
};
exports.backlinks = plugin;
//# sourceMappingURL=backlinks.js.map