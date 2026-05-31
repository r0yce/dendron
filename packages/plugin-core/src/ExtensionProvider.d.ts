import { IDendronExtension } from "./dendronExtensionInterface";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
/**
 * Use this to statically get implementation of IDendronExtension without having to
 * depend on concrete DendronExtension.
 *
 * Note: Prefer to get IDendronExtension injected into your classes upon their
 * construction rather than statically getting it from here. But if that's not
 * a fitting option then use this class.
 * */
export declare class ExtensionProvider {
    private static extension;
    static getExtension(): IDendronExtension;
    static getCommentThreadsState(): {
        inlineNoteRefs: import("@dendronhq/common-all").DefaultMap<string, Map<string, import("vscode").CommentThread>>;
    };
    static getDWorkspace(): import("@dendronhq/common-all").DWorkspaceV2;
    static getEngine(): import("./services/EngineAPIServiceInterface").IEngineAPIService;
    static getWSUtils(): IWSUtilsV2;
    static isActive(): boolean;
    static isActiveAndIsDendronNote(fpath: string): Promise<boolean>;
    static getWorkspaceConfig(): import("vscode").WorkspaceConfiguration;
    static register(extension: IDendronExtension): void;
    static getPodsDir(): string;
}
