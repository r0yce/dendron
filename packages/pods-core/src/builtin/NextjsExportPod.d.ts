import { DendronPublishingConfig, DEngineClient, DendronConfig, NoteProps, NotePropsByIdDict, NoteDicts } from "@dendronhq/common-all";
import { execa } from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import { URI } from "vscode-uri";
import { ExportPod, ExportPodConfig, ExportPodPlantOpts } from "../basev3";
type NextjsExportPodCustomOpts = {
    overrides?: Partial<DendronPublishingConfig>;
};
export type BuildOverrides = Pick<DendronPublishingConfig, "siteUrl">;
export declare enum PublishTarget {
    GITHUB = "github"
}
export declare const mapObject: (obj: {
    [k: string]: any;
}, fn: (k: string, v: any) => any) => {
    [k: string]: any;
};
export declare const removeBodyFromNote: ({ body, ...note }: Record<string, any>) => {
    [x: string]: any;
};
export declare const removeBodyFromNotesDict: (notes: NotePropsByIdDict) => {
    [k: string]: any;
};
export type NextjsExportConfig = ExportPodConfig & NextjsExportPodCustomOpts;
type NextjsExportPlantOpts = ExportPodPlantOpts<NextjsExportConfig>;
export declare class NextjsExportPodUtils {
    static buildSiteMap(opts: {
        nextPath: string;
    }): Promise<number | undefined>;
    static getDendronConfigPath: (dest: URI) => string;
    static getNextRoot: (wsRoot: string) => string;
    static nextPathExists(opts: {
        nextPath: string;
    }): Promise<boolean>;
    static removeNextPath(opts: {
        nextPath: string;
    }): Promise<void>;
    static installDependencies(opts: {
        nextPath: string;
    }): Promise<void>;
    static cloneTemplate(opts: {
        nextPath: string;
    }): Promise<{
        error: null;
    }>;
    static updateTemplate(opts: {
        nextPath: string;
    }): Promise<void>;
    static isInitialized(opts: {
        wsRoot: string;
    }): Promise<boolean>;
    static startNextExport(opts: {
        nextPath: string;
        quiet?: boolean;
    }): Promise<execa.ExecaReturnValue<string>>;
    static startNextDev(opts: {
        nextPath: string;
        quiet?: boolean;
        windowsHide?: boolean;
    }): Promise<number | undefined>;
    static loadSidebarsFile(sidebarFilePath: string | false | undefined | null): Promise<unknown>;
}
export declare class NextjsExportPod extends ExportPod<NextjsExportConfig> {
    static id: string;
    static description: string;
    get config(): JSONSchemaType<NextjsExportConfig>;
    _renderNote({ engine, note, engineConfig, noteCacheForRenderDict, }: {
        engine: DEngineClient;
        note: NoteProps;
        engineConfig: DendronConfig;
        noteCacheForRenderDict: NoteDicts;
    }): Promise<string>;
    private _writeEnvFile;
    copyAssets({ wsRoot, config, dest, }: {
        wsRoot: string;
        config: DendronConfig;
        dest: string;
    }): Promise<void>;
    renderBodyAsMD({ note, notesDir, }: {
        note: NoteProps;
        notesDir: string;
    }): Promise<void>;
    renderBodyToHTML({ engine, note, notesDir, engineConfig, noteCacheForRenderDict, }: Parameters<NextjsExportPod["_renderNote"]>[0] & {
        notesDir: string;
        engineConfig: DendronConfig;
    }): Promise<void>;
    renderMetaToJSON({ note, notesDir, }: {
        notesDir: string;
        note: NoteProps;
    }): Promise<void>;
    plant(opts: NextjsExportPlantOpts): Promise<{
        notes: NoteProps[];
    }>;
}
export {};
