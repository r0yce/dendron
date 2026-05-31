"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionProvider = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const fs_extra_1 = require("fs-extra");
const lodash_1 = __importDefault(require("lodash"));
/**
 * Use this to statically get implementation of IDendronExtension without having to
 * depend on concrete DendronExtension.
 *
 * Note: Prefer to get IDendronExtension injected into your classes upon their
 * construction rather than statically getting it from here. But if that's not
 * a fitting option then use this class.
 * */
class ExtensionProvider {
    static extension;
    static getExtension() {
        if (lodash_1.default.isUndefined(ExtensionProvider.extension)) {
            throw new common_all_1.DendronError({
                message: `Extension is not yet registered. Make sure initialization registers extension prior to usage.`,
            });
        }
        return ExtensionProvider.extension;
    }
    static getCommentThreadsState() {
        return ExtensionProvider.extension.getCommentThreadsState();
    }
    static getDWorkspace() {
        return ExtensionProvider.getExtension().getDWorkspace();
    }
    static getEngine() {
        return ExtensionProvider.getExtension().getEngine();
    }
    static getWSUtils() {
        return ExtensionProvider.getExtension().wsUtils;
    }
    static isActive() {
        return ExtensionProvider.getExtension().isActive();
    }
    static isActiveAndIsDendronNote(fpath) {
        return ExtensionProvider.getExtension().isActiveAndIsDendronNote(fpath);
    }
    static getWorkspaceConfig() {
        return ExtensionProvider.getExtension().getWorkspaceConfig();
    }
    static register(extension) {
        ExtensionProvider.extension = extension;
    }
    static getPodsDir() {
        const { wsRoot } = ExtensionProvider.getDWorkspace();
        const podsDir = pods_core_1.PodUtils.getPodDir({ wsRoot });
        (0, fs_extra_1.ensureDirSync)(podsDir);
        return podsDir;
    }
}
exports.ExtensionProvider = ExtensionProvider;
//# sourceMappingURL=ExtensionProvider.js.map