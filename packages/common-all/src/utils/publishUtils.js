"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishUtils = void 0;
const path_1 = __importDefault(require("path"));
const _1 = require(".");
class PublishUtils {
    static getPublishFM(note) {
        if (!note.custom) {
            return {};
        }
        return note.custom;
    }
    static getSEOPropsFromConfig(config) {
        const { title, twitter, description, image } = _1.ConfigUtils.getPublishing(config).seo;
        return { title, twitter, description, image };
    }
    static getSEOPropsFromNote(note) {
        const { title, created, updated, image, desc } = note;
        const { excerpt, canonicalUrl, noindex, canonicalBaseUrl, twitter } = note.custom ? note.custom : {};
        return {
            title,
            excerpt,
            description: excerpt || desc || undefined,
            updated,
            created,
            canonicalBaseUrl,
            canonicalUrl,
            noindex,
            image,
            twitter,
        };
    }
    /**
     * Path to the banner alert compoenent
     */
    static getCustomSiteBannerPathFromWorkspace(wsRoot) {
        return path_1.default.join(wsRoot, "publish", "components", "BannerAlert.tsx");
    }
    static getCustomSiteBannerPathToPublish(publishRoot) {
        return path_1.default.join(publishRoot, "custom", "BannerAlert.tsx");
    }
    /**
     * Site banner uses a custom react component
     */
    static hasCustomSiteBanner(config) {
        return _1.ConfigUtils.getPublishing(config).siteBanner === "custom";
    }
}
exports.PublishUtils = PublishUtils;
//# sourceMappingURL=publishUtils.js.map