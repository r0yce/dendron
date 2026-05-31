"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteUtilsWeb = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const inject_1 = require("../../di/inject");
let SiteUtilsWeb = class SiteUtilsWeb {
    siteUrl;
    siteIndex;
    assetsPrefix;
    enablePrettyLinks;
    constructor(siteUrl, siteIndex, assetsPrefix, enablePrettyLinks) {
        this.siteUrl = siteUrl;
        this.siteIndex = siteIndex;
        this.assetsPrefix = assetsPrefix;
        this.enablePrettyLinks = enablePrettyLinks;
    }
    getSiteUrlRootForVault({ vault }) {
        if (vault.siteUrl) {
            return { url: vault.siteUrl, index: vault.siteIndex };
        }
        return { url: this.siteUrl, index: this.siteIndex };
    }
    /**
     * Is the current note equivalent ot the index of the published site?
     * @returns
     */
    isIndexNote({ indexNote, note, }) {
        return indexNote ? note.fname === indexNote : common_all_1.DNodeUtils.isRoot(note);
    }
    getSiteUrlPathForNote({ pathValue, pathAnchor, addPrefix, note, }) {
        // add path prefix if valid
        let pathPrefix = "";
        if (addPrefix) {
            pathPrefix = this.assetsPrefix
                ? this.assetsPrefix + "/notes/"
                : "/notes/";
        }
        // no prefix if we are at the index note
        const isIndex = lodash_1.default.isUndefined(note)
            ? false
            : this.isIndexNote({
                indexNote: this.siteIndex,
                note,
            });
        if (isIndex) {
            return `/`;
        }
        // remove extension for pretty links
        const usePrettyLinks = this.enablePrettyLinks;
        const pathExtension = lodash_1.default.isBoolean(usePrettyLinks) && usePrettyLinks ? "" : ".html";
        // put together the url path
        return `${pathPrefix || ""}${pathValue}${pathExtension}${pathAnchor ? "#" + pathAnchor : ""}`;
    }
    /**
     * Generate url for given note
     * @param opts
     *
     */
    getNoteUrl(opts) {
        const { note, vault } = opts;
        /**
         * set to true if index node, don't append id at the end
         */
        const { url: root, index } = this.getSiteUrlRootForVault({
            vault,
        });
        if (!root) {
            throw new common_all_1.DendronError({
                message: "No siteUrl set. Please set a url root and reload workspace. Docs link: https://wiki.dendron.so/notes/ZDAEEzEeSW0xQsMBWLQp0",
            });
        }
        // if we have a note, see if we are at index
        const isIndex = lodash_1.default.isUndefined(note)
            ? false
            : this.isIndexNote({
                indexNote: index ?? undefined,
                note,
            });
        const pathValue = note.id;
        const siteUrlPath = this.getSiteUrlPathForNote({
            addPrefix: true,
            pathValue,
        });
        const link = isIndex ? root : [root, siteUrlPath].join("");
        return link;
    }
};
exports.SiteUtilsWeb = SiteUtilsWeb;
exports.SiteUtilsWeb = SiteUtilsWeb = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)(inject_1.TOKENS.SiteUrl)),
    __param(1, (0, inject_1.inject)(inject_1.TOKENS.SiteIndex)),
    __param(2, (0, inject_1.inject)(inject_1.TOKENS.AssetsPrefix)),
    __param(3, (0, inject_1.inject)(inject_1.TOKENS.EnablePrettyLinks)),
    __metadata("design:paramtypes", [String, String, String, Boolean])
], SiteUtilsWeb);
//# sourceMappingURL=SiteUtilsWeb.js.map