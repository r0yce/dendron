"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wikiLinks = exports.matchWikiLink = exports.LINK_REGEX_LOOSE = exports.LINK_REGEX = void 0;
/* eslint-disable func-names */
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const types_1 = require("../types");
const utilsv5_1 = require("../utilsv5");
const utils_1 = require("./utils");
exports.LINK_REGEX = /^\[\[([^\]\n]+)\]\]/;
/**
 * Does not require wiki link be the start of the word
 */
exports.LINK_REGEX_LOOSE = /\[\[([^\]\n]+)\]\]/;
const parseWikiLink = (linkMatch) => {
    linkMatch = common_all_1.NoteUtils.normalizeFname(linkMatch);
    return utils_1.LinkUtils.parseLinkV2({ linkString: linkMatch });
};
const matchWikiLink = (text) => {
    const match = exports.LINK_REGEX_LOOSE.exec(text);
    if (match) {
        const start = match.index;
        const end = match.index + match[0].length;
        const linkMatch = match[1].trim();
        const link = parseWikiLink(linkMatch);
        return { link, start, end };
    }
    return false;
};
exports.matchWikiLink = matchWikiLink;
function normalizeSpaces(link) {
    return link.replace(/ /g, "%20");
}
const plugin = function (opts) {
    attachParser(this);
    if (this.Compiler != null) {
        attachCompiler(this, opts);
    }
};
exports.wikiLinks = plugin;
function attachCompiler(proc, opts) {
    const copts = lodash_1.default.defaults(opts || {}, {
        convertObsidianLinks: false,
        useId: false,
    });
    const Compiler = proc.Compiler;
    const visitors = Compiler.prototype.visitors;
    if (visitors) {
        visitors.wikiLink = function (node) {
            const pOpts = utilsv5_1.MDUtilsV5.getProcOpts(proc);
            const data = node.data;
            let value = node.value;
            const { anchorHeader } = data;
            if (pOpts.mode === utilsv5_1.ProcMode.NO_DATA) {
                const link = value;
                const calias = data.alias !== value ? `${data.alias}|` : "";
                const anchor = anchorHeader ? `#${anchorHeader}` : "";
                const vaultPrefix = data.vaultName
                    ? `${common_all_1.CONSTANTS.DENDRON_DELIMETER}${data.vaultName}/`
                    : "";
                return `[[${calias}${vaultPrefix}${link}${anchor}]]`;
            }
            const { dest, noteCacheForRenderDict, vaults, config } = utilsv5_1.MDUtilsV5.getProcData(proc);
            let alias = data.alias;
            const shouldApplyPublishingRules = utilsv5_1.MDUtilsV5.shouldApplyPublishingRules(proc);
            const enableNoteTitleForLink = common_all_1.ConfigUtils.getEnableNoteTitleForLink(config, shouldApplyPublishingRules);
            if (dest !== types_1.DendronASTDest.MD_DENDRON &&
                enableNoteTitleForLink &&
                !data.alias) {
                if (noteCacheForRenderDict) {
                    const targetVault = data.vaultName
                        ? common_all_1.VaultUtils.getVaultByName({ vname: data.vaultName, vaults })
                        : undefined;
                    const target = common_all_1.NoteDictsUtils.findByFname({
                        fname: value,
                        noteDicts: noteCacheForRenderDict,
                        vault: targetVault,
                    })[0];
                    if (target) {
                        alias = target.title;
                    }
                }
            }
            // if converting back to dendron md, no further processing
            if (dest === types_1.DendronASTDest.MD_DENDRON) {
                return utils_1.LinkUtils.renderNoteLink({
                    link: {
                        from: {
                            fname: value,
                            alias,
                            anchorHeader: data.anchorHeader,
                            vaultName: data.vaultName,
                        },
                        data: {
                            xvault: !lodash_1.default.isUndefined(data.vaultName),
                        },
                        type: utils_1.LinkUtils.astType2DLinkType(types_1.DendronASTTypes.WIKI_LINK),
                        position: node.position,
                    },
                    dest,
                });
            }
            if (copts.useId && dest === types_1.DendronASTDest.HTML) {
                let notes;
                const { noteCacheForRenderDict } = utilsv5_1.MDUtilsV5.getProcData(proc);
                // TODO: Consolidate logic.
                if (noteCacheForRenderDict) {
                    // TODO: Add vault filter
                    notes = common_all_1.NoteDictsUtils.findByFname({
                        fname: alias,
                        noteDicts: noteCacheForRenderDict,
                    });
                }
                else {
                    return "error - no note cache provided";
                }
                const { error, note } = (0, utils_1.getNoteOrError)(notes, value);
                if (error) {
                    (0, utils_1.addError)(proc, error);
                    return "error with link";
                }
                else {
                    value = note.id;
                }
            }
            const aliasToUse = alias ?? value;
            switch (dest) {
                case types_1.DendronASTDest.MD_REGULAR: {
                    return `[${aliasToUse}](${copts.prefix || ""}${normalizeSpaces(value)})`;
                }
                case types_1.DendronASTDest.HTML: {
                    return `[${aliasToUse}](${copts.prefix || ""}${value}.html${data.anchorHeader ? "#" + data.anchorHeader : ""})`;
                }
                default:
                    return `unhandled case: ${dest}`;
            }
        };
    }
}
function attachParser(proc) {
    function locator(value, fromIndex) {
        return value.indexOf("[", fromIndex);
    }
    function parseLink(linkMatch) {
        const pOpts = utilsv5_1.MDUtilsV5.getProcOpts(proc);
        linkMatch = common_all_1.NoteUtils.normalizeFname(linkMatch);
        const out = utils_1.LinkUtils.parseLinkV2({
            linkString: linkMatch,
            explicitAlias: true,
        });
        if (lodash_1.default.isNull(out)) {
            throw new common_all_1.DendronError({ message: `link is null: ${linkMatch}` });
        }
        if (pOpts.mode === utilsv5_1.ProcMode.NO_DATA) {
            return out;
        }
        const procData = utilsv5_1.MDUtilsV5.getProcData(proc);
        const { fname } = procData;
        if (!out.value) {
            // same file block reference, value is implicitly current file
            out.value = lodash_1.default.trim(common_all_1.NoteUtils.normalizeFname(fname)); // recreate what value would have been parsed
        }
        return out;
    }
    function inlineTokenizer(eat, value) {
        const match = exports.LINK_REGEX.exec(value);
        if (match) {
            const linkMatch = match[1].trim();
            try {
                const { value, alias, anchorHeader, vaultName, sameFile } = parseLink(linkMatch);
                return eat(match[0])({
                    type: types_1.DendronASTTypes.WIKI_LINK,
                    // @ts-ignore
                    value,
                    data: {
                        alias,
                        anchorHeader,
                        vaultName,
                        sameFile,
                    },
                });
            }
            catch {
                // Broken link, just refuse to parse it
                return;
            }
        }
        return;
    }
    inlineTokenizer.locator = locator;
    const Parser = proc.Parser;
    const inlineTokenizers = Parser.prototype.inlineTokenizers;
    const inlineMethods = Parser.prototype.inlineMethods;
    inlineTokenizers.wikiLink = inlineTokenizer;
    inlineMethods.splice(inlineMethods.indexOf("link"), 0, "wikiLink");
}
//# sourceMappingURL=wikiLinks.js.map